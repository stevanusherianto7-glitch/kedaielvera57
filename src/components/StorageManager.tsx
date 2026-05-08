import * as React from "react";
import { Download, Upload, AlertTriangle, Save, RefreshCw, Trash2, ShieldCheck, Database } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StorageManagerProps {
  isSyncing?: boolean;
  onSyncAll?: () => Promise<void>;
}

export function StorageManager({ isSyncing, onSyncAll }: StorageManagerProps) {
  const [isConfirmClearOpen, setIsConfirmClearOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [lastSync, setLastSync] = React.useState<string | null>(() => {
    return localStorage.getItem("last_sync_time");
  });

  const handleManualSync = async () => {
    if (onSyncAll) {
      await onSyncAll();
      const now = new Date().toLocaleString('id-ID');
      setLastSync(now);
      localStorage.setItem("last_sync_time", now);
    }
  };

  const LOCAL_STORAGE_KEYS = [
    "resto_ingredients",
    "resto_recipes",
    "resto_employees",
    "resto_transactions",
    "resto_attendances",
    "resto_expenses",
    "resto_petty_cash",
    "resto-shift-data",
    "resto-shift-pattern",
    "resto-theme"
  ];

  const handleExport = () => {
    try {
      const exportData: Record<string, string | null> = {};
      LOCAL_STORAGE_KEYS.forEach(key => {
        exportData[key] = localStorage.getItem(key);
      });

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `elvera-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
      alert("Gagal melakukan export data.");
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importData = JSON.parse(event.target?.result as string);
        
        let validKeysFound = false;
        Object.keys(importData).forEach(key => {
          if (LOCAL_STORAGE_KEYS.includes(key) && importData[key] !== null) {
            localStorage.setItem(key, importData[key]);
            validKeysFound = true;
          }
        });

        if (validKeysFound) {
          alert("Import data berhasil! Halaman akan dimuat ulang.");
          window.location.reload();
        } else {
          alert("Gagal import: Format file tidak dikenali atau tidak ada data yang cocok.");
        }
      } catch (error) {
        console.error("Import failed", error);
        alert("Gagal membaca file atau format JSON tidak valid.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClearAll = () => {
    try {
      LOCAL_STORAGE_KEYS.forEach(key => {
        localStorage.removeItem(key);
      });
      alert("Seluruh data berhasil dihapus! Halaman akan dimuat ulang ke state awal.");
      window.location.reload();
    } catch (error) {
      console.error("Clear storage failed", error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="w-8 h-8 text-indigo-500" />
            Manajemen Penyimpanan & Backup
          </h2>
          <p className="text-slate-500 font-medium">Cadangkan data Anda dan pulihkan kapan saja menggunakan Local Storage.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Cloud Sync Card */}
        <div className="glass-card p-8 rounded-[2rem] space-y-6 flex flex-col items-center justify-center text-center shadow-lg border-indigo-100/50 relative overflow-hidden group">
          <div className={cn(
            "w-20 h-20 rounded-[2rem] flex items-center justify-center relative shadow-inner transition-all",
            isSyncing ? "bg-indigo-50 text-indigo-500 animate-pulse" : "bg-emerald-50 text-emerald-500"
          )}>
            <RefreshCw className={cn("w-10 h-10", isSyncing && "animate-spin")} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2">Sinkron Cloud</h3>
            <p className="text-slate-500 text-xs font-medium leading-relaxed px-4">
              {isSyncing ? "Sedang menyinkronkan data..." : "Sinkronkan data lokal Anda ke database cloud Supabase."}
            </p>
            {lastSync && !isSyncing && (
              <p className="text-[10px] font-bold text-emerald-600 mt-2 uppercase tracking-widest">Terakhir: {lastSync}</p>
            )}
          </div>
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className={cn(
              "w-full h-14 rounded-full font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3",
              isSyncing
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 active:scale-95"
            )}
          >
            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
            {isSyncing ? "SINKRONISASI..." : "SINKRON SEKARANG"}
          </button>
        </div>

        {/* Export Card */}
        <div className="glass-card p-8 rounded-[2rem] space-y-6 flex flex-col items-center justify-center text-center shadow-lg border-emerald-100/50">
          <div className="w-20 h-20 rounded-[2rem] bg-emerald-50 text-emerald-500 flex items-center justify-center rotate-3 relative shadow-inner">
            <Download className="w-10 h-10 -rotate-3" />
            <div className="absolute -top-2 -right-2">
              <Badge className="bg-emerald-500 border-none shadow-sm text-[8px] animate-pulse">BU</Badge>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2">Export Backup</h3>
            <p className="text-slate-500 text-xs font-medium leading-relaxed px-4">Unduh semua data lokal Anda (Bahan, Resep, Karyawan, Riwayat) dalam format file JSON.</p>
          </div>
          <button onClick={handleExport} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-3">
            <Download className="w-4 h-4" /> Download JSON
          </button>
        </div>

        {/* Import Card */}
        <div className="glass-card p-8 rounded-[2rem] space-y-6 flex flex-col items-center justify-center text-center shadow-lg border-blue-100/50 relative overflow-hidden group">
          <input 
            type="file" 
            accept=".json"
            ref={fileInputRef}
            className="hidden"
            onChange={handleImport}
          />
          <div className="w-20 h-20 rounded-[2rem] bg-blue-50 text-blue-500 flex items-center justify-center -rotate-3 relative shadow-inner group-hover:rotate-0 transition-transform">
            <Upload className="w-10 h-10 rotate-3 group-hover:rotate-0 transition-transform" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2">Import / Restore</h3>
            <p className="text-slate-500 text-xs font-medium leading-relaxed px-4">Pulihkan data dari file backup JSON sebelumnya. <span className="font-bold text-slate-700">Peringatan: Akan menimpa data yang ada saat ini!</span></p>
          </div>
          <button onClick={() => fileInputRef.current?.click()} className="w-full h-14 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3">
            <Upload className="w-4 h-4" /> Upload JSON
          </button>
        </div>

        {/* Factory Reset Card */}
        <div className="glass-card p-8 rounded-[2rem] space-y-6 flex flex-col items-center justify-center text-center shadow-lg border-rose-100/50">
          <div className="w-20 h-20 rounded-[2rem] bg-rose-50 text-rose-500 flex items-center justify-center rotate-3 relative shadow-inner">
            <Trash2 className="w-10 h-10 -rotate-3" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2">Bersihkan Semua</h3>
            <p className="text-slate-500 text-xs font-medium leading-relaxed px-4">Hapus total semua data operasional Anda dari browser ini selamanya. Lakukan backup terlebih dahulu!</p>
          </div>
          
          <Dialog open={isConfirmClearOpen} onOpenChange={setIsConfirmClearOpen}>
            <DialogTrigger render={<button className="w-full h-14 bg-slate-100 hover:bg-rose-50 text-rose-600 hover:text-rose-700 border-2 border-transparent hover:border-rose-100 active:scale-95 rounded-full font-black text-xs uppercase tracking-widest transition-all gap-3 flex items-center justify-center" />}>
                <AlertTriangle className="w-4 h-4" /> Factory Reset
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-3rem)] sm:max-w-md mx-auto rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
              <div className="p-8 text-center bg-rose-600 text-white relative">
                <ShieldCheck className="w-16 h-16 opacity-20 absolute top-4 left-4" />
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 animate-bounce" />
                <DialogTitle className="text-2xl font-black text-white text-center">KONFIRMASI RESET!</DialogTitle>
                <DialogDescription className="text-rose-100 font-medium text-xs mt-2">
                  Apakah Anda 100% yakin ingin menghapus semua database? Hal ini tidak dapat diurungkan kembali kecuali Anda punya file backup.
                </DialogDescription>
              </div>
              <div className="p-6 bg-white space-y-4">
                <button 
                  onClick={handleClearAll} 
                  className="w-full h-14 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-600/20 transition-all flex items-center justify-center gap-3">
                  YA, HAPUS SEMUA DATA SEKARANG!
                </button>
                <button 
                  onClick={() => setIsConfirmClearOpen(false)} 
                  className="w-full h-14 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 rounded-full font-black text-xs uppercase tracking-widest transition-all">
                  BATALKAN KEPUTUSAN
                </button>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </div>
  );
}
