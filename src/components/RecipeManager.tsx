import * as React from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Trash2, 
  Edit2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Save,
  Package,
  UtensilsCrossed,
  ArrowRight
} from "lucide-react";
import { Recipe, Ingredient, RecipeItem } from "../types";
import { formatCurrency, cn } from "@/lib/utils";
import { PriceInput } from "./PriceInput";
import { Slider } from "@/components/ui/slider";
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

interface RecipeManagerProps {
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  ingredients: Ingredient[];
  handleExportRecipePDF: (recipe: Recipe) => void;
}

export const RecipeManager: React.FC<RecipeManagerProps> = ({
  recipes,
  setRecipes,
  ingredients,
  handleExportRecipePDF
}) => {
  const [selectedRecipe, setSelectedRecipe] = React.useState<Recipe | null>(null);
  const [isAddingRecipe, setIsAddingRecipe] = React.useState(false);
  const [newRecipeName, setNewRecipeName] = React.useState("");
  const [newRecipeCategory, setNewRecipeCategory] = React.useState<'Makanan' | 'Minuman'>('Makanan');
  const [isAddingIngredientToRecipe, setIsAddingIngredientToRecipe] = React.useState(false);
  const [selectedIngredientForRecipe, setSelectedIngredientForRecipe] = React.useState("");
  const [quantityForRecipe, setQuantityForRecipe] = React.useState(0);
  const [isEditingIngredient, setIsEditingIngredient] = React.useState(false);
  const [editingIngredientId, setEditingIngredientId] = React.useState("");
  const [editingQuantity, setEditingQuantity] = React.useState<number | "">("");
  const [boothCount, setBoothCount] = React.useState<number | "">("");
  const [ownerProfitTarget, setOwnerProfitTarget] = React.useState<number>(0);

  const toTitleCase = (str: string) => {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  };

  const handleAddRecipe = () => {
    if (!newRecipeName) return;
    const recipe: Recipe = {
      id: crypto.randomUUID(),
      name: toTitleCase(newRecipeName),
      category: newRecipeCategory,
      sellingPrice: 0,
      markupPercent: 0,
      laborCost: 0,
      overheadCost: 0,
      shrinkagePercent: 0,
      items: []
    };
    setRecipes([...recipes, recipe]);
    setNewRecipeName("");
    setIsAddingRecipe(false);
    setSelectedRecipe(recipe);
  };

  const handleAddIngredientToRecipe = () => {
    if (!selectedRecipe || !selectedIngredientForRecipe || quantityForRecipe <= 0) return;
    
    const ingredient = ingredients.find(i => i.id === selectedIngredientForRecipe);
    if (!ingredient) return;

    const newItem: RecipeItem = {
      id: crypto.randomUUID(),
      ingredientId: selectedIngredientForRecipe,
      quantityNeeded: quantityForRecipe
    };

    const updatedRecipe = {
      ...selectedRecipe,
      items: [...selectedRecipe.items, newItem]
    };

    setRecipes(recipes.map(r => r.id === selectedRecipe.id ? updatedRecipe : r));
    setSelectedRecipe(updatedRecipe);
    setIsAddingIngredientToRecipe(false);
    setSelectedIngredientForRecipe("");
    setQuantityForRecipe(0);
  };

  const handleEditIngredientInRecipe = () => {
    if (!selectedRecipe || !editingIngredientId || !editingQuantity) return;
    const updatedRecipe = {
      ...selectedRecipe,
      items: selectedRecipe.items.map(item => 
        item.ingredientId === editingIngredientId 
          ? { ...item, quantityNeeded: Number(editingQuantity) }
          : item
      )
    };
    setRecipes(recipes.map(r => r.id === selectedRecipe.id ? updatedRecipe : r));
    setSelectedRecipe(updatedRecipe);
    setIsEditingIngredient(false);
    setEditingIngredientId("");
    setEditingQuantity("");
  };

  const openEditIngredient = (ingredientId: string, currentQuantity: number) => {
    setEditingIngredientId(ingredientId);
    setEditingQuantity(currentQuantity);
    setIsEditingIngredient(true);
  };

  const removeIngredientFromRecipe = (ingredientId: string) => {
    if (!selectedRecipe) return;
    const updatedRecipe = {
      ...selectedRecipe,
      items: selectedRecipe.items.filter(item => item.ingredientId !== ingredientId)
    };
    setRecipes(recipes.map(r => r.id === selectedRecipe.id ? updatedRecipe : r));
    setSelectedRecipe(updatedRecipe);
  };

  const deleteRecipe = (id: string) => {
    setRecipes(recipes.filter(r => r.id !== id));
    if (selectedRecipe?.id === id) setSelectedRecipe(null);
  };

  const updateBreakdown = (field: string, value: number) => {
    if (!selectedRecipe) return;
    
    const currentBreakdown = selectedRecipe.overheadBreakdown || {
      electricity: 0,
      gas: 0,
      gasDailyUsage: 0,
      gasPricePerCylinder: 0,
      water: 0,
      marketing: 0,
      internet: 0,
      trashFee: 0,
      wastePercent: 0,
      labor: 0,
      employeeCount: 1,
      salaryPerEmployee: 0,
      targetPortions: 1
    };

    let newBreakdown = {
      ...currentBreakdown,
      [field]: value
    };

    // Auto-calculate total labor if employee count or salary changes
    if (field === 'employeeCount' || field === 'salaryPerEmployee') {
      newBreakdown.labor = newBreakdown.employeeCount * newBreakdown.salaryPerEmployee;
    }

    // Auto-calculate total gas if daily usage or price per cylinder changes
    if (field === 'gasDailyUsage' || field === 'gasPricePerCylinder') {
      newBreakdown.gas = (newBreakdown.gasDailyUsage || 0) * (newBreakdown.gasPricePerCylinder || 0) * 30;
    }

    const portions = newBreakdown.targetPortions || 1;
    
    // Calculate per portion costs
    const perPortionLabor = newBreakdown.labor / portions;
    const perPortionOverhead = (newBreakdown.electricity + newBreakdown.gas + newBreakdown.water + newBreakdown.marketing + newBreakdown.internet + (newBreakdown.trashFee || 0)) / portions;

    const updatedRecipe = {
      ...selectedRecipe,
      overheadBreakdown: newBreakdown,
      laborCost: perPortionLabor,
      overheadCost: perPortionOverhead,
      shrinkagePercent: newBreakdown.wastePercent // Sync top-level shrinkage with monthly waste
    };

    setRecipes(recipes.map(r => r.id === selectedRecipe.id ? updatedRecipe : r));
    setSelectedRecipe(updatedRecipe);
  };

  const { hpp, rawHpp, wasteAmount, totalCost, safeTotalCost, foodCostPercent, marginAmount, marginPercent } = React.useMemo(() => {
    if (!selectedRecipe) return { hpp: 0, rawHpp: 0, wasteAmount: 0, totalCost: 0, safeTotalCost: 0, foodCostPercent: 0, marginAmount: 0, marginPercent: 0 };

    const raw = selectedRecipe.items.reduce((acc, item) => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      if (!ing || !ing.conversionValue || ing.conversionValue === 0) return acc;
      const pricePerUnit = ing.purchasePrice / ing.conversionValue;
      return acc + (item.quantityNeeded * pricePerUnit);
    }, 0);

    const waste = raw * ((selectedRecipe.shrinkagePercent || 0) / 100);
    const calculatedHpp = raw + waste;
    const total = calculatedHpp + (selectedRecipe.laborCost || 0) + (selectedRecipe.overheadCost || 0);
    const safeTotal = isNaN(total) ? 0 : total;
    const actualSellingPrice = selectedRecipe.roundedSellingPrice || selectedRecipe.sellingPrice || 0;
    const foodCostPct = actualSellingPrice > 0 ? Math.round((calculatedHpp / actualSellingPrice) * 100) : 0;
    const marginAmt = actualSellingPrice - safeTotal;
    const marginPct = actualSellingPrice > 0 ? Math.round((marginAmt / actualSellingPrice) * 100) : 0;

    return {
      hpp: calculatedHpp,
      rawHpp: raw,
      wasteAmount: waste,
      totalCost: total,
      safeTotalCost: safeTotal,
      foodCostPercent: foodCostPct,
      marginAmount: marginAmt,
      marginPercent: marginPct
    };
  }, [selectedRecipe, ingredients]);

  if (selectedRecipe) {

    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight truncate">{selectedRecipe.name}</h2>
              <Badge className={cn(
                "font-bold uppercase tracking-widest text-[10px] px-2 py-0.5 border-none cursor-pointer hover:opacity-80 transition-opacity",
                (selectedRecipe.category === 'Makanan' || !selectedRecipe.category) ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
              )}
              onClick={() => {
                const newCat: 'Makanan' | 'Minuman' = selectedRecipe.category === 'Makanan' ? 'Minuman' : 'Makanan';
                const updated: Recipe = { ...selectedRecipe, category: newCat };
                setRecipes(recipes.map(r => r.id === selectedRecipe.id ? updated : r));
                setSelectedRecipe(updated);
              }}
              >
                {selectedRecipe.category || "Makanan"}
              </Badge>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Detail BOM & Kalkulasi HPP</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
              <div className="p-5 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase">Komposisi Bahan Baku</h3>
                  <Dialog open={isAddingIngredientToRecipe} onOpenChange={setIsAddingIngredientToRecipe}>
                    <DialogTrigger render={
                      <button className="flex items-center gap-2 px-4 py-2 bg-[#800000] text-white rounded-xl shadow-lg text-xs font-bold hover:bg-[#600000] transition-all active:scale-95">
                        <Plus className="w-4 h-4" />
                        Tambah Bahan
                      </button>
                    } />
                    <DialogContent className="w-[calc(100%-3rem)] sm:max-w-md mx-auto rounded-3xl">
                      <DialogHeader className="px-4 pt-4">
                        <DialogTitle className="text-xl font-bold text-slate-900">Tambah Bahan ke Resep</DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs">Pilih bahan baku dan tentukan jumlah pemakaian.</DialogDescription>
                      </DialogHeader>
                      <div className="p-4 space-y-4 bg-slate-100 shadow-inner">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pilih Bahan</label>
                          <select 
                            className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm"
                            value={selectedIngredientForRecipe}
                            onChange={(e) => setSelectedIngredientForRecipe(e.target.value)}
                            title="Pilih Bahan"
                          >
                            <option value="">-- Pilih Bahan Baku --</option>
                            {ingredients.map(ing => (
                              <option key={ing.id} value={ing.id}>{ing.name} ({ing.useUnit})</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jumlah Pemakaian</label>
                          <div className="relative">
                            <Input 
                              type="number" 
                              value={quantityForRecipe || ""}
                              onChange={(e) => setQuantityForRecipe(Number(e.target.value))}
                              className="h-12 rounded-xl border-slate-200 bg-white font-bold pr-12 shadow-sm"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                              {ingredients.find(i => i.id === selectedIngredientForRecipe)?.useUnit || "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="p-4 border-t border-slate-50 gap-3 grid grid-cols-2">
                        <Button onClick={handleAddIngredientToRecipe} className="h-14 bg-emerald-600 hover:bg-emerald-700 rounded-full font-black uppercase text-sm tracking-wider shadow-xl shadow-emerald-500/20 active:scale-95 transition-all w-full">
                          Tambahkan
                        </Button>
                        <button onClick={() => setIsAddingIngredientToRecipe(false)} className="h-14 rounded-full font-black uppercase text-sm tracking-wider bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all w-full">
                          Batal
                        </button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isEditingIngredient} onOpenChange={setIsEditingIngredient}>
                    <DialogContent className="w-[calc(100%-3rem)] sm:max-w-md mx-auto rounded-3xl">
                      <DialogHeader className="px-4 pt-4">
                        <DialogTitle className="text-xl font-bold text-slate-900">Edit Pemakaian Bahan</DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs">Ubah jumlah pemakaian bahan baku untuk resep ini.</DialogDescription>
                      </DialogHeader>
                      <div className="p-4 space-y-4 bg-slate-100 shadow-inner">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bahan Baku</label>
                          <div className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 flex items-center text-sm font-bold text-slate-600 shadow-sm">
                            {ingredients.find(i => i.id === editingIngredientId)?.name || "-"}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jumlah Pemakaian Baru</label>
                          <div className="relative">
                            <Input 
                              type="number" 
                              value={editingQuantity || ""}
                              onChange={(e) => setEditingQuantity(Number(e.target.value))}
                              className="h-12 rounded-xl border-slate-200 bg-white font-bold pr-12 shadow-sm"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                              {ingredients.find(i => i.id === editingIngredientId)?.useUnit || "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="p-4 border-t border-slate-50 gap-3 grid grid-cols-2">
                        <Button onClick={handleEditIngredientInRecipe} className="h-14 bg-blue-600 hover:bg-blue-700 rounded-full font-black uppercase text-[10px] tracking-wider shadow-xl shadow-blue-500/20 active:scale-95 transition-all w-full">
                          Simpan Perubahan
                        </Button>
                        <button onClick={() => setIsEditingIngredient(false)} className="h-14 rounded-full font-black uppercase text-[10px] tracking-wider bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all w-full">
                          Batal
                        </button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-3">
                  {selectedRecipe.items.length === 0 ? (
                    <div className="py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                      <p className="text-slate-400 font-medium">Belum ada bahan yang ditambahkan.</p>
                    </div>
                  ) : (
                    selectedRecipe.items.map((item, idx) => {
                      const ing = ingredients.find(i => i.id === item.ingredientId);
                      if (!ing) return null;
                      const cost = (ing.purchasePrice / ing.conversionValue) * item.quantityNeeded;
                      return (
                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              <Package className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900">{ing.name}</h4>
                              <p className="text-xs text-slate-500 font-medium">{item.quantityNeeded} {ing.useUnit} @ {formatCurrency(ing.purchasePrice / ing.conversionValue)}/{ing.useUnit}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right mr-4">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Subtotal HPP</p>
                              <div className="flex justify-between min-w-[90px] font-bold text-slate-900">
                                <span>Rp</span>
                                <span>{Math.round(cost).toLocaleString('id-ID')}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => openEditIngredient(item.ingredientId, item.quantityNeeded)}
                              className="p-2 text-slate-300 hover:text-blue-500 transition-colors"
                              title="Edit Pemakaian"
                            >
                              <Pencil className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => removeIngredientFromRecipe(item.ingredientId)}
                              className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                              title="Hapus Bahan"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pt-8 border-t border-slate-50 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase">Alokasi Bulanan</h3>
                    <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[10px]">Otomatis</Badge>
                  </div>
                  
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-6 shadow-inner">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      {/* Column 1 */}
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Target Penjualan Porsi / Bulan</label>
                          <div className="relative group">
                            <Input 
                              type="number"
                              value={selectedRecipe.overheadBreakdown?.targetPortions || ""}
                              onChange={(e) => {
                                const val = e.target.value === "" ? 0 : Number(e.target.value);
                                updateBreakdown('targetPortions', val);
                              }}
                              className="h-12 rounded-xl border border-slate-200 bg-white font-bold text-base shadow-md focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300"
                              placeholder=""
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-50 rounded-lg text-[9px] font-bold text-slate-400 uppercase">Porsi</div>
                          </div>
                        </div>

                        <div className="space-y-4 p-5 bg-slate-100/50 rounded-2xl border border-slate-200/50 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                            <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest">Kalkulasi Gaji Karyawan</label>
                          </div>
                          <div className="grid grid-cols-1 gap-5">
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold text-slate-400 uppercase ml-1">Jumlah Karyawan</p>
                              <Input 
                                type="number"
                                value={selectedRecipe.overheadBreakdown?.employeeCount || ""}
                                onChange={(e) => updateBreakdown('employeeCount', Number(e.target.value))}
                                className="h-12 rounded-xl border border-slate-200 bg-white font-bold shadow-md focus:ring-4 focus:ring-blue-500/10 transition-all"
                                placeholder=""
                              />
                            </div>
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold text-slate-400 uppercase ml-1">Gaji / Orang</p>
                              <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</div>
                                <PriceInput 
                                  value={selectedRecipe.overheadBreakdown?.salaryPerEmployee || 0}
                                  onChange={(val) => updateBreakdown('salaryPerEmployee', val)}
                                  className="h-12 rounded-xl border border-slate-200 bg-white shadow-md focus:ring-4 focus:ring-blue-500/10 transition-all pl-12"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="pt-4 mt-2 border-t border-slate-200/50 flex justify-between items-end">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Gaji / Bln</p>
                              <p className="text-sm font-bold text-slate-900 tracking-tight">{formatCurrency(selectedRecipe.overheadBreakdown?.labor || 0)}</p>
                            </div>
                            <Badge className="bg-white text-blue-600 border-blue-100 shadow-sm mb-1">Beban Gaji</Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Total Listrik / Bln</label>
                          <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">Rp</div>
                            <PriceInput 
                              value={selectedRecipe.overheadBreakdown?.electricity || 0}
                              onChange={(val) => updateBreakdown('electricity', val)}
                              className="h-12 rounded-xl border border-slate-200 bg-white shadow-md focus:ring-4 focus:ring-blue-500/10 transition-all pl-12"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Iuran Sampah / Bln</label>
                          <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">Rp</div>
                            <PriceInput 
                              value={selectedRecipe.overheadBreakdown?.trashFee || 0}
                              onChange={(val) => updateBreakdown('trashFee', val)}
                              className="h-12 rounded-xl border border-slate-200 bg-white shadow-md focus:ring-4 focus:ring-blue-500/10 transition-all pl-12"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Column 2 */}
                      <div className="space-y-6">
                        <div className="space-y-3 p-4 bg-slate-100/50 rounded-2xl border border-slate-200/60">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Kalkulasi Gas Elpiji</label>
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <p className="text-[8px] font-bold text-slate-400 uppercase ml-1">Pemakaian</p>
                              <div className="relative">
                                <Input 
                                  type="number"
                                  value={selectedRecipe.overheadBreakdown?.gasDailyUsage || ""}
                                  onChange={(e) => updateBreakdown('gasDailyUsage', Number(e.target.value))}
                                  className="h-12 rounded-xl border border-slate-200 bg-white font-bold shadow-md focus:ring-4 focus:ring-blue-500/10 transition-all pr-12"
                                  placeholder=""
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">Tbg</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <p className="text-[8px] font-bold text-slate-400 uppercase ml-1">Harga / Tabung</p>
                              <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</div>
                                <PriceInput 
                                  value={selectedRecipe.overheadBreakdown?.gasPricePerCylinder || 0}
                                  onChange={(val) => updateBreakdown('gasPricePerCylinder', val)}
                                  className="h-12 rounded-xl border border-slate-200 bg-white shadow-md focus:ring-4 focus:ring-blue-500/10 transition-all pl-12"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="pt-4 mt-2 border-t border-slate-200/50 flex justify-between items-end">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Gas / Bln</p>
                              <p className="text-sm font-bold text-slate-900 tracking-tight">{formatCurrency(selectedRecipe.overheadBreakdown?.gas || 0)}</p>
                            </div>
                            <Badge className="bg-white text-blue-600 border-blue-100 shadow-sm mb-1">Beban Gas</Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Total Air / Bln</label>
                          <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">Rp</div>
                            <PriceInput 
                              value={selectedRecipe.overheadBreakdown?.water || 0}
                              onChange={(val) => updateBreakdown('water', val)}
                              className="h-12 rounded-xl border border-slate-200 bg-white shadow-md focus:ring-4 focus:ring-blue-500/10 transition-all pl-12"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Total Promosi & Iklan / Bln</label>
                          <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">Rp</div>
                            <PriceInput 
                              value={selectedRecipe.overheadBreakdown?.marketing || 0}
                              onChange={(val) => updateBreakdown('marketing', val)}
                              className="h-12 rounded-xl border border-slate-200 bg-white shadow-md focus:ring-4 focus:ring-blue-500/10 transition-all pl-12"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Total Internet / Bln</label>
                          <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">Rp</div>
                            <PriceInput 
                              value={selectedRecipe.overheadBreakdown?.internet || 0}
                              onChange={(val) => updateBreakdown('internet', val)}
                              className="h-12 rounded-xl border border-slate-200 bg-white shadow-md focus:ring-4 focus:ring-blue-500/10 transition-all pl-12"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Waste & Spoilage (%) / Bln</label>
                          <div className="relative">
                            <Input 
                              type="number"
                              value={selectedRecipe.overheadBreakdown?.wastePercent || ""}
                              onChange={(e) => updateBreakdown('wastePercent', Number(e.target.value))}
                              className="h-12 rounded-xl border border-slate-200 bg-white font-bold text-base shadow-md focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300"
                              placeholder=""
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-50 rounded-lg text-[9px] font-bold text-slate-400 uppercase">%</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20">
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-blue-100 uppercase tracking-[0.2em] mb-3">Alokasi Per Porsi</p>
                        <div className="flex flex-col gap-3">
                          <div>
                            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider mb-1">Tenaga Kerja</p>
                            <p className="text-xl font-black text-white leading-none">{formatCurrency(selectedRecipe.laborCost)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider mb-1">Overhead</p>
                            <p className="text-xl font-black text-white leading-none">{formatCurrency(selectedRecipe.overheadCost)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
              <div className="p-5 space-y-6 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">HPP Bahan</p>
                    <p className="text-xl font-bold text-slate-900 tracking-tight">{formatCurrency(hpp)}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Cost</p>
                    <p className="text-xl font-bold text-emerald-600 tracking-tight">{formatCurrency(totalCost)}</p>
                  </div>
                </div>

                <div className="space-y-6 pt-8 border-t border-slate-50">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analisis HPP</label>
                      <Badge variant="outline" className="text-[9px] font-bold text-slate-400 border-slate-200">Per Porsi</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-500">Bahan Baku Murni</span>
                        <div className="flex justify-between min-w-[90px] text-slate-900">
                          <span>Rp</span>
                          <span>{Math.round(rawHpp).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                      {selectedRecipe.shrinkagePercent > 0 && (
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-rose-500">Waste & Spoilage ({selectedRecipe.shrinkagePercent}%)</span>
                          <div className="flex justify-between min-w-[90px] text-rose-600">
                            <span>+ Rp</span>
                            <span>{Math.round(wasteAmount).toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      )}
                      <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-bold">
                        <span className="text-slate-900">Total HPP</span>
                        <div className="flex justify-between min-w-[90px] text-blue-600">
                          <span>Rp</span>
                          <span>{Math.round(hpp).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Margin (%)</label>
                      <span className="text-sm font-bold text-emerald-600">{selectedRecipe.markupPercent || 0}%</span>
                    </div>
                    <Slider 
                      value={[selectedRecipe.markupPercent || 0]} 
                      min={0}
                      max={95} 
                      step={1}
                      onValueChange={(vals) => {
                        const targetMargin = Array.isArray(vals) ? vals[0] : vals;
                        const newSellingPrice = safeTotalCost > 0 
                          ? Math.round(safeTotalCost / (1 - targetMargin / 100))
                          : selectedRecipe.sellingPrice;
                        
                        const updatedRecipe = {
                          ...selectedRecipe,
                          markupPercent: targetMargin,
                          sellingPrice: newSellingPrice,
                          roundedSellingPrice: undefined
                        };
                        setRecipes(recipes.map(r => r.id === selectedRecipe.id ? updatedRecipe : r));
                        setSelectedRecipe(updatedRecipe);
                      }}
                    />
                    <p className="text-[9px] text-slate-400 font-medium italic">Geser untuk simulasi harga jual berdasarkan target keuntungan.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rekomendasi Harga Jual</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</div>
                        <PriceInput 
                          value={selectedRecipe.sellingPrice || 0}
                          onChange={(val) => {
                            const newMargin = val > safeTotalCost && val > 0 ? Math.round(((val - safeTotalCost) / val) * 100) : 0;
                            const updatedRecipe = {
                              ...selectedRecipe,
                              sellingPrice: val,
                              markupPercent: newMargin,
                              roundedSellingPrice: undefined
                            };
                            setRecipes(recipes.map(r => r.id === selectedRecipe.id ? updatedRecipe : r));
                            setSelectedRecipe(updatedRecipe);
                          }}
                          className="h-14 rounded-2xl border-slate-100 text-xl font-bold text-slate-900 focus:ring-emerald-500/10 pl-12"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Harga Jual (Pembulatan)</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</div>
                        <PriceInput 
                          value={selectedRecipe.roundedSellingPrice !== undefined ? selectedRecipe.roundedSellingPrice : (selectedRecipe.sellingPrice || 0)}
                          onChange={(val) => {
                            const updatedRecipe = {
                              ...selectedRecipe,
                              roundedSellingPrice: val
                            };
                            setRecipes(recipes.map(r => r.id === selectedRecipe.id ? updatedRecipe : r));
                            setSelectedRecipe(updatedRecipe);
                          }}
                          className="h-14 rounded-2xl border-emerald-100 bg-emerald-50 text-xl font-bold text-emerald-900 focus:ring-emerald-500/20 pl-12"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="p-4 bg-emerald-50 rounded-2xl flex justify-between items-center">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Food Cost %</p>
                      <p className="text-xl font-bold text-emerald-700">{foodCostPercent}%</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-2xl flex justify-between items-center">
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Margin Aktual</p>
                      <p className={cn(
                        "text-xl font-bold",
                        marginPercent <= 0 ? "text-rose-600" : "text-amber-700"
                      )}>{marginPercent}%</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-2xl flex justify-between items-center">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Laba / Porsi</p>
                      <p className={cn(
                        "text-xl font-bold",
                        marginAmount <= 0 ? "text-rose-600" : "text-blue-700"
                      )}>{formatCurrency(marginAmount)}</p>
                    </div>
                  </div>
                  {marginAmount <= 0 && (
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                      <p className="text-[10px] font-bold text-rose-600 leading-tight">
                        ⚠️ Peringatan: Harga jual Anda belum menghasilkan laba bersih. Periksa kembali Biaya Overhead atau naikkan Target Margin.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-4">
                  <Button 
                    onClick={() => handleExportRecipePDF(selectedRecipe)}
                    className="w-full h-14 bg-violet-600 hover:bg-violet-700 rounded-2xl font-bold shadow-lg text-white"
                  >
                    <FileDown className="w-5 h-5 mr-2" />
                    Export PDF Resep
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => deleteRecipe(selectedRecipe.id)}
                    className="w-full h-14 rounded-2xl font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-slate-100"
                  >
                    <Trash2 className="w-5 h-5 mr-2" />
                    Hapus Resep
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
              <div className="p-5 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Kalkulator Sewa Lapak</h3>
                  <p className="text-[11px] font-medium text-slate-500">Estimasi biaya sewa per kavling untuk menutupi biaya operasional bersama dan target keuntungan.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-5 bg-slate-100/50 rounded-2xl border border-slate-200/60">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Jumlah Lapak</label>
                        <Input 
                          type="number"
                          value={boothCount}
                          onChange={(e) => setBoothCount(e.target.value === "" ? "" : Math.max(1, Number(e.target.value)))}
                          className="h-12 rounded-xl border border-slate-200 bg-white font-bold shadow-md focus:ring-4 focus:ring-blue-500/10 transition-all"
                          placeholder=""
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target Laba</label>
                        <PriceInput 
                          value={ownerProfitTarget || 0}
                          onChange={(val) => setOwnerProfitTarget(val)}
                          className="h-12 rounded-xl border border-slate-200 bg-white shadow-md focus:ring-4 focus:ring-blue-500/10 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl space-y-4 border border-slate-100">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Operasional Bersama</span>
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(
                        (selectedRecipe.overheadBreakdown?.labor || 0) + 
                        (selectedRecipe.overheadBreakdown?.electricity || 0) + 
                        (selectedRecipe.overheadBreakdown?.gas || 0) + 
                        (selectedRecipe.overheadBreakdown?.water || 0) + 
                        (selectedRecipe.overheadBreakdown?.marketing || 0) + 
                        (selectedRecipe.overheadBreakdown?.internet || 0) +
                        (selectedRecipe.overheadBreakdown?.trashFee || 0)
                      )}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Target Laba</span>
                      <span className="text-sm font-bold text-emerald-700">+{formatCurrency(ownerProfitTarget)}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-200 flex flex-col space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rekomendasi Sewa / Lapak</span>
                      <span className="text-lg font-black text-blue-600">
                        {formatCurrency(
                          ((selectedRecipe.overheadBreakdown?.labor || 0) + 
                          (selectedRecipe.overheadBreakdown?.electricity || 0) + 
                          (selectedRecipe.overheadBreakdown?.gas || 0) + 
                          (selectedRecipe.overheadBreakdown?.water || 0) + 
                          (selectedRecipe.overheadBreakdown?.marketing || 0) + 
                          (selectedRecipe.overheadBreakdown?.internet || 0) + 
                          (selectedRecipe.overheadBreakdown?.trashFee || 0) + 
                          ownerProfitTarget) / (boothCount || 1)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-heading font-black text-slate-900 tracking-tight">Katalog HPP & Menu</h2>
          <p className="text-slate-500 font-medium text-sm">Kelola standar porsi, Bill of Materials, dan kalkulasi profit margin.</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isAddingRecipe} onOpenChange={setIsAddingRecipe}>
          <DialogTrigger render={
            <button className="flex items-center gap-2 px-8 h-14 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-600/20 font-heading font-black hover:bg-emerald-700 transition-all active:scale-95 uppercase text-sm tracking-wider">
              <Plus className="w-5 h-5" />
              Kalkulasi HPP Baru
            </button>
          } />
          <DialogContent className="w-[calc(100%-3rem)] sm:max-w-md mx-auto rounded-3xl p-6">
            <DialogHeader className="px-0 pt-0">
              <DialogTitle className="text-xl font-heading font-black text-slate-900">NAMA MENU BARU</DialogTitle>
              <DialogDescription className="text-slate-500 text-xs">Masukkan nama menu dan kategori yang akan dibuatkan resepnya.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-heading font-black text-slate-500 uppercase tracking-widest">Nama Menu Baru</label>
                <Input 
                  placeholder="Contoh: Nasi Goreng Spesial" 
                  value={newRecipeName}
                  onChange={(e) => setNewRecipeName(toTitleCase(e.target.value))}
                  className="h-14 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-bold text-lg placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-widest">Kategori</label>
                <div className="bg-slate-100 p-1.5 rounded-full flex gap-1 h-16 border border-slate-200/50 shadow-inner">
                  <button
                    onClick={() => setNewRecipeCategory('Makanan')}
                    className={cn(
                      "flex-1 rounded-full font-heading font-black text-sm uppercase tracking-wider transition-all",
                      newRecipeCategory === 'Makanan' 
                        ? "bg-white text-slate-900 shadow-sm" 
                        : "text-slate-500 hover:bg-white/50"
                    )}
                  >
                    Makanan
                  </button>
                  <button
                    onClick={() => setNewRecipeCategory('Minuman')}
                    className={cn(
                      "flex-1 rounded-full font-heading font-black text-sm uppercase tracking-wider transition-all",
                      newRecipeCategory === 'Minuman' 
                        ? "bg-white text-slate-900 shadow-sm" 
                        : "text-slate-500 hover:bg-white/50"
                    )}
                  >
                    Minuman
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter className="px-0 pb-0 pt-4 border-t border-slate-50 grid grid-cols-2 gap-3">
              <Button onClick={handleAddRecipe} className="h-14 bg-emerald-600 hover:bg-emerald-700 font-heading font-black uppercase text-sm tracking-wider shadow-lg shadow-emerald-500/20 rounded-full w-full">
                HPP
              </Button>
              <button onClick={() => setIsAddingRecipe(false)} className="h-14 rounded-full font-heading font-black uppercase text-xs tracking-wider bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors w-full">
                Batal
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
        {recipes.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-xl border border-dashed border-slate-200">
            <UtensilsCrossed className="w-10 h-10 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Belum ada resep yang dibuat</p>
          </div>
        ) : (
          recipes.map(recipe => {
            const hpp = recipe.items.reduce((acc, item) => {
              const ing = ingredients.find(i => i.id === item.ingredientId);
              if (!ing) return acc;
              const pricePerUnit = ing.purchasePrice / ing.conversionValue;
              return acc + (item.quantityNeeded * pricePerUnit);
            }, 0);

            return (
              <Tooltip key={recipe.id}>
                <TooltipTrigger render={
                  <Card 
                    className="premium-card relative group"
                    onClick={() => setSelectedRecipe(recipe)}
                  >
                    <div className="p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                          <UtensilsCrossed className="w-4 h-4 text-slate-300 group-hover:text-white transition-colors" />
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">HPP</p>
                          <p className="text-[11px] font-bold text-slate-900">{formatCurrency(hpp)}</p>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-[11px] font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1 leading-tight">{recipe.name}</h3>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{recipe.items.length} Bahan</p>
                      </div>
                      <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-emerald-500" />
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Active BOM</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </Card>
                } />
                <TooltipContent>
                  <p className="text-[10px] font-bold">Klik untuk detail resep</p>
                </TooltipContent>
              </Tooltip>
            );
          })
        )}
      </div>
    </div>
  );
};
