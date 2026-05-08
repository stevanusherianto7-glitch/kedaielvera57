import * as React from 'react';
import { motion } from 'motion/react';
import { 
  ShoppingCart, 
  TrendingUp, 
  LayoutDashboard, 
  Package, 
  Clock, 
  ChevronRight,
  Sun,
  Moon,
  Bluetooth,
  BluetoothOff,
  Settings2
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { Ingredient, Transaction, Recipe, PromoEvent } from '../types';
import { SalesSync } from './SalesSync';

interface EngineDashboardProps {
  transactions: Transaction[];
  ingredients: Ingredient[];
  recipes: Recipe[];
  promoEvents: PromoEvent[];
  onTabChange: (tab: string) => void;
  onProcessTransaction: (transaction: Transaction) => void;
  theme?: 'light' | 'dark';
  toggleTheme?: () => void;
  // Printer props
  onPrintTransaction?: (transaction: Transaction) => Promise<void>;
  printerStatus?: 'disconnected' | 'connecting' | 'connected' | 'printing' | 'error';
  onConnectPrinter?: () => void;
  onDisconnectPrinter?: () => void;
  autoPrint?: boolean;
  onToggleAutoPrint?: () => void;
  onOpenPrinterSettings?: () => void;
}

export function EngineDashboard({
  transactions,
  ingredients,
  recipes,
  promoEvents = [],
  onTabChange,
  onProcessTransaction,
  theme = 'dark',
  toggleTheme,
  onPrintTransaction,
  printerStatus = 'disconnected',
  onConnectPrinter,
  onDisconnectPrinter,
  autoPrint = false,
  onToggleAutoPrint,
  onOpenPrinterSettings,
}: EngineDashboardProps) {
  const [isSalesSyncOpen, setIsSalesSyncOpen] = React.useState(false);

  const totalSales = transactions.reduce((acc, t) => acc + t.totalPrice, 0);
  const outOfStockCount = ingredients.filter(i => i.stockQuantity <= 0).length;
  const criticalStockCount = ingredients.filter(i => i.stockQuantity > 0 && i.stockQuantity <= i.lowStockThreshold).length;

  const printerIcon = printerStatus === 'connected'
    ? <Bluetooth className="w-5 h-5 text-emerald-400" />
    : <BluetoothOff className="w-5 h-5 text-slate-400" />;

  return (
    <div className={cn(
      "min-h-screen font-sans selection:bg-emerald-500 selection:text-white pb-32 -m-8 lg:-m-12 transition-colors duration-500",
      theme === 'dark' ? "bg-[#0a0c10] text-[#f8fafc]" : "bg-slate-50 text-slate-900"
    )}>
      {/* Header */}
      <header className={cn(
        "px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md transition-colors",
        theme === 'dark' ? "bg-[#0a0c10]/80" : "bg-slate-50/80"
      )}>
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-heading font-black uppercase tracking-[0.3em] text-emerald-500 block leading-tight">Sistem POS Smart</span>
            <span className="text-lg font-heading font-black tracking-tighter uppercase leading-none italic text-emerald-500">POSGO</span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* Printer Status Button */}
          <button
            type="button"
            onClick={printerStatus === 'connected' ? onDisconnectPrinter : onConnectPrinter}
            title={printerStatus === 'connected' ? 'Putuskan Printer' : 'Hubungkan Printer'}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 relative",
              theme === 'dark' ? "bg-slate-900 border border-slate-800" : "bg-white border border-slate-200",
              printerStatus === 'connecting' && "animate-pulse"
            )}
          >
            {printerIcon}
            {printerStatus === 'connected' && autoPrint && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0a0c10]" />
            )}
          </button>

          {/* Printer Settings */}
          {onOpenPrinterSettings && (
            <button
              type="button"
              onClick={onOpenPrinterSettings}
              title="Pengaturan Printer"
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90",
                theme === 'dark' ? "bg-slate-900 border border-slate-800" : "bg-white border border-slate-200"
              )}
            >
              <Settings2 className="w-4 h-4 text-slate-400" />
            </button>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90",
              theme === 'dark' ? "bg-slate-900 border border-slate-800" : "bg-white border border-slate-200"
            )}
          >
            {theme === 'light' ? <Moon className="w-5 h-5 text-slate-400" /> : <Sun className="w-5 h-5 text-slate-400" />}
          </button>
        </div>
      </header>

      {/* Main Stats Card */}
      <section className="px-6 mb-12">
        <motion.div
          whileHover={{ y: -4 }}
          className={cn(
            "relative overflow-hidden group p-8 rounded-[2.5rem] border shadow-2xl transition-all duration-500",
            theme === 'dark'
              ? "bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-slate-800"
              : "bg-white border-slate-100"
          )}
        >
          <div className="absolute top-0 right-0 p-8">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-500 tracking-[0.2em]">OMSET</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
            <TrendingUp className="w-7 h-7 text-emerald-500" />
          </div>
          <div className="space-y-1">
            <p className="text-slate-400 font-heading font-bold uppercase text-xs tracking-widest">Total Penjualan</p>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                "text-4xl font-mono font-black tracking-tighter",
                theme === 'dark' ? "text-white" : "text-slate-900"
              )}>{formatCurrency(totalSales)}</span>
              <span className="text-emerald-500 font-mono text-sm font-bold">+12%</span>
            </div>
          </div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-700" />
        </motion.div>
      </section>

      {/* Warehouse Status */}
      <section className="px-6 mb-6">
        <div className="space-y-1">
          <h2 className="text-[11px] font-heading font-black uppercase tracking-[0.2em] text-emerald-500 leading-none">WAREHOUSE STATUS</h2>
          <p className="text-[9px] text-slate-500 font-medium leading-tight uppercase tracking-[0.1em]">stok bahan baku real-time</p>
        </div>
      </section>

      <section className="px-6 grid grid-cols-2 gap-4 mb-24">
        {[
          { label: 'Stok Habis', value: outOfStockCount.toString(), color: 'rose', icon: Package },
          { label: 'Stok Tipis', value: criticalStockCount.toString(), color: 'amber', icon: Clock }
        ].map((stat, i) => (
          <div key={i} className={cn(
            "p-6 rounded-[2rem] border flex flex-col gap-4 transition-colors",
            theme === 'dark' ? "bg-slate-900/50 border-slate-800/50" : "bg-white border-slate-100 shadow-sm"
          )}>
            <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
            </div>
            <div>
              <p className="text-[10px] font-heading font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
              <p className={cn(
                "text-2xl font-mono font-black",
                theme === 'dark' ? "text-white" : "text-slate-900"
              )}>{stat.value}</p>
            </div>
          </div>
        ))}
      </section>

      {/* INPUT PENJUALAN FAB */}
      <div className="fixed bottom-28 left-0 right-0 px-6 z-40 pointer-events-none">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsSalesSyncOpen(true)}
          className={cn(
            "pointer-events-auto w-full h-20 rounded-full border-2 flex items-center justify-center gap-4 shadow-[0_20px_40px_rgba(0,0,0,0.4)] group overflow-hidden relative transition-colors",
            theme === 'dark' ? "bg-slate-900 border-emerald-500/30" : "bg-white border-emerald-500/20"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-emerald-500/20">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <span className={cn(
            "text-sm font-heading font-black uppercase tracking-[0.2em]",
            theme === 'dark' ? "text-white" : "text-slate-900"
          )}>INPUT PENJUALAN</span>
          <div className="absolute right-6 opacity-20 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-5 h-5" />
          </div>
        </motion.button>
      </div>

      {/* SalesSync Dialog */}
      <SalesSync
        isOpen={isSalesSyncOpen}
        onClose={() => setIsSalesSyncOpen(false)}
        recipes={recipes}
        ingredients={ingredients}
        promoEvents={promoEvents}
        onProcessTransaction={onProcessTransaction}
        onPrintTransaction={onPrintTransaction}
        printerStatus={printerStatus}
        onConnectPrinter={onConnectPrinter}
        autoPrint={autoPrint}
      />

      <style>{`
        @keyframes shimmer { 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
}
