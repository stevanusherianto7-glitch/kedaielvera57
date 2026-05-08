import * as React from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Trash2, 
  Edit2,
  FileDown,
  Package,
  Calculator,
  ArrowRight,
  Save,
  HelpCircle,
  ClipboardCheck
} from "lucide-react";
import { Ingredient, Unit, Recipe } from "../types";
import { formatCurrency, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CATEGORIES, UNITS } from "../constants";
import { PriceInput } from "./PriceInput";
import { VarianceReport } from "./VarianceReport";

interface BahanManagerProps {
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  deleteIngredient: (id: string) => void;
  handleExportInventoryPDF: () => void;
}

export const BahanManager: React.FC<BahanManagerProps> = ({
  ingredients,
  setIngredients,
  recipes,
  setRecipes,
  deleteIngredient,
  handleExportInventoryPDF
}) => {
  const [viewMode, setViewMode] = React.useState<'menu-list' | 'ingredient-list' | 'stock-opname'>('menu-list');
  const [selectedRecipeId, setSelectedRecipeId] = React.useState<string | null>(null);
  const [isAddingIngredient, setIsAddingIngredient] = React.useState(false);
  const [newIngredient, setNewIngredient] = React.useState<Partial<Ingredient>>({
    name: "",
    category: CATEGORIES[0],
    purchasePrice: 0,
    purchaseUnit: "kg",
    useUnit: "gr",
    conversionValue: 1000,
    stockQuantity: 0,
    lowStockThreshold: 0
  });

  const [isStockIn, setIsStockIn] = React.useState(false);
  const [isEditingIngredient, setIsEditingIngredient] = React.useState(false);
  const [selectedIngredientForStock, setSelectedIngredientForStock] = React.useState<Ingredient | null>(null);
  const [editingIngredient, setEditingIngredient] = React.useState<Ingredient | null>(null);
  const [stockInAmount, setStockInAmount] = React.useState(0);
  const [recipeToDelete, setRecipeToDelete] = React.useState<Recipe | null>(null);
  const [ingredientToDelete, setIngredientToDelete] = React.useState<{ing: Ingredient, recipeId?: string} | null>(null);

  const toTitleCase = (str: string) => {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  };

  const handleAddIngredient = () => {
    if (!newIngredient.name) return;
    const ingredient: Ingredient = {
      ...newIngredient as Ingredient,
      name: toTitleCase(newIngredient.name || ""),
      id: crypto.randomUUID(),
    };
    setIngredients([...ingredients, ingredient]);
    setIsAddingIngredient(false);
    setNewIngredient({
      name: "",
      category: CATEGORIES[0],
      purchasePrice: 0,
      purchaseUnit: "kg",
      useUnit: "gr",
      conversionValue: 1000,
      stockQuantity: 0,
      lowStockThreshold: 0
    });
  };

  const handleStockIn = () => {
    if (!selectedIngredientForStock || stockInAmount <= 0) return;
    const updatedIngredients = ingredients.map(ing => 
      ing.id === selectedIngredientForStock.id 
        ? { ...ing, stockQuantity: ing.stockQuantity + (stockInAmount * ing.conversionValue) }
        : ing
    );
    setIngredients(updatedIngredients);
    setIsStockIn(false);
    setSelectedIngredientForStock(null);
    setStockInAmount(0);
  };

  const handleEditIngredient = () => {
    if (!editingIngredient || !editingIngredient.name) return;
    const updatedIngredients = ingredients.map(ing => 
      ing.id === editingIngredient.id ? editingIngredient : ing
    );
    setIngredients(updatedIngredients);
    setIsEditingIngredient(false);
    setEditingIngredient(null);
  };

  const selectedRecipe = recipes.find(r => r.id === selectedRecipeId);
  
  const filteredIngredients = selectedRecipeId 
    ? ingredients.filter(ing => selectedRecipe?.items.some(item => item.ingredientId === ing.id))
    : ingredients;

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-heading font-black text-slate-900 tracking-tight">
              {viewMode === 'menu-list' ? "Database Bahan Baku" : viewMode === 'stock-opname' ? "Stock Opname" : (selectedRecipe ? `Bahan: ${selectedRecipe.name}` : "Semua Bahan Baku")}
            </h2>
          </div>
          <p className="text-slate-500 font-medium text-sm">
            {viewMode === 'menu-list' 
              ? "Kelola ketersediaan, satuan, dan harga beli komponen bahan baku." 
              : viewMode === 'stock-opname' ? "Bandingkan stok sistem dengan stok fisik." : `Daftar komponen bahan baku ${selectedRecipe ? `untuk menu ${selectedRecipe.name}` : "lengkap"}.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button 
            onClick={() => setViewMode(viewMode === 'stock-opname' ? 'menu-list' : 'stock-opname')}
            className={cn(
              "flex-1 sm:w-40 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-full font-heading font-black transition-all active:scale-95 text-xs sm:text-sm border shadow-sm uppercase tracking-wider",
              viewMode === 'stock-opname' ? "bg-blue-600 text-white border-blue-600 shadow-blue-600/20" : "bg-white text-slate-700 border-slate-100 hover:bg-slate-50"
            )}
          >
            <ClipboardCheck className={cn("w-4 h-4", viewMode === 'stock-opname' ? "text-white" : "text-slate-400")} />
            {viewMode === 'stock-opname' ? "Tutup" : "Opname"}
          </button>
          <button 
            onClick={handleExportInventoryPDF}
            className="flex-1 sm:w-40 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-white border border-slate-100 rounded-full shadow-sm text-slate-700 font-heading font-black hover:bg-slate-50 transition-all active:scale-95 text-xs sm:text-sm uppercase tracking-wider"
          >
            <FileDown className="w-4 h-4 text-slate-400" />
            Save PDF
          </button>
          <Dialog open={isAddingIngredient} onOpenChange={setIsAddingIngredient}>
            <DialogTrigger render={
              <button className="flex-1 sm:w-auto sm:px-10 flex items-center justify-center gap-2 px-4 py-2.5 sm:h-14 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-600/20 font-heading font-black hover:bg-emerald-700 transition-all active:scale-95 text-xs sm:text-sm uppercase tracking-wider">
                <Plus className="w-5 h-5" />
                Tambah
              </button>
            } />
            <DialogContent className="w-[calc(100%-3rem)] sm:max-w-md mx-auto rounded-3xl max-h-[95vh] flex flex-col overflow-hidden">
              <DialogHeader className="px-4 sm:px-8 pt-4 sm:pt-8 shrink-0">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg font-bold text-slate-900">Tambah Bahan Baku</DialogTitle>
                  <button 
                    onClick={() => alert("Guideline Pengisian:\n\n1. Nama Bahan: Gunakan nama yang spesifik (contoh: Ayam Broiler Utuh).\n2. Kategori: Kelompokkan bahan agar mudah dicari.\n3. Harga Beli: Masukkan harga per Satuan Beli (misal: Harga 1 Karung Beras).\n4. Satuan Beli vs Pakai: Tentukan satuan saat belanja vs satuan saat masak.\n5. Nilai Konversi: Jumlah Satuan Pakai dalam 1 Satuan Beli (misal: 1kg = 1000gr).\n6. Minimal Stok: Batas aman sebelum muncul peringatan 'Stok Rendah'.")}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg border border-slate-100 text-[10px] font-bold hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Guideline
                  </button>
                </div>
                <DialogDescription className="text-slate-500">Lengkapi detail bahan baku untuk ditambahkan ke database.</DialogDescription>
              </DialogHeader>
              <div className="p-4 sm:p-8 space-y-6 bg-slate-100 shadow-inner overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nama Bahan</label>
                    <Input 
                      placeholder="Contoh: Daging Sapi Sirloin" 
                      value={newIngredient.name}
                      onChange={(e) => setNewIngredient({...newIngredient, name: toTitleCase(e.target.value)})}
                      className="h-14 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-bold text-lg placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kategori Bahan</label>
                    <select 
                      className="w-full h-14 rounded-2xl border-2 border-slate-200 bg-white px-6 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm text-slate-700"
                      value={newIngredient.category}
                      onChange={(e) => setNewIngredient({...newIngredient, category: e.target.value})}
                      title="Pilih Kategori"
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Harga Beli (Rp)</label>
                    <Tooltip>
                      <TooltipTrigger render={
                        <PriceInput 
                          value={newIngredient.purchasePrice || 0}
                          onChange={(val) => setNewIngredient({...newIngredient, purchasePrice: val})}
                          className="h-14 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-bold text-xl placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
                        />
                      } />
                      <TooltipContent side="right" className="max-w-[200px]">
                        <p className="text-[10px] font-bold">💡 Cheat Sheet: Harga Beli</p>
                        <p className="text-[9px] mt-1">Masukkan harga beli bahan baku per <strong>Satuan Beli</strong> (misalnya harga per kg, per liter, atau per pack).</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Satuan Beli</label>
                    <select 
                      className="w-full h-14 rounded-2xl border-2 border-slate-200 bg-white px-6 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm text-slate-700"
                      value={newIngredient.purchaseUnit}
                      onChange={(e) => setNewIngredient({...newIngredient, purchaseUnit: e.target.value as Unit})}
                      title="Satuan Beli"
                    >
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Satuan Pakai</label>
                    <select 
                      className="w-full h-14 rounded-2xl border-2 border-slate-200 bg-white px-6 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm text-slate-700"
                      value={newIngredient.useUnit}
                      onChange={(e) => setNewIngredient({...newIngredient, useUnit: e.target.value as Unit})}
                      title="Satuan Pakai"
                    >
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nilai Konversi</label>
                    <Tooltip>
                      <TooltipTrigger render={
                        <Input 
                          type="number" 
                          placeholder="Contoh: 1000 (jika kg ke gr)" 
                          value={newIngredient.conversionValue || ""}
                          onChange={(e) => setNewIngredient({...newIngredient, conversionValue: Number(e.target.value)})}
                          className="h-12 rounded-xl border-slate-200 bg-white shadow-sm"
                        />
                      } />
                      <TooltipContent side="right" className="max-w-[250px]">
                        <p className="text-[10px] font-bold">💡 Cheat Sheet: Konversi</p>
                        <p className="text-[9px] mt-1">Isi jumlah Satuan Pakai dalam 1 Satuan Beli.</p>
                        <p className="text-[9px] mt-1 font-bold">Contoh:</p>
                        <ul className="text-[9px] list-disc ml-4">
                          <li>1 kg ke gr = 1000</li>
                          <li>1 liter ke ml = 1000</li>
                          <li>1 pack ke pcs = 12 (jika isi 12)</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Minimal Stok</label>
                    <Tooltip>
                      <TooltipTrigger render={
                        <Input 
                          type="number" 
                          placeholder="Batas peringatan stok rendah" 
                          value={newIngredient.lowStockThreshold || ""}
                          onChange={(e) => setNewIngredient({...newIngredient, lowStockThreshold: Number(e.target.value)})}
                          className="h-12 rounded-xl border-slate-200 bg-white shadow-sm"
                        />
                      } />
                      <TooltipContent side="right" className="max-w-[200px]">
                        <p className="text-[10px] font-bold">💡 Cheat Sheet: Stok Minimum</p>
                        <p className="text-[9px] mt-1">Masukkan jumlah stok batas bawah. Aplikasi akan memberikan peringatan jika stok mencapai angka ini.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
              <DialogFooter className="p-4 sm:p-8 border-t border-slate-50 gap-3 shrink-0 grid grid-cols-2">
                <Button onClick={handleAddIngredient} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 rounded-full font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
                  Simpan Bahan
                </Button>
                <Button variant="ghost" onClick={() => setIsAddingIngredient(false)} className="w-full h-14 rounded-full font-black uppercase text-xs tracking-widest bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">
                  Batal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-8">
        {viewMode === 'stock-opname' ? (
          <VarianceReport ingredients={ingredients} />
        ) : viewMode === 'menu-list' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
            {/* Master Data Card */}
            <Card 
              onClick={() => {
                setViewMode('ingredient-list');
                setSelectedRecipeId(null);
              }}
              className="group cursor-pointer border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all rounded-xl p-3 flex flex-col items-center justify-center text-center space-y-2"
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-[11px] font-bold text-slate-900">Semua Bahan</h3>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest line-clamp-1">Database Master</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-2 py-0.5 rounded-full font-bold text-[9px]">
                {ingredients.length} Item
              </Badge>
            </Card>

            {recipes.map(recipe => (
              <Card 
                key={recipe.id}
                onClick={() => {
                  setViewMode('ingredient-list');
                  setSelectedRecipeId(recipe.id);
                }}
                className="premium-card relative group"
              >
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                      <Calculator className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecipeToDelete(recipe);
                        }}
                        title="Hapus Resep"
                        className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                  <div>
                    <Badge className={cn(
                      "mb-1 px-2 py-0.5 rounded-full text-[8px] font-bold border-none",
                      (recipe.category === 'Makanan' || !recipe.category) ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                    )}>
                      {recipe.category || "Makanan"}
                    </Badge>
                    <h3 className="text-[11px] font-bold text-slate-900 leading-tight line-clamp-1">{recipe.name}</h3>
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5">
                      {recipe.items.length} Bahan
                    </p>
                  </div>
                </div>
                <div className="px-3 py-2 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">HPP</span>
                  <span className="text-[10px] font-bold text-slate-900">
                    {formatCurrency(recipe.items.reduce((acc, item) => {
                      const ing = ingredients.find(i => i.id === item.ingredientId);
                      if (!ing) return acc;
                      return acc + (ing.purchasePrice / ing.conversionValue) * item.quantityNeeded;
                    }, 0))}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
            {filteredIngredients.map(ing => (
              <Card key={ing.id} className="premium-card relative group">
                <div className="p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                      <Package className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <div className="flex gap-1">
                      <Tooltip>
                        <TooltipTrigger render={
                          <button 
                            onClick={() => {
                              setSelectedIngredientForStock(ing);
                              setIsStockIn(true);
                            }}
                            title="Stok Masuk"
                            className="p-1.5 text-slate-300 hover:text-emerald-600 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        } />
                        <TooltipContent>
                          <p className="text-[10px] font-bold">Stok Masuk</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger render={
                          <button 
                            onClick={() => {
                              setEditingIngredient({...ing});
                              setIsEditingIngredient(true);
                            }}
                            title="Edit Bahan"
                            className="p-1.5 text-slate-300 hover:text-blue-600 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        } />
                        <TooltipContent>
                          <p className="text-[10px] font-bold">Edit Bahan</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger render={
                          <button 
                            onClick={() => {
                              if (selectedRecipeId) {
                                setIngredientToDelete({ ing, recipeId: selectedRecipeId });
                              } else {
                                setIngredientToDelete({ ing });
                              }
                            }} 
                            title="Hapus"
                            className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        } />
                        <TooltipContent>
                          <p className="text-[10px] font-bold">{selectedRecipeId ? "Hapus dari Resep" : "Hapus Bahan"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold text-slate-900 truncate leading-tight">{ing.name}</h3>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{ing.category}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1 pt-3 border-t border-slate-50">
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Stok</p>
                      <p className={cn(
                        "text-[10px] font-bold",
                        ing.stockQuantity <= ing.lowStockThreshold ? "text-rose-500" : "text-slate-900"
                      )}>
                        {ing.stockQuantity / ing.conversionValue} {ing.purchaseUnit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Harga</p>
                      <p className="text-[10px] font-bold text-slate-900">{formatCurrency(ing.purchasePrice / ing.conversionValue)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!recipeToDelete} onOpenChange={(open) => !open && setRecipeToDelete(null)}>
        <DialogContent className="w-[calc(100%-3rem)] sm:max-w-md mx-auto rounded-3xl">
          <DialogHeader className="p-6">
            <DialogTitle className="text-xl font-bold text-slate-900">Konfirmasi Hapus Resep</DialogTitle>
            <DialogDescription className="text-slate-500 mt-2">
              Apakah Anda yakin ingin menghapus resep <span className="font-bold text-slate-900">"{recipeToDelete?.name}"</span>? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 grid grid-cols-2">
            <Button 
              variant="outline" 
              onClick={() => setRecipeToDelete(null)}
              className="w-full h-14 rounded-full font-bold border-2 border-slate-200 text-slate-600 hover:bg-white text-sm"
            >
              Batal
            </Button>
            <Button 
              onClick={() => {
                if (recipeToDelete) {
                  setRecipes(recipes.filter(r => r.id !== recipeToDelete.id));
                  setRecipeToDelete(null);
                }
              }}
              className="w-full h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-bold shadow-lg shadow-rose-600/20 text-sm"
            >
              Hapus Resep
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!ingredientToDelete} onOpenChange={(open) => !open && setIngredientToDelete(null)}>
        <DialogContent className="w-[calc(100%-3rem)] sm:max-w-md mx-auto rounded-3xl">
          <DialogHeader className="p-6">
            <DialogTitle className="text-xl font-bold text-slate-900">Konfirmasi Hapus Bahan</DialogTitle>
            <DialogDescription className="text-slate-500 mt-2">
              {ingredientToDelete?.recipeId 
                ? `Apakah Anda yakin ingin menghapus "${ingredientToDelete.ing.name}" dari resep ini?`
                : `Apakah Anda yakin ingin menghapus "${ingredientToDelete?.ing.name}" dari database master?`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 grid grid-cols-2">
            <Button 
              variant="outline" 
              onClick={() => setIngredientToDelete(null)}
              className="w-full h-14 rounded-full font-bold border-2 border-slate-200 text-slate-600 hover:bg-white text-sm"
            >
              Batal
            </Button>
            <Button 
              onClick={() => {
                if (ingredientToDelete) {
                  if (ingredientToDelete.recipeId) {
                    setRecipes(recipes.map(r => 
                      r.id === ingredientToDelete.recipeId 
                        ? { ...r, items: r.items.filter(item => item.ingredientId !== ingredientToDelete.ing.id) }
                        : r
                    ));
                  } else {
                    deleteIngredient(ingredientToDelete.ing.id);
                  }
                  setIngredientToDelete(null);
                }
              }}
              className="w-full h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-bold shadow-lg shadow-rose-600/20 text-sm"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditingIngredient} onOpenChange={setIsEditingIngredient}>
        <DialogContent className="w-[calc(100%-3rem)] sm:max-w-2xl mx-auto rounded-3xl max-h-[95vh] flex flex-col overflow-hidden">
          <DialogHeader className="px-4 sm:px-8 pt-4 sm:pt-8 shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-slate-900">Edit Bahan Baku</DialogTitle>
              <button 
                onClick={() => alert("Guideline Pengisian:\n\n1. Nama Bahan: Gunakan nama yang spesifik (contoh: Ayam Broiler Utuh).\n2. Kategori: Kelompokkan bahan agar mudah dicari.\n3. Harga Beli: Masukkan harga per Satuan Beli (misal: Harga 1 Karung Beras).\n4. Satuan Beli vs Pakai: Tentukan satuan saat belanja vs satuan saat masak.\n5. Nilai Konversi: Jumlah Satuan Pakai dalam 1 Satuan Beli (misal: 1kg = 1000gr).\n6. Minimal Stok: Batas aman sebelum muncul peringatan 'Stok Rendah'.")}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg border border-slate-100 text-[10px] font-bold hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Guideline
              </button>
            </div>
            <DialogDescription className="text-slate-500">Perbarui detail bahan baku, termasuk harga beli jika ada kenaikan.</DialogDescription>
          </DialogHeader>
          {editingIngredient && (
            <div className="p-4 sm:p-8 space-y-6 bg-slate-100 shadow-inner overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nama Bahan</label>
                  <Input 
                    placeholder="Contoh: Daging Sapi Sirloin" 
                    value={editingIngredient.name}
                    onChange={(e) => setEditingIngredient({...editingIngredient, name: toTitleCase(e.target.value)})}
                    className="h-12 rounded-xl border-slate-200 bg-white shadow-sm focus:ring-blue-500/10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kategori</label>
                  <select 
                    className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
                    value={editingIngredient.category}
                    onChange={(e) => setEditingIngredient({...editingIngredient, category: e.target.value})}
                    title="Edit Kategori"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Harga Beli (Rp)</label>
                  <PriceInput 
                    value={editingIngredient.purchasePrice || 0}
                    onChange={(val) => setEditingIngredient({...editingIngredient, purchasePrice: val})}
                    className="h-12 rounded-xl border-slate-200 bg-white shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Satuan Beli</label>
                  <select 
                    className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
                    value={editingIngredient.purchaseUnit}
                    onChange={(e) => setEditingIngredient({...editingIngredient, purchaseUnit: e.target.value as Unit})}
                    title="Edit Satuan Beli"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Satuan Pakai</label>
                  <select 
                    className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
                    value={editingIngredient.useUnit}
                    onChange={(e) => setEditingIngredient({...editingIngredient, useUnit: e.target.value as Unit})}
                    title="Edit Satuan Pakai"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nilai Konversi</label>
                  <Input 
                    type="number" 
                    value={editingIngredient.conversionValue || ""}
                    onChange={(e) => setEditingIngredient({...editingIngredient, conversionValue: Number(e.target.value)})}
                    className="h-12 rounded-xl border-slate-200 bg-white shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Minimal Stok</label>
                  <Input 
                    type="number" 
                    value={editingIngredient.lowStockThreshold || ""}
                    onChange={(e) => setEditingIngredient({...editingIngredient, lowStockThreshold: Number(e.target.value)})}
                    className="h-12 rounded-xl border-slate-200 bg-white shadow-sm"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="p-4 sm:p-8 border-t border-slate-50 gap-3 shrink-0 flex-row">
            <Button onClick={handleEditIngredient} className="flex-1 h-16 bg-blue-600 hover:bg-blue-700 rounded-full font-black uppercase text-sm tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
              Simpan
            </Button>
            <Button variant="ghost" onClick={() => setIsEditingIngredient(false)} className="flex-1 h-16 rounded-full font-black uppercase text-xs tracking-widest bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isStockIn} onOpenChange={setIsStockIn}>
        <DialogContent className="w-[calc(100%-3rem)] sm:max-w-md mx-auto rounded-3xl">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="text-xl font-bold text-slate-900">Input Stok Masuk</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">Update jumlah stok untuk {selectedIngredientForStock?.name}.</DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jumlah Masuk ({selectedIngredientForStock?.purchaseUnit})</label>
                <Input 
                  type="number" 
                  value={stockInAmount || ""}
                  onChange={(e) => setStockInAmount(Number(e.target.value))}
                  className="h-14 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-bold text-2xl placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm px-6"
                />
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-slate-50 gap-3 grid grid-cols-2">
            <Button onClick={handleStockIn} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 rounded-full font-black uppercase text-sm tracking-wider shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
              Update Stok
            </Button>
            <button onClick={() => setIsStockIn(false)} className="w-full h-14 rounded-full font-black uppercase text-sm tracking-wider bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">
              Batal
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
