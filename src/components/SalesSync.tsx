import * as React from "react";
import { 
  Plus, 
  Search, 
  ShoppingCart, 
  Save, 
  TrendingUp,
  X,
  PlusCircle,
  MinusCircle,
  Printer,
  Bluetooth
} from "lucide-react";
import { Recipe, Ingredient, Transaction, TransactionItem, PromoEvent } from "../types";
import { formatCurrency, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SalesSyncProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  ingredients: Ingredient[];
  promoEvents: PromoEvent[];
  onProcessTransaction: (transaction: Transaction) => void;
  // Thermal printer integration
  onPrintTransaction?: (transaction: Transaction) => Promise<void>;
  printerStatus?: 'disconnected' | 'connecting' | 'connected' | 'printing' | 'error';
  onConnectPrinter?: () => void;
  autoPrint?: boolean;
}

export const SalesSync: React.FC<SalesSyncProps> = ({
  isOpen,
  onClose,
  recipes,
  ingredients,
  promoEvents = [],
  onProcessTransaction,
  onPrintTransaction,
  printerStatus = 'disconnected',
  onConnectPrinter,
  autoPrint = false,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [cart, setCart] = React.useState<TransactionItem[]>([]);
  const [paymentMethod, setPaymentMethod] = React.useState<'Tunai' | 'QRIS'>('Tunai');
  const [isPrinting, setIsPrinting] = React.useState(false);
  const [discountAmount, setDiscountAmount] = React.useState(0);
  const [selectedPromoEvent, setSelectedPromoEvent] = React.useState<PromoEvent | null>(null);

  const filteredRecipes = recipes.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (recipe: Recipe) => {
    setCart(prev => {
      const existing = prev.find(item => item.recipeId === recipe.id);
      if (existing) {
        return prev.map(item => 
          item.recipeId === recipe.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, {
        recipeId: recipe.id,
        name: recipe.name,
        quantity: 1,
        price: recipe.roundedSellingPrice || recipe.sellingPrice || 0
      }];
    });
  };

  const updateQuantity = (recipeId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.recipeId === recipeId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (recipeId: string) => {
    setCart(prev => prev.filter(item => item.recipeId !== recipeId));
  };

  const totalSales = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    
    const mappedItems = cart.map(item => {
      let discountPercent = 0;
      let itemDiscountAmount = 0;
      let promoEventId = null;
      let discountedSubtotal = item.price * item.quantity;

      if (selectedPromoEvent) {
        discountPercent = selectedPromoEvent.discountPercent;
        const percentDiscount = discountedSubtotal * (discountPercent / 100);
        discountedSubtotal -= percentDiscount;
        discountedSubtotal -= selectedPromoEvent.discountAmount;
        discountedSubtotal = Math.max(0, discountedSubtotal);
        
        itemDiscountAmount = (item.price * item.quantity) - discountedSubtotal;
        promoEventId = selectedPromoEvent.id;
      }

      return {
        ...item,
        discountPercent,
        discountAmount: itemDiscountAmount,
        promoEventId,
        discountedSubtotal
      };
    });

    const totalSalesAfterPromo = mappedItems.reduce((acc, item) => acc + item.discountedSubtotal, 0);

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      items: mappedItems,
      totalPrice: totalSalesAfterPromo - discountAmount,
      totalHpp: 0, // Calculated in handleProcessTransaction
      paymentMethod,
      discountAmount
    };

    // 1. Process & save transaction (stock deduction etc.)
    onProcessTransaction(transaction);

    // 2. Auto print struk if printer connected and auto-print enabled
    if (autoPrint && onPrintTransaction && printerStatus === 'connected') {
      setIsPrinting(true);
      try {
        await onPrintTransaction(transaction);
      } finally {
        setIsPrinting(false);
      }
    }

    setCart([]);
    onClose();
  };

  // Printer status indicator badge
  const printerBadge = () => {
    const map: Record<string, { label: string; className: string }> = {
      connected: { label: 'Printer Terhubung', className: 'bg-emerald-100 text-emerald-700' },
      connecting: { label: 'Menghubungkan...', className: 'bg-amber-100 text-amber-700' },
      printing: { label: 'Mencetak...', className: 'bg-blue-100 text-blue-700' },
      error: { label: 'Error Printer', className: 'bg-rose-100 text-rose-700' },
      disconnected: { label: 'Printer Offline', className: 'bg-slate-100 text-slate-500' },
    };
    return map[printerStatus] ?? map.disconnected;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100%-3rem)] sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-[2rem]">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Left Side: Product Selection */}
          <div className="flex-1 p-6 lg:p-8 flex flex-col gap-6 overflow-hidden">
            <DialogHeader className="p-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-slate-900">Input Penjualan</DialogTitle>
                  <DialogDescription className="text-slate-500 font-medium">Pilih menu yang terjual hari ini.</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="relative">
              <Input 
                placeholder="Cari menu (misal: Nasi Goreng...)" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pl-14 pr-6 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-bold text-lg placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
              />
              <Search className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredRecipes.map(recipe => (
                  <Card 
                    key={recipe.id}
                    onClick={() => addToCart(recipe)}
                    className="group cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 transition-all p-4 rounded-2xl border-slate-100"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Badge className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border-none",
                          (recipe.category === 'Makanan' || !recipe.category) ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                        )}>
                          {recipe.category || "Makanan"}
                        </Badge>
                        <h4 className="font-bold text-slate-900">{recipe.name}</h4>
                        <p className="text-sm font-bold text-emerald-600">{formatCurrency(recipe.roundedSellingPrice || recipe.sellingPrice || 0)}</p>
                      </div>
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        <Plus className="w-5 h-5" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Cart / Checkout */}
          <div className="w-full lg:w-96 bg-slate-50 p-6 lg:p-8 flex flex-col gap-6 border-t lg:border-t-0 lg:border-l border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-slate-400" />
                Keranjang
              </h3>
              <Badge className="bg-emerald-100 text-emerald-700 border-none font-black px-2.5 py-1">
                {cart.reduce((acc, i) => acc + i.quantity, 0)} Item
              </Badge>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm">
                    <ShoppingCart className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Keranjang Kosong</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.recipeId} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
                    <div className="flex justify-between items-start">
                      <h5 className="font-bold text-slate-900 text-sm">{item.name}</h5>
                      <button 
                        onClick={() => removeFromCart(item.recipeId)} 
                        className="text-slate-300 hover:text-rose-500"
                        title="Hapus dari Keranjang"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl border border-slate-100">
                        <button 
                          onClick={() => updateQuantity(item.recipeId, -1)} 
                          className="p-1 text-slate-400 hover:text-rose-500"
                          title="Kurangi Jumlah"
                        >
                          <MinusCircle className="w-5 h-5" />
                        </button>
                        <span className="font-bold text-slate-900 min-w-[20px] text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.recipeId, 1)} 
                          className="p-1 text-slate-400 hover:text-emerald-500"
                          title="Tambah Jumlah"
                        >
                          <PlusCircle className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="font-bold text-slate-900">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-200">
              {/* Promo Section */}
              {promoEvents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Promo Event</p>
                  <div className="flex flex-col gap-2">
                    {promoEvents.map(event => (
                      <button
                        key={event.id}
                        onClick={() => setSelectedPromoEvent(selectedPromoEvent?.id === event.id ? null : event)}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all flex justify-between items-center",
                          selectedPromoEvent?.id === event.id
                            ? "border-emerald-500 bg-emerald-50/50"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        )}
                      >
                        <div>
                          <p className="font-bold text-sm text-slate-900">{event.name}</p>
                          <p className="text-xs text-slate-500">
                            {event.discountPercent > 0 ? `${event.discountPercent}%` : ''} 
                            {event.discountPercent > 0 && event.discountAmount > 0 ? ' + ' : ''}
                            {event.discountAmount > 0 ? formatCurrency(event.discountAmount) : ''}
                          </p>
                        </div>
                        {selectedPromoEvent?.id === event.id && (
                          <Badge className="bg-emerald-500 text-white border-none text-[10px] px-1.5 py-0.5">Aktif</Badge>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Metode Pembayaran</p>
                <div className="bg-slate-100 p-1.5 rounded-full flex gap-1 h-14 border border-slate-200/50 shadow-inner">
                  <button 
                    onClick={() => setPaymentMethod('Tunai')}
                    className={cn(
                      "flex-1 rounded-full font-black text-xs transition-all uppercase tracking-wider",
                      paymentMethod === 'Tunai' 
                        ? "bg-white text-slate-900 shadow-sm" 
                        : "text-slate-500 hover:bg-white/50"
                    )}
                  >
                    Tunai
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('QRIS')}
                    className={cn(
                      "flex-1 rounded-full font-black text-xs transition-all uppercase tracking-wider",
                      paymentMethod === 'QRIS' 
                        ? "bg-white text-slate-900 shadow-sm" 
                        : "text-slate-500 hover:bg-white/50"
                    )}
                  >
                    QRIS
                  </button>
                </div>
              </div>

              {/* Discount Section */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Diskon</p>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 5, 10, 15].map(percent => (
                    <button
                      key={percent}
                      onClick={() => setDiscountAmount(totalSales * (percent / 100))}
                      className={cn(
                        "h-10 rounded-xl font-bold text-xs transition-all",
                        (discountAmount === totalSales * (percent / 100) && percent !== 0)
                          ? "bg-emerald-500 text-white"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {percent === 0 ? 'No' : `${percent}%`}
                    </button>
                  ))}
                </div>
                <div className="relative mt-2">
                  <Input
                    type="number"
                    placeholder="Nominal Diskon (Rp)"
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    className="h-10 rounded-xl border-slate-200 text-sm font-medium"
                  />
                </div>
              </div>

              {/* Printer Status Row */}
              {onConnectPrinter && (
                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Bluetooth className={cn(
                      "w-4 h-4",
                      printerStatus === 'connected' ? "text-emerald-500" : "text-slate-300"
                    )} />
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", printerBadge().className.split(' ').find(c => c.startsWith('text-')))}>
                      {printerBadge().label}
                    </span>
                  </div>
                  {printerStatus === 'disconnected' || printerStatus === 'error' ? (
                    <button
                      onClick={onConnectPrinter}
                      className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700"
                    >
                      Hubungkan
                    </button>
                  ) : (
                    <Printer className={cn(
                      "w-4 h-4",
                      autoPrint && printerStatus === 'connected' ? "text-emerald-500" : "text-slate-300"
                    )} />
                  )}
                </div>
              )}

              {/* Total */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tagihan</p>
                {discountAmount > 0 && (
                  <p className="text-sm font-bold text-slate-400 line-through">{formatCurrency(totalSales)}</p>
                )}
                <p className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(totalSales - discountAmount)}</p>
              </div>

              {/* Submit Button */}
              <Button 
                disabled={cart.length === 0 || isPrinting}
                onClick={handleSubmit}
                className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-black text-lg shadow-xl shadow-emerald-600/30 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isPrinting ? (
                  <>
                    <Printer className="w-6 h-6 mr-2 animate-pulse" />
                    MENCETAK STRUK...
                  </>
                ) : (
                  <>
                    <Save className="w-6 h-6 mr-2" />
                    SIMPAN & POTONG STOK
                    {autoPrint && printerStatus === 'connected' && (
                      <Printer className="w-4 h-4 ml-2 opacity-60" />
                    )}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
