import * as React from "react";
import { useRef } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Trash2, 
  Edit2,
  ChevronRight,
  ChevronLeft,
  FileDown,
  Save,
  Package,
  UtensilsCrossed,
  Receipt,
  Download,
  CalendarDays,
  Layers,
  Users,
  CheckCircle2,
  Printer,
  Zap,
  Wallet,
  History,
  Calculator,
  ClipboardCheck,
  Clock
} from "lucide-react";
import { Employee, ShiftType, EditModalState, Attendance } from "../types";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
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
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { JOBDESK_MARKDOWN } from "../constants";
import { generateMonthDates, generateShiftsFromPattern, AVATAR_COLORS, getEmployeeInitials } from "../schedulerConstants";
import SchedulerHeader from "./scheduler/SchedulerHeader";
import ScheduleGrid from "./scheduler/ScheduleGrid";
import PatternManager from "./scheduler/PatternManager";
import * as pdfService from "../services/pdfService";
import { AttendanceGrid } from "./sdm/AttendanceGrid";
import { ShiftCheatSheet } from "./sdm/ShiftCheatSheet";

interface JobdeskManagerProps {
  employees: Employee[];
  karyawanTab: 'data' | 'jobdesk' | 'slip' | 'jadwal' | 'absensi';
  setKaryawanTab: (val: 'data' | 'jobdesk' | 'slip' | 'jadwal' | 'absensi') => void;
  isAddingEmployee: boolean;
  setIsAddingEmployee: (val: boolean) => void;
  newEmployee: Partial<Employee>;
  setNewEmployee: (val: Partial<Employee>) => void;
  handleSaveEmployee: () => void;
  deleteEmployee: (id: string) => void;
  selectedTasks: string[];
  toggleTask: (task: string) => void;
  reportTitle: string;
  setReportTitle: (val: string) => void;
  handleExportJobdeskPDF: () => void;
  generateFilteredMarkdown: () => string;
  selectedEmployeeForSlip: Employee | null;
  setSelectedEmployeeForSlip: (val: Employee | null) => void;
  // Shift related props
  shifts: Record<string, Record<string, ShiftType>>;
  setShifts: React.Dispatch<React.SetStateAction<Record<string, Record<string, ShiftType>>>>;
  weeklyPattern: Record<string, ShiftType[]>;
  setWeeklyPattern: React.Dispatch<React.SetStateAction<Record<string, ShiftType[]>>>;
  attendances: Attendance[];
  toggleAttendance: (employeeId: string, date: string, status: Attendance['status']) => void;
}

