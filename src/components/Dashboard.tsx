import * as React from "react";
import { 
  TrendingUp, 
  ShoppingCart, 
  AlertTriangle, 
  ArrowRight,
  FileDown,
  FileText
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Ingredient, Transaction, Expense, Recipe } from "../types";
import { formatCurrency } from "@/lib/utils";
import { Logo } from "./Logo";
import { SalesSync } from "./SalesSync";

interface DashboardProps {
  transactions: Transaction[];
  recipes: Recipe[];
  ingredients: Ingredient[];
  expenses: Expense[];
  pettyCash: number;
  handleBackup: () => void;
  handleRestore: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleClosing: () => void;
  onTabChange: (tab: string) => void;
  onProcessTransaction: (transaction: Transaction) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  recipes,
  ingredients,
  expenses,
  pettyCash,
  handleRestore,
  handleClosing,
  onTabChange,
  onProcessTransaction
}) => {
  const [isSalesSyncOpen, setIsSalesSyncOpen] = React.useState(false);

  const totalSales = transactions.reduce((acc, t) => acc + t.totalPrice, 0);
  const totalHpp = transactions.reduce((acc, t) => acc + (t.totalHpp || 0), 0);
  const grossProfit = totalSales - totalHpp;
  const lowStockCount = ingredients.filter(i => i.stockQuantity <= i.lowStockThreshold).length;

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/30">
            <Logo size={48} className="brightness-0 invert" />
          </div>
          <div className="space-y-1">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">
              ENGINE<span className="text-emerald-500 not-italic ml-2">57</span>
            </h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">Real-time Inventory Control</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setIsSalesSyncOpen(true)}
            className="h-16 px-10 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-black shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all text-sm uppercase tracking-[0.2em] border-2 border-emerald-500"
          >
            <ShoppingCart className="w-5 h-5 mr-3" />
            Input Penjualan
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleClosing}
            className="h-16 w-16 border-2 border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-50 transition-all"
          >
            <FileText className="w-6 h-6 text-slate-600" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="premium-card group border-0 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardContent className="p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-colors" />
            <div className="flex items-center justify-between mb-8">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <TrendingUp className="w-7 h-7 text-emerald-400" />
              </div>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full uppercase tracking-[0.2em] border border-emerald-400/20">Omset</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 opacity-70">Total Penjualan</p>
            <h3 className="text-3xl font-black text-white tracking-tighter">{formatCurrency(totalSales)}</h3>
          </CardContent>
        </Card>

        <Card className="premium-card group border-0 bg-white">
          <CardContent className="p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />
            <div className="flex items-center justify-between mb-8">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-blue-500" />
              </div>
              <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-[0.2em] border border-blue-100">Profit</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Estimasi Laba Kotor</p>
            <h3 className="text-3xl font-black text-blue-600 tracking-tighter">{formatCurrency(grossProfit)}</h3>
          </CardContent>
        </Card>

        <Card className="premium-card group border-0 bg-white">
          <CardContent className="p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-rose-500/10 transition-colors" />
            <div className="flex items-center justify-between mb-8">
              <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-rose-500" />
              </div>
              <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1.5 rounded-full uppercase tracking-[0.2em] border border-rose-100">Warning</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Stok Menipis</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{lowStockCount} <span className="text-lg text-slate-400 font-bold ml-1">Item</span></h3>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic">WAREHOUSE<span className="text-emerald-500 not-italic ml-2">STATUS</span></h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pantau ketersediaan bahan baku secara real-time</p>
          </div>
          <Button variant="ghost" onClick={() => onTabChange('bahan')} className="text-sm font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-50 rounded-xl">
            Lihat Semua <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lowStockCount === 0 ? (
            <div className="col-span-full glass-card p-12 text-center space-y-6">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto shadow-inner animate-float">
                <TrendingUp className="w-10 h-10 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">SEMUA AMAN!</h4>
                <p className="text-slate-400 text-sm font-bold max-w-xs mx-auto">Semua bahan baku tersedia di atas batas minimum stok. Operasional berjalan lancar.</p>
              </div>
            </div>
          ) : (
            ingredients.filter(i => i.stockQuantity <= i.lowStockThreshold).map(ing => (
              <Card key={ing.id} className="premium-card group border-slate-100">
                <div className="p-8 flex flex-col justify-between h-full gap-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-slate-900 tracking-tighter">{ing.name}</h3>
                      <div className="inline-flex items-center px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                        {ing.category}
                      </div>
                    </div>
                    <div className="p-3 bg-rose-50 text-rose-500 rounded-xl">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Stok Saat Ini</p>
                        <p className="text-2xl font-black text-rose-500 tracking-tighter">
                          {ing.stockQuantity} <span className="text-sm font-bold text-slate-400">{ing.useUnit}</span>
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Minimum</p>
                        <p className="text-sm font-black text-slate-900">{ing.lowStockThreshold} {ing.useUnit}</p>
                      </div>
                    </div>
                    
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                      <div 
                        ref={(el) => {
                          if (el) {
                            const width = Math.min(100, (ing.stockQuantity / (ing.lowStockThreshold || 1)) * 100);
                            el.style.setProperty('width', `${width}%`);
                          }
                        }}
                        className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full transition-all duration-1000 ease-out shadow-sm" 
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <SalesSync 
        isOpen={isSalesSyncOpen}
        onClose={() => setIsSalesSyncOpen(false)}
        recipes={recipes}
        ingredients={ingredients}
        onProcessTransaction={onProcessTransaction}
      />
    </div>
  );
};
