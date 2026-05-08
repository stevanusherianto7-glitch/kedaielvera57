/**
 * thermalPrinterService.ts
 * Auto-print struk untuk printer Bluetooth thermal (ESC/POS protocol)
 * Mendukung Web Bluetooth API (Chrome/Edge Android & Desktop)
 *
 * Kompatibel dengan: Epson TM, SUNMI, Gainscha, iDPRT, Xprinter, RPP series
 */

// ─── ESC/POS Command Constants ───────────────────────────────────────────────
const ESC  = 0x1B;
const GS   = 0x1D;
const FS   = 0x1C;

const CMD = {
  INIT:           [ESC, 0x40],                         // Initialize printer
  LF:             [0x0A],                              // Line Feed
  CUT_PARTIAL:    [GS, 0x56, 0x01],                   // Partial cut
  CUT_FULL:       [GS, 0x56, 0x00],                   // Full cut
  ALIGN_LEFT:     [ESC, 0x61, 0x00],
  ALIGN_CENTER:   [ESC, 0x61, 0x01],
  ALIGN_RIGHT:    [ESC, 0x61, 0x02],
  BOLD_ON:        [ESC, 0x45, 0x01],
  BOLD_OFF:       [ESC, 0x45, 0x00],
  DOUBLE_HEIGHT:  [ESC, 0x21, 0x10],                  // Double height text
  NORMAL_TEXT:    [ESC, 0x21, 0x00],                  // Normal size
  CHAR_SPACING:   [ESC, 0x20, 0x00],
};

// ─── Bluetooth Service UUIDs ──────────────────────────────────────────────────
// Most ESC/POS Bluetooth printers use SSP (Serial Port Profile) or BLE Nordic UART
const PRINTER_SERVICE_UUID  = '000018f0-0000-1000-8000-00805f9b34fb';
const PRINTER_CHAR_UUID     = '00002af1-0000-1000-8000-00805f9b34fb';

// BLE Nordic UART Service (common in many cheap thermal printers)
const NORDIC_UART_SERVICE   = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const NORDIC_UART_TX_CHAR   = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // Write to printer

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PrinterConfig {
  paperWidth: 48 | 32;          // chars per line: 48 for 80mm, 32 for 58mm
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  footerMessage?: string;
}

export interface ReceiptData {
  orderId: string;
  date: string;
  items: { name: string; quantity: number; price: number }[];
  totalPrice: number;
  paymentMethod: string;
  cashReceived?: number;
}

export type PrinterStatus = 'disconnected' | 'connecting' | 'connected' | 'printing' | 'error';

// ─── State (module-level singleton) ──────────────────────────────────────────
let _device: BluetoothDevice | null = null;
let _characteristic: BluetoothRemoteGATTCharacteristic | null = null;
let _status: PrinterStatus = 'disconnected';
let _statusListeners: ((s: PrinterStatus) => void)[] = [];

function setStatus(s: PrinterStatus) {
  _status = s;
  _statusListeners.forEach(fn => fn(s));
}

export function getPrinterStatus(): PrinterStatus {
  return _status;
}

export function onPrinterStatusChange(fn: (s: PrinterStatus) => void): () => void {
  _statusListeners.push(fn);
  return () => { _statusListeners = _statusListeners.filter(f => f !== fn); };
}

// ─── Check Web Bluetooth Support ─────────────────────────────────────────────
export function isBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