export const JobdeskManager: React.FC<JobdeskManagerProps> = ({
  employees,
  karyawanTab,
  setKaryawanTab,
  isAddingEmployee,
  setIsAddingEmployee,
  newEmployee,
  setNewEmployee,
  handleSaveEmployee,
  deleteEmployee,
  selectedTasks,
  toggleTask,
  reportTitle,
  setReportTitle,
  handleExportJobdeskPDF,
  generateFilteredMarkdown,
  selectedEmployeeForSlip,
  setSelectedEmployeeForSlip,
  shifts,
  setShifts,
  weeklyPattern,
  setWeeklyPattern,
  attendances,
  toggleAttendance
}) => {
  const [schedulerView, setSchedulerView] = React.useState<'grid' | 'pattern'>('grid');
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [isMenuOpen, setIsMenuOpen] = React.useState(true);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = React.useState(false);
  
  const gridRef = useRef<HTMLDivElement>(null);
  const patternRef = useRef<HTMLDivElement>(null);

  const monthDates = React.useMemo(() => 
    generateMonthDates(currentDate.getFullYear(), currentDate.getMonth()), 
    [currentDate]
  );

  const handleCycleShift = (employeeId: string, dateStr: string, currentType: ShiftType) => {
    const SHIFT_ORDER: ShiftType[] = [ShiftType.PAGI, ShiftType.MIDDLE, ShiftType.LIBUR];
    const currentIndex = SHIFT_ORDER.indexOf(currentType);
    const nextType = SHIFT_ORDER[(currentIndex + 1) % SHIFT_ORDER.length];
    
    setShifts(prev => ({
      ...prev,
      [employeeId]: {
        ...(prev[employeeId] || {}),
        [dateStr]: nextType
      }
    }));
  };

  const laborProgressBarRef = React.useRef<HTMLDivElement>(null);

  const totalMonthlyPayroll = React.useMemo(() => 
    employees.reduce((sum, emp) => sum + (emp.salary || 0), 0),
    [employees]
  );
  
  const laborCostPercentage = 15.5; // Placeholder target

  React.useEffect(() => {
    if (laborProgressBarRef.current) {
      laborProgressBarRef.current.style.width = `${Math.min(laborCostPercentage, 100)}%`;
    }
  }, [laborCostPercentage]);

  const handleApplyPattern = (patternToApply: Record<string, ShiftType[]>) => {
    const newShiftsForMonth = generateShiftsFromPattern(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        employees,
        patternToApply
    );

    setShifts(prevShifts => {
        const updatedShifts = { ...prevShifts };
        Object.keys(newShiftsForMonth).forEach(empId => {
            updatedShifts[empId] = {
                ...(updatedShifts[empId] || {}),
                ...newShiftsForMonth[empId]
            };
        });
        return updatedShifts;
    });
  };

  const navigateTo = (tab: 'data' | 'jobdesk' | 'slip' | 'jadwal' | 'absensi') => {
    setKaryawanTab(tab);
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const backToMenu = () => {
    setIsMenuOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isMenuOpen) {
    return (
      <div className="space-y-12 py-12 px-8 -mx-8 -mt-10 min-h-screen bg-slate-100/50 animate-in fade-in duration-700">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-heading font-black text-slate-900 tracking-tight uppercase">SDM Dashboard</h2>
          <p className="text-slate-500 font-heading font-black text-[10px] uppercase tracking-[0.2em] opacity-60">penjualan, resep dan stok melalui SDM</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div onClick={() => navigateTo('data')} className="sdm-dashboard-card group">
            <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-blue-500 transition-colors">
              <Users className="w-8 h-8 text-blue-500 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-heading font-black text-slate-900 mb-2">Data Karyawan</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Profil lengkap, jabatan, dan manajemen tim operasional.</p>
            <ChevronRight className="absolute bottom-8 right-8 w-6 h-6 text-slate-200 group-hover:text-sky-500 transform group-hover:translate-x-2 transition-all" />
          </div>

          <div onClick={() => navigateTo('jobdesk')} className="sdm-dashboard-card group">
            <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-amber-500 transition-colors">
              <ClipboardCheck className="w-8 h-8 text-amber-500 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-heading font-black text-slate-900 mb-2">Jobdesk (SPO)</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Standar Prosedur Operasional dan tanggung jawab tim.</p>
            <ChevronRight className="absolute bottom-8 right-8 w-6 h-6 text-slate-200 group-hover:text-amber-500 transform group-hover:translate-x-2 transition-all" />
          </div>

          <div onClick={() => navigateTo('slip')} className="sdm-dashboard-card group">
            <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 transition-colors">
              <Receipt className="w-8 h-8 text-emerald-500 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-heading font-black text-slate-900 mb-2">Slip Gaji</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Penghitungan gaji, bonus, dan pencetakan slip resmi.</p>
            <ChevronRight className="absolute bottom-8 right-8 w-6 h-6 text-slate-200 group-hover:text-emerald-500 transform group-hover:translate-x-2 transition-all" />
          </div>

          <div onClick={() => navigateTo('jadwal')} className="sdm-dashboard-card group">
            <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-indigo-500 transition-colors">
              <CalendarDays className="w-8 h-8 text-indigo-500 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-heading font-black text-slate-900 mb-2">Jadwal Shift</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Penjadwalan 3D visual dengan sistem cycle P-M-O.</p>
            <ChevronRight className="absolute bottom-8 right-8 w-6 h-6 text-slate-200 group-hover:text-indigo-500 transform group-hover:translate-x-2 transition-all" />
          </div>

          <div onClick={() => navigateTo('absensi')} className="sdm-dashboard-card group">
            <div className="w-16 h-16 bg-rose-50 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-rose-500 transition-colors">
              <CheckCircle2 className="w-8 h-8 text-rose-500 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-heading font-black text-slate-900 mb-2">Absensi Harian</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Monitoring kehadiran tim secara real-time dan terintegrasi.</p>
            <ChevronRight className="absolute bottom-8 right-8 w-6 h-6 text-slate-200 group-hover:text-rose-500 transform group-hover:translate-x-2 transition-all" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <Dialog open={isAddingEmployee} onOpenChange={setIsAddingEmployee}>
            <DialogTrigger render={<button type="button" className="sdm-dashboard-card group border-dashed border-2 border-slate-200 bg-slate-50/30 cursor-pointer text-left w-full" />}>
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mb-6 border border-slate-100 group-hover:bg-slate-900 transition-colors shadow-sm">
                  <Plus className="w-8 h-8 text-slate-900 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Tambah Karyawan</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Rekrutmen dan penambahan anggota tim baru.</p>
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-3rem)] sm:max-w-md mx-auto rounded-[2rem] border-none shadow-2xl">
              <DialogHeader className="px-4 pt-4">
                <DialogTitle className="text-xl font-black text-slate-900">REKRUTMEN BARU</DialogTitle>
                <DialogDescription className="text-slate-400 font-medium font-heading">Lengkapi data primer anggota tim operasional.</DialogDescription>
              </DialogHeader>
              <div className="p-4 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Nama Lengkap Karyawan</label>
                  <Input 
                    placeholder="CONTOH: BUDI SANTOSO" 
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value.toUpperCase()})}
                    className="h-14 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-bold text-lg placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 transition-all uppercase shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Posisi / Jabatan</label>
                  <Input 
                    placeholder="CONTOH: COOK / SERVER" 
                    value={newEmployee.role}
                    onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value.toUpperCase()})}
                    className="h-14 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-bold text-lg placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 transition-all uppercase shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Gaji Pokok (Rp)</label>
                  <Input 
                    type="number"
                    value={newEmployee.salary || ""}
                    onChange={(e) => setNewEmployee({...newEmployee, salary: Number(e.target.value)})}
                    className="h-14 rounded-2xl border-2 border-slate-200 bg-white text-indigo-600 font-bold text-2xl placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                  />
                </div>
              </div>
              <DialogFooter className="p-4 border-t border-slate-50 gap-3 grid grid-cols-2">
                <Button onClick={handleSaveEmployee} className="w-full h-14 bg-slate-900 hover:bg-black rounded-full font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-500/20 active:scale-95 transition-all text-white">
                  SIMPAN DATA
                </Button>
                <button onClick={() => setIsAddingEmployee(false)} className="w-full h-14 rounded-full font-black uppercase text-xs tracking-widest bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">
                  BATAL
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pb-32 animate-in slide-in-from-right duration-500">
      {/* Sub-Page Header */}
      <div className="flex items-center gap-6 mb-10">
        <button 
          onClick={backToMenu}
          title="Kembali ke Dashboard"
          className="w-12 h-12 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-900 hover:shadow-md transition-all active:scale-90"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            {karyawanTab === 'data' && "Data Karyawan"}
            {karyawanTab === 'jobdesk' && "Jobdesk (SPO)"}
            {karyawanTab === 'slip' && "Slip Gaji"}
            {karyawanTab === 'jadwal' && "Jadwal Shift"}
            {karyawanTab === 'absensi' && "Absensi Harian"}
          </h2>
        </div>
      </div>

      <div>
        {/* Content Area (Full Width) */}
        <div className="lg:col-span-12">
          {karyawanTab === 'data' && (
            <div className="space-y-8 animate-in fade-in duration-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {employees.map(emp => (
                  <Card 
                    key={emp.id} 
                    className="border-none shadow-sm bg-white overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 transition-all group rounded-3xl cursor-pointer"
                  >
                    <div className="p-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500 transition-colors shadow-inner">
                          <Users className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); /* edit functionality */ }} 
                            className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-md transition-all"
                            title="Edit Karyawan"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteEmployee(emp.id); }} 
                            className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-white hover:shadow-md transition-all"
                            title="Hapus Karyawan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900 truncate uppercase tracking-tight">{emp.name.toUpperCase()}</h3>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1.5">{emp.role.toUpperCase()}</p>
                      </div>
                      <div className="pt-5 border-t border-slate-50 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Base Salary</p>
                          <p className="text-sm font-black text-slate-900">{formatCurrency(emp.salary)}</p>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black px-3 py-1 rounded-lg">AKTIF</Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {karyawanTab === 'jobdesk' && (
            <div className="space-y-8 animate-in fade-in duration-700">
              {/* Utility Header for Jobdesk */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 w-full space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Judul Laporan SPO</label>
                  <Input 
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="h-14 rounded-2xl border-slate-100 font-bold bg-slate-50/50 focus:bg-white text-slate-900"
                    placeholder="Masukkan Judul Laporan..."
                  />
                </div>
                <div className="flex gap-4 w-full md:w-auto self-end">
                   <Button 
                    onClick={handleExportJobdeskPDF}
                    className="h-14 px-10 bg-slate-900 hover:bg-black rounded-2xl font-black tracking-widest shadow-xl active:scale-95 transition-all min-w-[200px]"
                  >
                    <FileDown className="w-6 h-6 mr-3" />
                    EXPORT PDF
                  </Button>
                </div>
              </div>

              {/* Full Width Markdown Content */}
              <Card className="border-none shadow-sm bg-white rounded-[3rem] overflow-hidden border border-slate-50">
                <div className="p-12 prose prose-sm sm:prose-base prose-slate max-w-none 
                  prose-headings:text-slate-900 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
                  prose-p:text-slate-500 prose-p:font-medium prose-p:italic
                  prose-li:text-slate-600 prose-li:font-bold prose-li:uppercase prose-li:text-[11px] prose-li:tracking-wide
                  prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl no-scrollbar bg-white">
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {generateFilteredMarkdown()}
                  </Markdown>
                </div>
              </Card>
            </div>
          )}

          {karyawanTab === 'slip' && (
            <div className="space-y-10">
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] shadow-2xl overflow-hidden relative">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-white italic tracking-tight">PILIH KARYAWAN</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">NAVIGASI SLIP GAJI CEPAT</p>
                  </div>
                  
                  <div className="flex items-center gap-6 overflow-x-auto pb-4 mini-scrollbar-x snap-x no-scrollbar w-full md:w-auto px-4">
                    {employees.map((emp, idx) => {
                      const isSelected = selectedEmployeeForSlip?.id === emp.id;
                      const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                      
                      return (
                        <div 
                          key={emp.id}
                          onClick={() => setSelectedEmployeeForSlip(emp)}
                          className="flex flex-col items-center gap-3 cursor-pointer group snap-start shrink-0"
                        >
                          <div className={cn(
                            "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 relative",
                            isSelected ? "ring-4 ring-indigo-500 scale-110 shadow-lg shadow-indigo-500/20" : "opacity-40 hover:opacity-100 hover:scale-105"
                          )}>
                             <div className={cn(
                               "w-full h-full rounded-full flex items-center justify-center text-white font-black text-lg shadow-inner",
                               avatarColor
                             )}>
                               {getEmployeeInitials(emp.name)}
                             </div>
                             {isSelected && (
                               <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-500 rounded-full border-2 border-slate-900 flex items-center justify-center animate-in zoom-in">
                                 <CheckCircle2 className="w-3 h-3 text-white" />
                               </div>
                             )}
                          </div>
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-widest transition-colors",
                            isSelected ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                          )}>
                            {emp.name.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
              </div>

              <div className="space-y-8">
              {selectedEmployeeForSlip ? (
                <Card className="border-none shadow-2xl bg-white rounded-[3rem] overflow-hidden max-w-2xl mx-auto border border-slate-50 animate-in zoom-in-95 duration-500">
                  <div className="p-14 space-y-10">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-1 bg-indigo-500 rounded-full mx-auto"></div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tighter">SLIP GAJI KARYAWAN</h2>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">PERIODE: {new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase()}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-12 py-10 border-y border-slate-50">
                      <div className="space-y-6">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Penerima</p>
                          <p className="text-lg font-black text-slate-900 tracking-tight uppercase">{selectedEmployeeForSlip.name.toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Jabatan</p>
                          <p className="text-xs font-black text-slate-500 tracking-widest uppercase">{selectedEmployeeForSlip.role.toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Ringkasan Kehadiran</p>
                          <div className="flex gap-4 mt-2">
                            <div className="text-center">
                              <p className="text-xs font-black text-emerald-600">
                                {attendances.filter(a => a.employeeId === selectedEmployeeForSlip.id && a.status === 'Hadir' && a.date.startsWith(new Date().toISOString().substring(0, 7))).length}
                              </p>
                              <p className="text-[7px] font-bold text-slate-400 uppercase">Hadir</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-black text-blue-500">
                                {attendances.filter(a => a.employeeId === selectedEmployeeForSlip.id && a.status === 'Izin' && a.date.startsWith(new Date().toISOString().substring(0, 7))).length}
                              </p>
                              <p className="text-[7px] font-bold text-slate-400 uppercase">Izin</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-black text-rose-500">
                                {attendances.filter(a => a.employeeId === selectedEmployeeForSlip.id && a.status === 'Alpha' && a.date.startsWith(new Date().toISOString().substring(0, 7))).length}
                              </p>
                              <p className="text-[7px] font-bold text-slate-400 uppercase">Alpha</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6 text-right">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Nomor ID</p>
                          <p className="text-sm font-black text-slate-900">#ELV-{selectedEmployeeForSlip.id.split('-')[0].toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Status Pekerjaan</p>
                          <Badge className="bg-indigo-600 text-white border-none font-black tracking-widest px-4 py-1.5 text-[9px]">FULL TIME</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5 bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Gaji Pokok Dasar</span>
                        <span className="font-black text-slate-900">{formatCurrency(selectedEmployeeForSlip.salary)}</span>
                      </div>
                      <div className="flex justify-between items-center text-rose-600">
                        <span className="font-bold uppercase text-[10px] tracking-widest">Potongan Alpha</span>
                        {(() => {
                          const currentMonth = new Date().toISOString().substring(0, 7);
                          const alphaCount = attendances.filter(a => a.employeeId === selectedEmployeeForSlip.id && a.status === 'Alpha' && a.date.startsWith(currentMonth)).length;
                          const deductionRate = selectedEmployeeForSlip.salary / 26;
                          const totalDeduction = alphaCount * deductionRate;
                          return (
                            <div className="text-right">
                              <p className="font-black">-{formatCurrency(totalDeduction)}</p>
                              <p className="text-[8px] font-bold">({alphaCount} Hari Tanpa Keterangan)</p>
                            </div>
                          );
                        })()}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Bonus & Tunjangan</span>
                        <span className="font-black text-slate-900">{formatCurrency(0)}</span>
                      </div>
                      <div className="pt-6 border-t border-slate-200 flex justify-between items-end">
                        <div>
                          <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-1">Total Penerimaan</p>
                          <span className="text-sm font-black text-slate-400">NET TAKE HOME PAY</span>
                        </div>
                        <span className="text-3xl font-black text-indigo-600 tracking-tighter">
                          {(() => {
                            const currentMonth = new Date().toISOString().substring(0, 7);
                            const alphaCount = attendances.filter(a => a.employeeId === selectedEmployeeForSlip.id && a.status === 'Alpha' && a.date.startsWith(currentMonth)).length;
                            const deductionRate = selectedEmployeeForSlip.salary / 26;
                            const totalDeduction = alphaCount * deductionRate;
                            const netPay = Math.max(0, selectedEmployeeForSlip.salary - totalDeduction);
                            return formatCurrency(netPay);
                          })()}
                        </span>
                      </div>
                    </div>

                    <div className="pt-8 flex gap-4">
                      <Button 
                        onClick={() => pdfService.handleExportSlipPDF(selectedEmployeeForSlip, attendances)}
                        className="flex-1 h-16 rounded-2xl bg-slate-900 hover:bg-black font-black text-xs tracking-[0.2em] shadow-xl group">
                        <Printer className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                        PRINT SLIP
                      </Button>
                      <Button 
                        onClick={() => pdfService.handleExportSlipPDF(selectedEmployeeForSlip, attendances)}
                        className="flex-1 h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black text-xs tracking-[0.2em] shadow-xl group border-b-4 border-indigo-800 active:border-b-0 transition-all"
                      >
                        <FileDown className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                        DOWNLOAD
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="p-24 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-inner">
                    <Receipt className="w-12 h-12 text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs max-w-xs mx-auto leading-relaxed">Pilih Nama Karyawan di samping Untuk Mengakses Slip Gaji Resmi</p>
                </div>
              )}
            </div>
          </div>
        )}

        {karyawanTab === 'jadwal' && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
            <SchedulerHeader 
              currentDate={currentDate}
              onPreviousMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              onNextMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              onExportPDF={() => pdfService.handleExportShiftPDF(employees, shifts, monthDates, currentDate)}
              onExportWeeklyPDF={() => pdfService.handleExportPatternPDF(employees, weeklyPattern, currentDate)}
              view={schedulerView}
              onViewChange={setSchedulerView}
            />

            {schedulerView === 'grid' ? (
              <div ref={gridRef}>
                <ScheduleGrid 
                  employees={employees}
                  shifts={shifts}
                  dates={monthDates}
                  onShiftClick={handleCycleShift}
                />
              </div>
            ) : (
              <div ref={patternRef}>
                <PatternManager 
                  employees={employees}
                  initialPattern={weeklyPattern}
                  onSavePattern={setWeeklyPattern}
                  onApplyPattern={handleApplyPattern}
                  onBack={() => setSchedulerView('grid')}
                  currentDate={currentDate}
                />
              </div>
            )}
          </div>
        )}

        {karyawanTab === 'absensi' && (
          <AttendanceGrid 
            employees={employees}
            attendances={attendances}
            onToggleAttendance={toggleAttendance}
          />
        )}

        <ShiftCheatSheet 
          isOpen={isCheatSheetOpen} 
          onClose={() => setIsCheatSheetOpen(false)} 
        />
        </div>
      </div>
    </div>
  );
};

export default JobdeskManager;
