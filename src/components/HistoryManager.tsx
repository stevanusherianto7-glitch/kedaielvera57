import * as React from "react";
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Receipt,
  ArrowRight
} from "lucide-react";
import { Transaction } from "../types";
import { formatCurrency, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface HistoryManagerProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

export const HistoryManager: React.FC<HistoryManagerProps> = ({
  transactions,
  setTransactions
}) => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Riwayat Transaksi</h2>
          <p className="text-slate-500 font-medium">Lacak semua aktivitas penjualan dan pembayaran.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-50">
        <div className="relative flex-1">
          <Input 
            placeholder="Cari ID transaksi..." 
            className="h-14 pl-14 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-bold text-lg placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm" 
          />
          <Search className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
        </div>
        <div className="flex gap-3">
          <button className="h-14 w-14 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:border-emerald-500 transition-all shadow-sm">
            <Filter className="w-6 h-6" />
          </button>
          <select className="h-14 px-8 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm">
            <option>Semua Metode</option>
            <option>Tunai</option>
            <option>QRIS</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {transactions.length === 0 ? (
          <div className="p-20 text-center bg-white rounded-[2.5rem] border border-slate-50 space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <Receipt className="w-10 h-10 text-slate-200" />
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Belum Ada Transaksi</p>
          </div>
        ) : (
          transactions.map(t => (
            <Card key={t.id} className="border-none shadow-sm bg-white overflow-hidden hover:shadow-md transition-all group rounded-2xl">
              <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                    <ShoppingCart className="w-7 h-7 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-slate-900">Order #{t.id.slice(0, 8).toUpperCase()}</h3>
                      <Badge className={cn(
                        "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border-none",
                        t.paymentMethod === 'Tunai' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                      )}>
                        {t.paymentMethod}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      {new Date(t.date).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-12">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Item</p>
                    <p className="font-bold text-slate-900">{t.items.reduce((acc, i) => acc + i.quantity, 0)} Porsi</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Bayar</p>
                    <p className="text-xl font-bold text-emerald-600">{formatCurrency(t.totalPrice)}</p>
                  </div>
                  <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