// ─── Connect to Printer ───────────────────────────────────────────────────────
export async function connectBluetoothPrinter(): Promise<boolean> {
  if (!isBluetoothSupported()) {
    console.warn('[Printer] Web Bluetooth not supported in this browser.');
    return false;
  }

  try {
    setStatus('connecting');

    const device = await (navigator as any).bluetooth.requestDevice({
      filters: [
        { services: [PRINTER_SERVICE_UUID] },
        { services: [NORDIC_UART_SERVICE] },
        { namePrefix: 'Printer' },
        { namePrefix: 'RPP' },
        { namePrefix: 'MTP' },
        { namePrefix: 'Xprinter' },
        { namePrefix: 'SUNMI' },
        { namePrefix: 'PT-' },
        { namePrefix: 'BT-' },
        { namePrefix: 'POS' },
      ],
      optionalServices: [PRINTER_SERVICE_UUID, NORDIC_UART_SERVICE],
    });

    _device = device;
    _device!.addEventListener('gattserverdisconnected', () => {
      _characteristic = null;
      _device = null;
      setStatus('disconnected');
    });

    const server = await device.gatt!.connect();

    // Try standard printer service first, fallback to Nordic UART
    let characteristic: BluetoothRemoteGATTCharacteristic | null = null;
    try {
      const service = await server.getPrimaryService(PRINTER_SERVICE_UUID);
      characteristic = await service.getCharacteristic(PRINTER_CHAR_UUID);
    } catch {
      try {
        const service = await server.getPrimaryService(NORDIC_UART_SERVICE);
        characteristic = await service.getCharacteristic(NORDIC_UART_TX_CHAR);
      } catch {
        throw new Error('Tidak dapat menemukan service printer yang kompatibel.');
      }
    }

    _characteristic = characteristic;
    setStatus('connected');
    console.log('[Printer] Terhubung ke:', device.name);
    return true;

  } catch (err: any) {
    console.error('[Printer] Gagal terhubung:', err);
    setStatus('error');
    return false;
  }
}

// ─── Disconnect ───────────────────────────────────────────────────────────────
export function disconnectBluetoothPrinter() {
  if (_device?.gatt?.connected) {
    _device.gatt.disconnect();
  }
  _characteristic = null;
  _device = null;
  setStatus('disconnected');
}

// ─── Low-level Write ──────────────────────────────────────────────────────────
async function writeRaw(data: Uint8Array): Promise<void> {
  if (!_characteristic) throw new Error('Printer tidak terhubung.');

  // Chunk write to avoid BLE MTU limit (typically 20 bytes, safe at 512 with negotiate)
  const CHUNK = 512;
  for (let offset = 0; offset < data.length; offset += CHUNK) {
    const chunk = data.slice(offset, offset + CHUNK);
    await _characteristic.writeValueWithoutResponse(chunk);
    // Small delay to prevent overflow on budget printers
    await new Promise(r => setTimeout(r, 20));
  }
}

