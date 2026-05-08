/**
 * PrinterSettingsDialog.tsx
 * Dialog pengaturan printer Bluetooth thermal.
 * Memungkinkan user mengatur nama toko, ukuran kertas, auto-print, dll.
 */

import * as React from 'react';
import {
  Bluetooth,
  BluetoothOff,
  Printer,
  Settings2,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TestTube2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PrinterConfig, PrinterStatus } from '../services/thermalPrinterService';

interface PrinterSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  status: PrinterStatus;
  config: PrinterConfig;
  autoPrint: boolean;
  isSupported: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onUpdateConfig: (updates: Partial<PrinterConfig>) => void;
  onToggleAutoPrint: () => void;
  onTestPrint: () => void;
}

const STATUS_INFO: Record<PrinterStatus, { label: string; color: string; icon: React.ReactNode }> = {
  connected:    { label: 'Terhubung',      color: 'text-emerald-600', icon: <CheckCircle2 className="w-4 h-4" /> },
  connecting:   { label: 'Menghubungkan…', color: 'text-amber-500',   icon: <Loader2 className="w-4 h-4 animate-spin" /> },
  printing:     { label: 'Mencetak…',      color: 'text-blue-600',    icon: <Printer className="w-4 h-4 animate-pulse" /> },
  error:        { label: 'Error',           color: 'text-rose-600',    icon: <AlertCircle className="w-4 h-4" /> },
  disconnected: { label: 'Tidak Terhubung', color: 'text-slate-400',  icon: <BluetoothOff className="w-4 h-4" /> },
};

export const PrinterSettingsDialog: React.FC<PrinterSettingsDialogProps> = ({
  isOpen,
  onClose,
  status,
  config,
  autoPrint,
  isSupported,
  onConnect,
  onDisconnect,
  onUpdateConfig,
  onToggleAutoPrint,
  onTestPrint,
}) => {
  const info = STATUS_INFO[status];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100%-3rem)] sm:max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center">
                <Settings2 className="w-5 h-5 text-slate-600" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900">Pengaturan Printer</DialogTitle>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Browser Support Warning */}
          {!isSupported && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">Browser Tidak Didukung</p>
                <p className="text-xs text-amber-700 mt-1">
                  Web Bluetooth hanya didukung di Chrome/Edge (desktop & Android). 
                  Gunakan browser tersebut untuk fitur printer.
                </p>
              </div>
            </div>
          )}

          {/* Connection Status Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={info.color}>{info.icon}</span>
                <span className={cn("text-sm font-bold", info.color)}>{info.label}</span>
              </div>
              <div className="flex gap-2">
                {(status === 'disconnected' || status === 'error') && isSupported && (
                  <Button
                    onClick={onConnect}
                    disabled={status === 'connecting'}
                    className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-none"
                  >
                    <Bluetooth className="w-3.5 h-3.5 mr-1.5" />
                    Cari Printer
                  </Button>
                )}
                {(status === 'connected' || status === 'printing') && (
                  <>
                    <Button
                      onClick={onTestPrint}
                      disabled={status === 'printing'}
                      variant="outline"
                      className="h-9 px-4 rounded-xl text-xs font-bold border-slate-200"
                    >
                      <TestTube2 className="w-3.5 h-3.5 mr-1.5" />
                      Test Print
                    </Button>
                    <Button
                      onClick={onDisconnect}
                      variant="outline"
                      className="h-9 px-4 rounded-xl text-xs font-bold border-rose-200 text-rose-600 hover:bg-rose-50"
                    >
                      Putuskan
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Auto Print Toggle */}
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div>
              <p className="text-sm font-bold text-slate-900">Auto Print Struk</p>
              <p className="text-xs text-slate-400 mt-0.5">Otomatis cetak setiap transaksi berhasil</p>
            </div>
            <button
              onClick={onToggleAutoPrint}
              disabled={!isSupported}
              className="transition-all active:scale-95"
            >
              {autoPrint
                ? <ToggleRight className="w-9 h-9 text-emerald-500" />
                : <ToggleLeft className="w-9 h-9 text-slate-300" />
              }
            </button>
          </div>

          {/* Config Form */}
          <div className="space-y-4">
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.15em]">Info Struk</p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Nama Toko *</label>
              <Input
                value={config.storeName}
                onChange={e => onUpdateConfig({ storeName: e.target.value })}
                placeholder="Nama toko Anda"
                className="h-12 rounded-xl border-slate-200 text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Alamat Toko</label>
              <Input
                value={config.storeAddress ?? ''}
                onChange={e => onUpdateConfig({ storeAddress: e.target.value })}
                placeholder="Jl. Contoh No. 1, Bandung"
                className="h-12 rounded-xl border-slate-200 text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">No. Telepon</label>
              <Input
                value={config.storePhone ?? ''}
                onChange={e => onUpdateConfig({ storePhone: e.target.value })}
                placeholder="08xxxxxxxxxx"
                className="h-12 rounded-xl border-slate-200 text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Pesan Footer</label>
              <Input
                value={config.footerMessage ?? ''}
                onChange={e => onUpdateConfig({ footerMessage: e.target.value })}
                placeholder="Terima kasih sudah berkunjung!"
                className="h-12 rounded-xl border-slate-200 text-sm font-medium"
              />
            </div>

            {/* Paper Width Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Lebar Kertas</label>
              <div className="grid grid-cols-2 gap-2">
                {([48, 32] as const).map(w => (
                  <button
                    key={w}
                    onClick={() => onUpdateConfig({ paperWidth: w })}
                    className={cn(
                      "h-12 rounded-xl text-sm font-bold border-2 transition-all",
                      config.paperWidth === w
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                    )}
                  >
                    {w === 48 ? '80mm (48 char)' : '58mm (32 char)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Info Note */}
          <p className="text-[11px] text-slate-400 text-center">
            Konfigurasi tersimpan otomatis di perangkat ini.
            <br />Kompatibel: Epson TM, SUNMI, RPP, Xprinter, Gainscha (BLE/SPP)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
