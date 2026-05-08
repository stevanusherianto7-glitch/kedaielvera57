import * as React from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MinusCircle, 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon,
  Users
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Employee, Attendance } from "../../types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AttendanceGridProps {
  employees: Employee[];
  attendances: Attendance[];
  onToggleAttendance: (employeeId: string, date: string, status: Attendance['status']) => void;
}

export const AttendanceGrid: React.FC<AttendanceGridProps> = ({
  employees,
  attendances,
  onToggleAttendance
}) => {
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  const dateStr = selectedDate.toISOString().split('T')[0];

  const getAttendanceStatus = (employeeId: string, date: string) => {
    return attendances.find(a => a.employeeId === employeeId && a.date === date)?.status;
  };

  const statusColors = {
    Hadir: "bg-emerald-500 text-white",
    Izin: "bg-blue-500 text-white",
    Sakit: "bg-amber-500 text-white",
    Alpha: "bg-rose-500 text-white"
  };

  const statusIcons = {
    Hadir: <CheckCircle2 className="w-4 h-4" />,
    Izin: <Clock className="w-4 h-4" />,
    Sakit: <MinusCircle className="w-4 h-4" />,
    Alpha: <XCircle className="w-4 h-4" />
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Date Selector Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
              {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
            </h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">MANAJEMEN KEHADIRAN HARIAN</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-full border border-slate-100">
          <button 
            onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)))}
            className="w-10 h-10 rounded-full hover:bg-white hover:shadow-md flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all active:scale-90"
            title="Satu Hari Sebelumnya"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => setSelectedDate(new Date())}
            className="px-4 py-2 bg-white text-indigo-600 font-black text-xs rounded-full shadow-sm hover:shadow-md active:scale-95 transition-all tracking-widest"
          >
            HARI INI
          </button>
          <button 
            onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)))}
            className="w-10 h-10 rounded-full hover:bg-white hover:shadow-md flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all active:scale-90"
            title="Satu Hari Berikutnya"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Attendance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map(emp => {
          const status = getAttendanceStatus(emp.id, dateStr);
          
          return (
            <Card key={emp.id} className="border-none shadow-sm bg-white overflow-hidden group rounded-[2rem] hover:shadow-xl transition-all border border-slate-50">
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500 transition-colors shadow-inner">
                    <Users className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-slate-900 truncate uppercase tracking-tight">{emp.name}</h3>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">{emp.role}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {(['Hadir', 'Izin', 'Sakit', 'Alpha'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => onToggleAttendance(emp.id, dateStr, s)}
                      className={cn(
                        "flex items-center justify-center gap-2 h-12 rounded-full text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 border",
                        status === s 
                          ? statusColors[s] + " border-transparent shadow-lg" 
                          : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50"
                      )}
                    >
                      {statusIcons[s]}
                      {s}
                    </button>
                  ))}
                </div>

                {/* 7-Day Mini Heatmap */}
                <div className="space-y-3">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Histori 7 Hari Terakhir</p>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 7 }).map((_, i) => {
                      const d = new Date(selectedDate);
                      d.setDate(d.getDate() - (6 - i));
                      const dStr = d.toISOString().split('T')[0];
                      const s = getAttendanceStatus(emp.id, dStr);
                      return (
                        <div 
                          key={i} 
                          title={dStr}
                          className={cn(
                            "flex-1 h-1.5 rounded-full transition-all",
                            s === 'Hadir' ? "bg-emerald-500" :
                            s === 'Izin' ? "bg-blue-400" :
                            s === 'Sakit' ? "bg-amber-400" :
                            s === 'Alpha' ? "bg-rose-400" :
                            "bg-slate-100"
                          )}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Gaji Harian (Est.)</p>
                    <p className="text-sm font-black text-slate-900">{formatCurrency(emp.salary / 26)}</p>
                  </div>
                  {status && (
                    <Badge className={cn("px-3 py-1 rounded-lg border-none text-[8px] font-black animate-in zoom-in-95", statusColors[status])}>
                      {status.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Monthly Summary Preview */}
      <Card className="p-8 border-none bg-slate-900 text-white rounded-[3rem] shadow-2xl overflow-hidden relative">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="space-y-2">
            <h3 className="text-2xl font-black italic tracking-tight">Status Kehadiran Tim</h3>
            <p className="text-slate-400 text-sm font-medium">Bulan: {selectedDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8">
            <div className="text-center">
              <p className="text-emerald-400 font-black text-3xl tabular-nums">
                {attendances.filter(a => a.date.startsWith(dateStr.substring(0, 7)) && a.status === 'Hadir').length}
              </p>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Hadir</p>
            </div>
            <div className="text-center">
              <p className="text-blue-400 font-black text-3xl tabular-nums">
                {attendances.filter(a => a.date.startsWith(dateStr.substring(0, 7)) && a.status === 'Izin').length}
              </p>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Izin</p>
            </div>
            <div className="text-center">
              <p className="text-rose-400 font-black text-3xl tabular-nums">
                {attendances.filter(a => a.date.startsWith(dateStr.substring(0, 7)) && a.status === 'Alpha').length}
              </p>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Alpha</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </Card>
    </div>
  );
};
