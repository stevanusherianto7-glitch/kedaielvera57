import React from 'react';
import { ChevronLeft, ChevronRight, FileText, CalendarDays } from 'lucide-react';
import GlossyButton from './GlossyButton';
import { ShiftType } from '../../types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SchedulerHeaderProps {
  onExportPDF?: () => void;
  onExportWeeklyPDF?: () => void;
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  view: 'grid' | 'pattern';
  onViewChange: (view: 'grid' | 'pattern') => void;
}

const SchedulerHeader: React.FC<SchedulerHeaderProps> = ({
  onExportPDF,
  onExportWeeklyPDF,
  currentDate,
  onPreviousMonth,
  onNextMonth,
  view,
  onViewChange,
}) => {
  const monthYearString = currentDate.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* Row 1: View Toggle & Time Cheat Sheet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Toggle View */}
        <div className="flex h-16 bg-slate-100 p-1.5 rounded-[1.5rem] w-full shadow-inner">
          <button 
            onClick={() => onViewChange('grid')}
            className={cn(
              "flex-1 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
              view === 'grid' ? "bg-white text-slate-900 shadow-lg" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Monthly Grid
          </button>
          <button 
            onClick={() => onViewChange('pattern')}
            className={cn(
              "flex-1 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
              view === 'pattern' ? "bg-white text-slate-900 shadow-lg" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Weekly Pattern
          </button>
        </div>

        {/* Compact Time Cheat Sheet */}
        <div className="h-16 bg-slate-100/80 backdrop-blur-sm border border-slate-200/50 px-6 rounded-[1.5rem] flex flex-col justify-center gap-1.5 shadow-sm">
          <div className="flex items-center justify-between text-[9px] font-black tracking-widest">
            <span className="text-slate-500">SENIN - JUMAT</span>
            <span className="text-indigo-600">10.00 - 21.00</span>
          </div>
          <div className="h-[1px] bg-slate-200/50 w-full"></div>
          <div className="flex items-center justify-between text-[9px] font-black tracking-widest">
            <span className="text-rose-400">SABTU - MINGGU</span>
            <span className="text-rose-600">08.00 - 21.00</span>
          </div>
        </div>
      </div>

      {/* Row 2: Legend & Month Control */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Legend - Spheres */}
        <div className="flex h-16 items-center justify-around px-6 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm">
          <div className="flex flex-col items-center gap-1">
            <GlossyButton type={ShiftType.PAGI} size="sm" />
            <span className="text-slate-400 text-[8px] font-black uppercase tracking-widest leading-none">PAGI</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <GlossyButton type={ShiftType.MIDDLE} size="sm" />
            <span className="text-slate-400 text-[8px] font-black uppercase tracking-widest leading-none">MIDDLE</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <GlossyButton type={ShiftType.LIBUR} size="sm" />
            <span className="text-slate-400 text-[8px] font-black uppercase tracking-widest leading-none">LIBUR</span>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex h-16 items-center justify-between bg-white border border-slate-100 rounded-[1.5rem] shadow-sm p-1.5">
          <button 
            onClick={onPreviousMonth} 
            title="Bulan Sebelumnya"
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 bg-slate-50 rounded-full transition-all active:scale-90"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-slate-900 font-black text-xs uppercase tracking-widest">{monthYearString}</span>
          <button 
            onClick={onNextMonth} 
            title="Bulan Berikutnya"
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 bg-slate-50 rounded-full transition-all active:scale-90"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Row 3: Split PDF Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={onExportPDF}
          className="h-16 px-8 rounded-2xl font-black text-[10px] tracking-[0.2em] bg-white border-2 border-slate-100 text-slate-600 hover:border-indigo-100 hover:text-indigo-600 transition-all flex items-center justify-center shadow-sm active:scale-95 group"
        >
          <FileText size={18} className="mr-3 group-hover:scale-110 transition-transform" />
          PDF MONTHLY
        </button>
        <button 
          onClick={onExportWeeklyPDF}
          className="h-16 px-8 rounded-2xl font-black text-[10px] tracking-[0.2em] bg-slate-900 text-white hover:bg-black transition-all flex items-center justify-center shadow-xl shadow-slate-200 active:scale-95 group uppercase"
        >
          <CalendarDays size={18} className="mr-3 group-hover:scale-110 transition-transform font-black" />
          PDF Weekly
        </button>
      </div>
    </div>
  );
};

export default SchedulerHeader;
