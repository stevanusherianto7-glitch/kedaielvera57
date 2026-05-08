import * as React from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  ArrowRight,
  Wallet,
  Calculator,
  TrendingDown
} from "lucide-react";
import { Expense } from "../types";
import { formatCurrency, cn } from "@/lib/utils";
import { PriceInput } from "./PriceInput";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PettyCashManagerProps {
  expenses: Expense[];
  pettyCash: number;
  setPettyCash: (val: number | ((prev: number) => number)) => void;
  isAddingExpense: boolean;
  setIsAddingExpense: (val: boolean) => void;
  newExpense: Partial<Expense>;
  setNewExpense: (val: Partial<Expense>) => void;
  handleAddExpense: () => void;
}

export const PettyCashManager: React.FC<PettyCashManagerProps> = ({
  expenses,
  pettyCash,
  setPettyCash,
  isAddingExpense,
  setIsAddingExpense,
  newExpense,
  setNewExpense,
  handleAddExpense
}) => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Petty Cash & Pengeluaran</h2>
          <p className="text-slate-500 font-medium">Kelola dana operasional harian dan catat semua pengeluaran.</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog>
            <DialogTrigger render={
              <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-full shadow-sm font-bold hover:bg-slate-50 transition-all active:scale-95">
                <Plus className="w-5 h-5 text-slate-400" />
                Top Up Saldo
              </button>
            } />
            <DialogContent className="w-[calc(100%-3rem)] sm:max-w-md mx-auto rounded-3xl p-6">
              <DialogHeader className="px-0 pt-0">
                <DialogTitle className="text-xl font-heading font-black text-slate-900">TOP UP PETTY CASH</DialogTitle>
                <DialogDescription className="text-slate-500 text-xs">Tambahkan modal operasional harian kasir.</DialogDescription>
              </DialogHeader>
              <div className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jumlah Top Up (Rp)</label>
                  <PriceInput 
                    value={0}
                    onChange={(val) => {
                      if (val > 0) {
                        setPettyCash(prev => prev + val);
                      }
                    }}
                    className="h-12 rounded-xl border-slate-100 font-bold text-lg"
                    placeholder="0"
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
            <DialogTrigger render={
              <button className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-full shadow-lg shadow-rose-600/20 font-bold hover:bg-rose-700 transition-all active:scale-95">
                <TrendingDown className="w-5 h-5" />
                Catat Pengeluaran
              </button>
            } />
            <DialogContent className="w-[calc(100%-3rem)] sm:max-w-md mx-auto rounded-3xl p-6">
              <DialogHeader className="px-0 pt-0">
                <DialogTitle className="text-xl font-heading font-black text-slate-900">PENGELUARAN BARU</DialogTitle>
                <DialogDescription className="text-slate-500 text-xs">Catat biaya operasional yang diambil dari Petty Cash.</DialogDescription>
              </DialogHeader>
              <div className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Deskripsi Pengeluaran</label>
                  <Input 
                    placeholder="Contoh: Beli Gas 3kg / Parkir" 
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                    className="h-14 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-bold text-lg placeholder:text-slate-400 focus:ring-2 focus:ring-rose-500 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jumlah (Rp)</label>
                  <PriceInput 
                    value={newExpense.amount || 0}
                    onChange={(val) => setNewExpense({...newExpense, amount: val})}
                    className="h-14 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-bold text-2xl placeholder:text-slate-400 focus:ring-2 focus:ring-rose-500 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kategori</label>
                  <select 
                    className="w-full h-12 rounded-xl border border-slate-100 bg-white px-4 text-sm font-medium outline-none focus:ring-4 focus:ring-rose-500/5 transition-all"
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({...newExpense, category: e.target.value as any})}
                  >
                    <option value="Operasional">Operasional</option>
                    <option value="Bahan Baku">Bahan Baku (Urgent)</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>
              <DialogFooter className="px-0 pb-0 pt-6 border-t border-slate-50 grid grid-cols-2 gap-3">
                <Button onClick={handleAddExpense} className="w-full h-14 bg-rose-600 hover:bg-rose-700 rounded-full font-black uppercase text-xs tracking-wider shadow-xl shadow-rose-500/20 active:scale-95 transition-all text-white">
                  Simpan
                </Button>
                <button onClick={() => setIsAddingExpense(false)} className="w-full h-14 rounded-full font-black uppercase text-xs tracking-wider bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">
                  Batal
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Petty Cash Card */}
        <div className="lg:col-span-1">
          <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2rem] overflow-hidden sticky top-8">
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-emerald-400" />
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-bold">Active Balance</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Saldo Petty Cash Saat Ini</p>
                <h2 className="text-4xl font-bold tracking-tight">{formatCurrency(pettyCash)}</h2>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  Gunakan saldo ini untuk pengeluaran kecil harian. Pastikan saldo selalu mencukupi sebelum mencatat pengeluaran.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Expense List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Daftar Pengeluaran</h3>
            <div className="flex gap-2">
              <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-slate-600 shadow-sm">
                <Search className="w-4 h-4" />
              </button>
              <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-slate-600 shadow-sm">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {expenses.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-50 opacity-40">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Belum Ada Pengeluaran</p>
              </div>
            ) : (
              expenses.map(exp => (
                <Card key={exp.id} className="border-none shadow-sm bg-white overflow-hidden hover:shadow-md transition-all group rounded-2xl">
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                        <TrendingDown className="w-5 h-5 text-rose-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{exp.description}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0 border-none bg-slate-100 text-slate-500">
                            {exp.category}
                          </Badge>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(exp.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-rose-600">{formatCurrency(exp.amount)}</p>
                      <button className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