// ─── ESC/POS Builder ──────────────────────────────────────────────────────────
function buildBytes(...parts: (number[] | Uint8Array | string)[]): Uint8Array {
  const encoder = new TextEncoder();
  const arrays: Uint8Array[] = parts.map(p => {
    if (typeof p === 'string') return encoder.encode(p);
    if (p instanceof Uint8Array) return p;
    return new Uint8Array(p);
  });
  const total = arrays.reduce((acc, a) => acc + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// ─── String Helpers ───────────────────────────────────────────────────────────
function padRight(str: string, len: number): string {
  return str.substring(0, len).padEnd(len);
}

function padLeft(str: string, len: number): string {
  return str.substring(0, len).padStart(len);
}

function centerText(str: string, width: number): string {
  const pad = Math.max(0, Math.floor((width - str.length) / 2));
  return ' '.repeat(pad) + str;
}

function separator(char: string, width: number): string {
  return char.repeat(width) + '\n';
}

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function twoColumn(left: string, right: string, width: number): string {
  const maxLeft = width - right.length - 1;
  return padRight(left, maxLeft) + ' ' + right + '\n';
}

// ─── Build Receipt Buffer ─────────────────────────────────────────────────────
function buildReceiptBuffer(receipt: ReceiptData, config: PrinterConfig): Uint8Array {
  const W = config.paperWidth; // chars per line
  const enc = new TextEncoder();

  const lines: (number[] | string)[] = [];
  const push = (...cmds: (number[] | string)[]) => lines.push(...cmds);

  // Init
  push(CMD.INIT);

  // ── Store Header ──
  push(CMD.ALIGN_CENTER, CMD.BOLD_ON, CMD.DOUBLE_HEIGHT);
  push(config.storeName.toUpperCase() + '\n');
  push(CMD.NORMAL_TEXT, CMD.BOLD_OFF);

  if (config.storeAddress) push(config.storeAddress + '\n');
  if (config.storePhone)   push(`Tel: ${config.storePhone}\n`);
  push(CMD.LF);

  // ── Divider ──
  push(CMD.ALIGN_LEFT);
  push(separator('=', W));

  // ── Order Info ──
  push(`Order  : #${receipt.orderId.slice(0, 10).toUpperCase()}\n`);
  push(`Tanggal: ${new Date(receipt.date).toLocaleString('id-ID', {
    dateStyle: 'short', timeStyle: 'short'
  })}\n`);
  push(`Bayar  : ${receipt.paymentMethod}\n`);
  push(separator('-', W));

  // ── Items ──
  push(CMD.BOLD_ON);
  push(twoColumn('ITEM', 'HARGA', W));
  push(CMD.BOLD_OFF);
  push(separator('-', W));

  receipt.items.forEach(item => {
    const itemName = item.name.substring(0, W - 12);
    const subtotal = item.price * item.quantity;
    push(`${itemName}\n`);
    push(twoColumn(`  ${item.quantity}x ${formatIDR(item.price)}`, formatIDR(subtotal), W));
  });

  push(separator('=', W));

  // ── Total ──
  push(CMD.BOLD_ON);
  push(twoColumn('TOTAL', formatIDR(receipt.totalPrice), W));
  push(CMD.BOLD_OFF);

  if (receipt.cashReceived && receipt.cashReceived > 0) {
    push(twoColumn('Tunai', formatIDR(receipt.cashReceived), W));
    push(CMD.BOLD_ON);
    push(twoColumn('Kembalian', formatIDR(receipt.cashReceived - receipt.totalPrice), W));
    push(CMD.BOLD_OFF);
  }

  push(separator('=', W));

  // ── Footer ──
  push(CMD.ALIGN_CENTER);
  push((config.footerMessage || 'Terima kasih sudah berkunjung!') + '\n');
  push('Powered by POSGO\n');
  push(CMD.LF, CMD.LF, CMD.LF);

  // ── Paper Cut ──
  push(CMD.CUT_PARTIAL);

  // Build raw bytes
  return buildBytes(...lines.map(l =>
    typeof l === 'string' ? l : l
  ));
}

// ─── Main Print Function ──────────────────────────────────────────────────────
/**
 * Print struk setelah transaksi.
 * Jika printer belum terhubung, akan skip dengan warning.
 * Untuk connect printer, panggil connectBluetoothPrinter() terlebih dahulu.
 */
export async function printReceipt(
  receipt: ReceiptData,
  config: PrinterConfig
): Promise<{ success: boolean; error?: string }> {
  if (_status !== 'connected' || !_characteristic) {
    return { success: false, error: 'Printer Bluetooth tidak terhubung.' };
  }

  try {
    setStatus('printing');
    const buffer = buildReceiptBuffer(receipt, config);
    await writeRaw(buffer);
    setStatus('connected');
    return { success: true };
  } catch (err: any) {
    console.error('[Printer] Print error:', err);
    setStatus('error');
    // Try to recover connection state
    if (!_device?.gatt?.connected) {
      _characteristic = null;
      setStatus('disconnected');
    } else {
      setStatus('connected');
    }
    return { success: false, error: err.message };
  }
}

// ─── Auto Print Helper (called from SalesSync after transaction) ──────────────
/**
 * Panggil ini tepat setelah transaksi berhasil diproses.
 * Fungsi ini tidak throw — semua error dicatat di console saja
 * agar tidak mengganggu flow utama POS.
 */
export async function autoPrintReceipt(
  receipt: ReceiptData,
  config: PrinterConfig
): Promise<void> {
  if (_status !== 'connected') {
    // Printer not connected — silent skip, no disruption to POS flow
    return;
  }
  const result = await printReceipt(receipt, config);
  if (!result.success) {
    console.warn('[AutoPrint] Gagal cetak struk:', result.error);
  }
}
