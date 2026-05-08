import * as React from "react";
import { Layout } from "./components/Layout";
import { EngineDashboard } from "./components/EngineDashboard";
import { BahanManager } from "./components/BahanManager";
import { RecipeManager } from "./components/RecipeManager";
import { JobdeskManager } from "./components/JobdeskManager";
import { StorageManager } from "./components/StorageManager";
import { PrinterSettingsDialog } from "./components/PrinterSettingsDialog";
import { useAppState } from "./hooks/useAppState";
import { useThermalPrinter } from "./hooks/useThermalPrinter";
import { Ingredient, Recipe, Employee, Transaction, Expense } from "./types";
import { JOBDESK_MARKDOWN } from "./constants";
import { formatCurrency, cn } from "@/lib/utils";
import * as pdfService from "./services/pdfService";
import { printReceipt } from "./services/thermalPrinterService";
import { TooltipProvider } from "@/components/ui/tooltip";

// ─── Error Boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) { console.error("ErrorBoundary:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-slate-900">Ups! Terjadi kesalahan.</h1>
            <p className="text-slate-500">Silakan muat ulang halaman atau hubungi pengembang.</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold">Muat Ulang</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── App Root ──────────────────────────────────────────────────────────────────
// v1.1.0 - Bluetooth Thermal Printer Integration
export default function App() {
  React.useEffect(() => {
    window.onerror = (msg, url, line, col, error) => {
      console.error("Global Error:", { msg, url, line, col, error });
      return false;
    };
    window.onunhandledrejection = (event) => {
      console.error("Unhandled Rejection:", event.reason);
    };
  }, []);

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </ErrorBoundary>
  );
}

