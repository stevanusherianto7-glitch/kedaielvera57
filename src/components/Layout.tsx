import * as React from "react";
import { Home, Package, UtensilsCrossed, Users, Bell, Download, Sun, Moon, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { usePWAInstall } from "@/hooks/usePWAInstall";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isSyncing?: boolean;
}

export function Layout({ children, activeTab, onTabChange, theme, toggleTheme, isSyncing }: LayoutProps) {
  const { canInstall, installApp } = usePWAInstall();
  
  const menuGroups = [
    {
      title: "OPERASIONAL",
      items: [
        { id: "home", label: "Home", icon: Home },
      ]
    },
    {
      title: "GUDANG & DAPUR",
      items: [
        { id: "bahan", label: "Bahan Baku", icon: Package },
        { id: "resep", label: "HPP", icon: UtensilsCrossed },
      ]
    },
    {
      title: "ADMINISTRASI",
      items: [
        { id: "karyawan", label: "SDM", icon: Users },
        { id: "penyimpanan", label: "Database", icon: Database },
      ]
    }
  ];

  const allTabs = menuGroups.flatMap(group => group.items);

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans transition-colors duration-500">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-card/50 backdrop-blur-2xl border-r border-border shrink-0 z-20">
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20">
              <Logo size={40} className="brightness-0 invert" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black leading-none tracking-tight text-slate-900 dark:text-white italic">
                POS<span className="text-emerald-500 not-italic">GO</span>
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                {isSyncing ? (
                  <>
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Sinkronisasi...</span>
                  </>
                ) : (
                  <>
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cloud Terhubung</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-emerald-500 transition-colors"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 px-6 space-y-8 mt-4 overflow-y-auto no-scrollbar pb-10">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-3">
              <h2 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 opacity-50">
                {group.title}
              </h2>
              <div className="space-y-1.5">
                {group.items.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange(tab.id)}
                      className={cn(
                        "flex items-center gap-4 w-full px-5 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 relative group",
                        isActive 
                          ? "bg-slate-900 text-white shadow-2xl shadow-slate-900/20" 
                          : "text-slate-500 hover:bg-emerald-50/50 hover:text-emerald-600"
                      )}
                    >
                      <Icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                      {tab.label}
                      {isActive && (
                        <div className="absolute right-3 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-8 space-y-4 border-t border-slate-100/50 bg-white/30">
          {canInstall && (
            <button 
              onClick={installApp}
              className="flex items-center justify-center gap-3 w-full px-4 py-4 bg-emerald-500 text-white rounded-2xl text-xs font-black hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Download className="w-4 h-4" />
              INSTALL PWA
            </button>
          )}

          <div className="flex items-center gap-4 p-4 bg-white/50 rounded-2xl border border-white/50">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-inner">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 truncate">Admin POSGO</p>
              <p className="text-[10px] font-bold text-emerald-500 truncate uppercase tracking-widest">Master Mode</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-0 relative z-10">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 lg:py-12">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-6 left-6 right-6 h-20 glass-nav rounded-[2.5rem] p-2 flex items-center justify-around z-40 transition-all duration-300">
          {allTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "relative flex items-center justify-center w-full h-full rounded-[2rem] transition-all duration-300",
                    isActive ? "text-emerald-500" : "text-slate-400 dark:text-slate-500"
                  )}
                >
                  <Icon className={cn(
                    "w-6 h-6 transition-all duration-300 transform", 
                    isActive ? "stroke-[2.5px] -translate-y-2.5 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "stroke-[2px]"
                  )} />
                  <span className={cn(
                    "absolute bottom-2 text-[9px] font-heading font-black uppercase tracking-widest transition-all duration-300",
                    isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  )}>
                    {tab.label}
                  </span>
                </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
