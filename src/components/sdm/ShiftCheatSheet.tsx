import * as React from "react";
import { 
  Clock, 
  Info, 
  Sun, 
  Moon, 
  Coffee,
  X
} from "lucide-react";
import { SHIFT_CONFIGS } from "../../schedulerConstants";
import { cn } from "@/lib/utils";
import { ShiftType } from "../../types";

interface ShiftCheatSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShiftCheatSheet: React.FC<ShiftCheatSheetProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl shadow-slate-900/20 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
                SHIFT CHEAT SHEET
              </h3>
              <p className="text-[10px] text-slate-400 font-heading font-black uppercase tracking-[0.3em]">PANDUAN JAM KERJA ENGINE STATION</p>
            </div>
            <button 
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-90"
              title="Tutup"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            {Object.values(SHIFT_CONFIGS).map((config) => (
              <div 
                key={config.type}
                className={cn(
                  "p-6 rounded-3xl border border-slate-100 flex items-center justify-between group transition-all hover:shadow-lg hover:shadow-slate-100",
                  config.type === ShiftType.LIBUR ? "bg-rose-50/30" : "bg-white"
                )}
              >
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg transform group-hover:scale-110 transition-transform bg-gradient-to-br",
                    config.colorFrom,
                    config.colorTo
                  )}>
                    {config.code}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 tracking-tight uppercase">{config.label}</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Status Operasional</p>
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Senin - Jumat</span>
                    <span className="text-sm font-black text-slate-900">{config.weekday}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Sabtu - Minggu</span>
                    <span className="text-sm font-black text-indigo-600">{config.weekend}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-indigo-900 p-6 rounded-[2rem] text-white flex items-center gap-4 relative overflow-hidden">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
              <Info className="w-6 h-6 text-white" />
            </div>
            <p className="text-[10px] font-bold leading-relaxed uppercase tracking-wider italic">
              * Perubahan jam kerja khusus di hari libur nasional akan diinformasikan oleh HRD melalui grup koordinasi.
            </p>
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
