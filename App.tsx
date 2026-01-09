
import React, { useState, useEffect, useCallback } from 'react';
import { Asset, Ticket, Technician, InventoryItem, Tool, AssetStatus, TicketStatus, TicketSeverity } from './types';
import { TECHS, DEFAULT_GAS, DEFAULT_TOOLS, WEB_APP_URL } from './constants';
import DashboardView from './components/DashboardView';
import OpsView from './components/OpsView';
import TechView from './components/TechView';

type AppScreen = 'landing' | 'menu' | 'app';
type AppView = 'dashboard' | 'ops' | 'tech';

const App: React.FC = () => {
    // UI State
    const [screen, setScreen] = useState<AppScreen>('landing');
    const [view, setView] = useState<AppView>('dashboard');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    // Data State
    const [assets, setAssets] = useState<Asset[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>(DEFAULT_GAS);
    const [tools, setTools] = useState<Tool[]>(DEFAULT_TOOLS);
    const [technicians, setTechnicians] = useState<Technician[]>(
        TECHS.map(name => ({ name, merit: 0, demerit: 0, isPresent: true }))
    );

    const showToast = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    }, []);

    const refreshData = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const response = await fetch(`${WEB_APP_URL}?action=get_assets`);
            const data = await response.json();
            setAssets(data || []);
            
            const statsResp = await fetch(`${WEB_APP_URL}?action=get_stats&category=All`);
            const stats = await statsResp.json();
            setTickets(stats.complaints || []);
            showToast("Synced with Cloud ✅");
        } catch (error) {
            console.error(error);
            showToast("Offline Mode Enabled");
            // Mocking some assets if offline for demo
            if(assets.length === 0) {
              setAssets(Array.from({length: 20}, (_, i) => ({
                id: i + 1,
                tag: `AC-${100 + i}`,
                brand: ['Daikin', 'Samsung', 'LG', 'Mitsubishi'][i % 4],
                location: `Floor ${Math.ceil((i+1)/5)}`,
                status: i % 7 === 0 ? AssetStatus.MAINTENANCE : AssetStatus.ACTIVE
              })));
            }
        } finally {
            setIsRefreshing(false);
        }
    }, [assets.length, showToast]);

    useEffect(() => {
        if (screen === 'app') refreshData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screen]);

    const handleNewTicket = (ticket: Omit<Ticket, 'id' | 'timestamp'>) => {
        const newTicket: Ticket = {
            ...ticket,
            id: Date.now(),
            timestamp: new Date().toISOString(),
        };
        setTickets([newTicket, ...tickets]);
        showToast("Ticket Raised 🚀");
        // In real app, we'd POST to GAS here
    };

    const handleResolveTicket = (id: number) => {
        setTickets(tickets.map(t => t.id === id ? { ...t, status: TicketStatus.RESOLVED } : t));
        showToast("Issue Resolved ✅");
    };

    const toggleAttendance = (name: string) => {
        setTechnicians(technicians.map(t => t.name === name ? { ...t, isPresent: !t.isPresent } : t));
    };

    if (screen === 'landing') {
        return (
            <div className="h-screen bg-slate-900 relative overflow-hidden flex flex-col justify-center px-10 animate-fade-in">
                <div className="z-10">
                    <h1 className="text-7xl font-black text-white tracking-tighter leading-none mb-2">DISRUPT</h1>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em] mb-12">Facilities Portal v7.0 AI</p>
                    <button 
                        onClick={() => setScreen('menu')}
                        className="w-full bg-white hover:bg-slate-100 active:scale-95 transition-all p-6 rounded-[2.5rem] shadow-2xl flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg">
                                <i className="fas fa-fingerprint"></i>
                            </div>
                            <div className="text-left">
                                <h3 className="text-xl font-black text-slate-900">Enter Portal</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">Secure Access Enabled</p>
                            </div>
                        </div>
                        <i className="fas fa-arrow-right text-slate-900 group-hover:translate-x-2 transition-transform"></i>
                    </button>
                    <p className="text-center text-slate-600 text-[10px] mt-12 font-bold uppercase tracking-widest">Enterprise Facility Solutions</p>
                </div>
                {/* Decorative background elements */}
                <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-blue-600/20 rounded-full blur-3xl"></div>
            </div>
        );
    }

    if (screen === 'menu') {
        return (
            <div className="h-screen bg-slate-50 p-6 flex flex-col justify-center space-y-8 animate-fade-in">
                <div className="mb-4">
                    <h2 className="text-5xl font-black text-slate-900 leading-[0.9] mb-3">Command<br/>Center</h2>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Select Workspace Environment</p>
                </div>
                <div className="space-y-4">
                    {[
                        { id: 'dashboard', icon: 'fa-th-large', label: 'Overview', color: 'blue', desc: 'Real-time metrics & KPIs' },
                        { id: 'ops', icon: 'fa-network-wired', label: 'Operations', color: 'red', desc: 'Ticketing & Field Admin' },
                        { id: 'tech', icon: 'fa-tools', label: 'Technical', color: 'emerald', desc: 'Workflows & Inventory' },
                    ].map(opt => (
                        <button 
                            key={opt.id}
                            onClick={() => { setView(opt.id as AppView); setScreen('app'); }}
                            className="w-full bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 flex items-center gap-5 text-left group active:scale-[0.98] transition-all border border-slate-100"
                        >
                            <div className={`w-14 h-14 bg-${opt.color}-50 text-${opt.color}-600 rounded-3xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                                <i className={`fas ${opt.icon}`}></i>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-slate-800">{opt.label}</h3>
                                <p className="text-xs text-slate-400 font-bold">{opt.desc}</p>
                            </div>
                            <i className="fas fa-chevron-right text-slate-200"></i>
                        </button>
                    ))}
                </div>
                <button onClick={() => setScreen('landing')} className="text-center font-bold text-slate-400 text-xs mt-4">
                    <i className="fas fa-arrow-left mr-2"></i> Log Out
                </button>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-slate-50 relative animate-fade-in">
            {/* App Header */}
            <div className="bg-white/80 backdrop-blur-xl px-6 py-5 flex justify-between items-center z-30 border-b border-slate-100 sticky top-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setScreen('menu')}
                        className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"
                    >
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                            {view === 'dashboard' ? 'Overview' : view === 'ops' ? 'Ops Center' : 'Technical'}
                        </h2>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] -mt-1">DISRUPT V7 AI</p>
                    </div>
                </div>
                <button 
                    onClick={refreshData}
                    className={`w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 active:rotate-180 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                >
                    <i className="fas fa-sync-alt"></i>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
                {view === 'dashboard' && (
                    <DashboardView 
                        assets={assets} 
                        tickets={tickets} 
                        inventory={inventory} 
                        technicians={technicians}
                        onAssetCardClick={(s) => showToast(`Filtering: ${s}`)}
                    />
                )}
                {view === 'ops' && (
                    <OpsView 
                        assets={assets} 
                        tickets={tickets} 
                        technicians={technicians}
                        onNewTicket={handleNewTicket}
                        onResolveTicket={handleResolveTicket}
                    />
                )}
                {view === 'tech' && (
                    <TechView 
                        technicians={technicians} 
                        tools={tools} 
                        assets={assets}
                        onToggleAttendance={toggleAttendance}
                    />
                )}
            </div>

            {/* Navigation Bar */}
            <div className="bg-white/90 backdrop-blur-xl px-6 pb-8 pt-4 border-t border-slate-100 z-40 fixed bottom-0 left-0 right-0 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-end">
                    {[
                        { id: 'dashboard', icon: 'fa-th-large', label: 'Overview' },
                        { id: 'ops', icon: 'fa-network-wired', label: 'Operations' },
                        { id: 'tech', icon: 'fa-tools', label: 'Technical' },
                    ].map(nav => (
                        <button 
                            key={nav.id}
                            onClick={() => setView(nav.id as AppView)}
                            className={`flex-1 flex flex-col items-center transition-all ${view === nav.id ? 'text-slate-900 scale-110' : 'text-slate-300'}`}
                        >
                            <i className={`fas ${nav.icon} text-xl mb-1`}></i>
                            <span className="text-[9px] font-black uppercase tracking-widest">{nav.label}</span>
                            <div className={`mt-2 h-1 w-1 rounded-full bg-slate-900 transition-all ${view === nav.id ? 'w-4 opacity-100' : 'w-0 opacity-0'}`}></div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl font-black text-[10px] uppercase tracking-widest animate-fade-in z-50">
                    {toast}
                </div>
            )}
        </div>
    );
};

export default App;
