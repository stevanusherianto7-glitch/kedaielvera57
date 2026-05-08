/**
 * useThermalPrinter.ts
 * React hook untuk manajemen printer Bluetooth thermal.
 * Menyimpan konfigurasi toko di localStorage.
 */

import * as React from 'react';
import {
  connectBluetoothPrinter,
  disconnectBluetoothPrinter,
  autoPrintReceipt,
  onPrinterStatusChange,
  getPrinterStatus,
  isBluetoothSupported,
  PrinterConfig,
  PrinterStatus,
} from '../services/thermalPrinterService';
import { Transaction } from '../types';

const CONFIG_KEY = 'posgo-printer-config';

const DEFAULT_CONFIG: PrinterConfig = {
  paperWidth: 48,
  storeName: 'ENGINE STATION',
  storeAddress: '',
  storePhone: '',
  footerMessage: 'Terima kasih atas kunjungan Anda!',
};

function loadConfig(): PrinterConfig {
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return DEFAULT_CONFIG;
}

function saveConfig(config: PrinterConfig) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch { /* ignore */ }
}

export function useThermalPrinter() {
  const [status, setStatus] = React.useState<PrinterStatus>(getPrinterStatus);
  const [config, setConfigState] = React.useState<PrinterConfig>(loadConfig);
  const [autoPrint, setAutoPrintState] = React.useState<boolean>(() => {
    try { return localStorage.getItem('posgo-auto-print') === 'true'; } catch { return false; }
  });

  // Subscribe to printer status changes
  React.useEffect(() => {
    const unsub = onPrinterStatusChange(setStatus);
    return unsub;
  }, []);

  const connect = React.useCallback(async () => {
    await connectBluetoothPrinter();
  }, []);

  const disconnect = React.useCallback(() => {
    disconnectBluetoothPrinter();
  }, []);

  const updateConfig = React.useCallback((updates: Partial<PrinterConfig>) => {
    setConfigState(prev => {
      const next = { ...prev, ...updates };
      saveConfig(next);
      return next;
    });
  }, []);

  const toggleAutoPrint = React.useCallback((value?: boolean) => {
    setAutoPrintState(prev => {
      const next = value !== undefined ? value : !prev;
      try { localStorage.setItem('posgo-auto-print', String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  /**
   * Cetak struk dari objek Transaction.
   * Dipanggil otomatis di SalesSync setelah handleSubmit jika autoPrint aktif.
   */
  const printTransaction = React.useCallback(async (transaction: Transaction) => {
    if (!autoPrint) return;
    await autoPrintReceipt(
      {
        orderId: transaction.id,
        date: transaction.date,
        items: transaction.items.map(i => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
        totalPrice: transaction.totalPrice,
        paymentMethod: transaction.paymentMethod,
      },
      config
    );
  }, [autoPrint, config]);

  return {
    status,
    config,
    autoPrint,
    isSupported: isBluetoothSupported(),
    connect,
    disconnect,
    updateConfig,
    toggleAutoPrint,
    printTransaction,
  };
}