// ─── AppContent ────────────────────────────────────────────────────────────────
function AppContent() {
  const [activeTab, setActiveTab] = React.useState("home");
  const [transaksiTab, setTransaksiTab] = React.useState<'petty' | 'riwayat'>('petty');
  const [karyawanTab, setKaryawanTab] = React.useState<'data' | 'jobdesk' | 'slip' | 'jadwal' | 'absensi'>('data');
  const [isPrinterSettingsOpen, setIsPrinterSettingsOpen] = React.useState(false);

  // ── App State (Supabase backed) ──
  const state = useAppState();
  const {
    ingredients, setIngredients,
    recipes, setRecipes,
    employees,
    transactions, setTransactions,
    expenses, setExpenses,
    pettyCash,
    isLoaded,
    deleteIngredient,
    deleteEmployee,
    handleBackup,
    handleRestore,
    handleAddIngredient,
    handleAddExpense,
    handleSaveEmployee,
    shifts, setShifts,
    weeklyPattern, setWeeklyPattern,
    attendances, toggleAttendance,
  } = state;

  // ── Thermal Printer Hook ──
  const printer = useThermalPrinter();

  // ── Local UI State ──
  const [isAddingEmployee, setIsAddingEmployee] = React.useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = React.useState<string | null>(null);
  const [newEmployee, setNewEmployee] = React.useState<Partial<Employee>>({ name: "", role: "", salary: 0 });
  const [selectedTasks, setSelectedTasks] = React.useState<string[]>([]);
  const [reportTitle, setReportTitle] = React.useState("STANDAR OPERASIONAL PROSEDUR (SOP)");
  const [selectedEmployeeForSlip, setSelectedEmployeeForSlip] = React.useState<Employee | null>(null);

  // ── Loading Screen ──
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  // ── Helpers ──
  const toggleTask = (task: string) => {
    setSelectedTasks(prev =>
      prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]
    );
  };

  const generateFilteredMarkdown = () => {
    if (selectedTasks.length === 0) return JOBDESK_MARKDOWN;
    let filtered = JOBDESK_MARKDOWN;
    const allTasks = JOBDESK_MARKDOWN.split('\n')
      .filter(line => line.includes('* [ ]'))
      .map(line => line.replace('* [ ]', '').trim());
    allTasks.forEach(task => {
      if (!selectedTasks.includes(task)) {
        filtered = filtered.replace(`* [ ] ${task}`, '');
      } else {
        filtered = filtered.replace(`* [ ] ${task}`, `* [x] ${task}`);
      }
    });
    return filtered.split('\n').filter(line => line.trim() !== '').join('\n');
  };

  // ── Test Print ──
  const handleTestPrint = async () => {
    const testReceipt = {
      orderId: 'TEST-0001',
      date: new Date().toISOString(),
      items: [
        { name: 'Nasi Goreng Special', quantity: 2, price: 25000 },
        { name: 'Es Teh Manis', quantity: 2, price: 8000 },
      ],
      totalPrice: 66000,
      paymentMethod: 'Tunai',
      cashReceived: 70000,
    };
    const result = await printReceipt(testReceipt, printer.config);
    if (!result.success) {
      alert(`Gagal test print: ${result.error}`);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      theme={state.theme}
      toggleTheme={state.toggleTheme}
      isSyncing={state.isSyncing}
    >
      <div className={cn(
        "p-4 lg:p-8 mx-auto transition-all duration-500",
        (activeTab === "karyawan" || activeTab === "penyimpanan") ? "max-w-none w-full" : "max-w-7xl"
      )}>

        {/* ── HOME: POS Dashboard ── */}
        {activeTab === "home" && (
          <EngineDashboard
            transactions={transactions}
            recipes={recipes}
            ingredients={ingredients}
            onTabChange={setActiveTab}
            onProcessTransaction={state.handleProcessTransaction}
            theme={state.theme}
            toggleTheme={state.toggleTheme}
            // Printer
            onPrintTransaction={printer.printTransaction}
            printerStatus={printer.status}
            onConnectPrinter={printer.connect}
            onDisconnectPrinter={printer.disconnect}
            autoPrint={printer.autoPrint}
            onToggleAutoPrint={printer.toggleAutoPrint}
            onOpenPrinterSettings={() => setIsPrinterSettingsOpen(true)}
          />
        )}

        {/* ── BAHAN ── */}
        {activeTab === "bahan" && (
          <BahanManager
            ingredients={ingredients}
            setIngredients={setIngredients}
            recipes={recipes}
            setRecipes={setRecipes}
            deleteIngredient={deleteIngredient}
            handleExportInventoryPDF={() => pdfService.handleExportInventoryPDF(ingredients, recipes)}
          />
        )}

        {/* ── RESEP ── */}
        {activeTab === "resep" && (
          <RecipeManager
            recipes={recipes}
            setRecipes={setRecipes}
            ingredients={ingredients}
            handleExportRecipePDF={(recipe) => pdfService.handleExportRecipePDF(recipe, ingredients)}
          />
        )}

        {/* ── KARYAWAN ── */}
        {activeTab === "karyawan" && (
          <JobdeskManager
            employees={employees}
            karyawanTab={karyawanTab}
            setKaryawanTab={setKaryawanTab}
            isAddingEmployee={isAddingEmployee}
            setIsAddingEmployee={setIsAddingEmployee}
            newEmployee={newEmployee}
            setNewEmployee={setNewEmployee}
            handleSaveEmployee={() => handleSaveEmployee(newEmployee, editingEmployeeId, setEditingEmployeeId, setIsAddingEmployee, setNewEmployee)}
            deleteEmployee={deleteEmployee}
            selectedTasks={selectedTasks}
            toggleTask={toggleTask}
            reportTitle={reportTitle}
            setReportTitle={setReportTitle}
            handleExportJobdeskPDF={() => pdfService.handleExportJobdeskPDF(selectedTasks, reportTitle)}
            generateFilteredMarkdown={generateFilteredMarkdown}
            selectedEmployeeForSlip={selectedEmployeeForSlip}
            setSelectedEmployeeForSlip={setSelectedEmployeeForSlip}
            shifts={shifts}
            setShifts={setShifts}
            weeklyPattern={weeklyPattern}
            setWeeklyPattern={setWeeklyPattern}
            attendances={attendances}
            toggleAttendance={toggleAttendance}
          />
        )}

        {/* ── PENYIMPANAN ── */}
        {activeTab === "penyimpanan" && (
          <StorageManager
            isSyncing={state.isSyncing}
            onSyncAll={state.syncAll}
          />
        )}
      </div>

      {/* ── Printer Settings Dialog (global, available from any tab) ── */}
      <PrinterSettingsDialog
        isOpen={isPrinterSettingsOpen}
        onClose={() => setIsPrinterSettingsOpen(false)}
        status={printer.status}
        config={printer.config}
        autoPrint={printer.autoPrint}
        isSupported={printer.isSupported}
        onConnect={printer.connect}
        onDisconnect={printer.disconnect}
        onUpdateConfig={printer.updateConfig}
        onToggleAutoPrint={printer.toggleAutoPrint}
        onTestPrint={handleTestPrint}
      />
    </Layout>
  );
}
