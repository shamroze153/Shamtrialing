
import React, { useState, useEffect, useCallback } from 'react';
import { Asset, Ticket, Technician, InventoryItem, AssetStatus, TicketStatus, TicketSeverity } from './types';
import { TECHS, DEFAULT_GAS, WEB_APP_URL, ZONE_MAP } from './constants';
import DashboardView from './components/DashboardView';
import OpsView from './components/OpsView';
import TechView from './components/TechView';

type AppScreen = 'landing' | 'menu' | 'app';
type AppView = 'dashboard' | 'ops' | 'tech';

const App: React.FC = () => {
    const [screen, setScreen] = useState<AppScreen>('landing');
    const [view, setView] = useState<AppView>('dashboard');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [prefilledAssetId, setPrefilledAssetId] = useState<string | undefined>();
    const [aiInsight, setAiInsight] = useState<string>("System Ready: Infrastructure synchronized with AC_HVAC_Daily_Checklist master tab.");

    const [assets, setAssets] = useState<Asset[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [checkedAssetIds, setCheckedAssetIds] = useState<Set<string>>(new Set());
    const [inventory, setInventory] = useState<InventoryItem[]>(DEFAULT_GAS);
    const [technicians, setTechnicians] = useState<Technician[]>(
        TECHS.map((name) => ({ 
            name, merit: 0, demerit: 0, isPresent: true, zone: ZONE_MAP[name], bonusPoints: 0
        }))
    );

    const showToast = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    }, []);

    const refreshData = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const assetResponse = await fetch(`${WEB_APP_URL}?action=get_assets`, { redirect: 'follow' });
            const rawAssets = await assetResponse.json();
            
            const mappedAssets = (rawAssets || []).map((a: any, index: number) => {
                const zoneIdx = Math.floor(index / (rawAssets.length / 4));
                return {
                    id: a.id || a.ID || index + 1,
                    tag: a.assestTag || a.assetTag || a.tag || `AC-${index}`,
                    brand: a.brandName || a.brand || 'Elite FM',
                    capacity: a.capacity || a['Capacity( in Ton )'] || '1.5 Ton',
                    room: a.currentRoom || a['Current Room #'] || 'N/A',
                    location: a.currentLocation || a['Current Location'] || 'Campus',
                    campus: a.campus || 'Main',
                    floor: a.floor || 'G',
                    status: a.status || AssetStatus.ACTIVE,
                    zone: (['A', 'B', 'C', 'D'][zoneIdx > 3 ? 3 : zoneIdx] as any)
                };
            });
            setAssets(mappedAssets);
            
            const statsResp = await fetch(`${WEB_APP_URL}?action=get_stats&category=All&date=${new Date().toISOString()}`, { redirect: 'follow' });
            const stats = await statsResp.json();
            const allTickets: Ticket[] = stats.complaints || [];
            setTickets(allTickets);
            
            if (stats.checklists || stats.history) {
                const history = stats.checklists || stats.history;
                const restoredChecks = new Set<string>();
                history.forEach((entry: any) => {
                    const assetTag = entry.assetTag || entry.tag || entry.asset_tag;
                    const taskType = entry.task || entry.task_type || entry.type || 'Daily Routine';
                    const targetAsset = mappedAssets.find((a: any) => a.tag === assetTag);
                    if (targetAsset) {
                        restoredChecks.add(`${targetAsset.id}-${taskType}`);
                    }
                });
                setCheckedAssetIds(restoredChecks);
            }
            
            setAiInsight(`Cloud Pulse Active. All logs routing to Tab 01.`);
            showToast("Sync Successful ✅");
        } catch (error) {
            console.error("Refresh Error:", error);
            showToast("Cloud Offline ⚠");
        } finally { setIsRefreshing(false); }
    }, [technicians, showToast]);

    useEffect(() => { if (screen === 'app') refreshData(); }, [screen]);

    const handleMarkChecklistOk = async (assetId: number, technicianName: string, category: string = 'Daily Routine') => {
        const asset = assets.find(a => a.id === assetId);
        if (!asset) return;
        
        try {
            const now = new Date();
            const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
            
            // UNIFIED ROUTING LOGIC
            const TARGET_TAB = 'AC_HVAC_Daily_Checklist';

            const fd = new FormData();
            fd.append('action', 'checklist');
            fd.append('category', TARGET_TAB); // Routing Key
            fd.append('sheetName', TARGET_TAB); // Routing Key 2
            
            fd.append('assetTag', asset.tag);
            fd.append('asset_tag', asset.tag);
            fd.append('technician', technicianName);
            fd.append('tech', technicianName);
            
            fd.append('task', category); // Preserves original type (Daily/Monthly/Quarterly)
            fd.append('type', category); 
            fd.append('task_type', category);
            
            fd.append('status', 'OK');
            fd.append('date', dateStr);
            fd.append('formatted_date', dateStr);
            fd.append('timestamp', now.toISOString());

            const response = await fetch(WEB_APP_URL, { method: 'POST', body: fd, redirect: 'follow' });
            const result = await response.json();
            
            if (result.result === 'success' || result.status === 'success') {
                setCheckedAssetIds(prev => {
                  const next = new Set(prev);
                  next.add(`${assetId}-${category}`);
                  return next;
                });
                showToast("Tab 01 Logged ✅");
            }
        } catch (e) {
            showToast("Local Override Active ⚠");
            setCheckedAssetIds(prev => {
                const next = new Set(prev);
                next.add(`${assetId}-${category}`);
                return next;
            });
        }
    };

    const handleNewTicket = async (ticket: Omit<Ticket, 'id' | 'timestamp'>) => {
        try {
            const fd = new FormData();
            fd.append('action', 'complain');
            fd.append('category', 'AC / HVAC');
            fd.append('location', ticket.location);
            fd.append('details', ticket.details);
            fd.append('assetTag', ticket.assetTag);
            fd.append('assignedTech', ticket.assignedTo);
            
            const resp = await fetch(WEB_APP_URL, { method: 'POST', body: fd, redirect: 'follow' });
            const res = await resp.json();
            if (res.result === 'success') {
                showToast("Incident Logged 🚀");
                refreshData();
            }
        } catch (e) {
            showToast("Network Error");
        }
    };

    const handleResolveTicket = async (id: number, res: { type: 'Minor' | 'Major', details: string, technicianName: string, gas?: string, amount?: number }) => {
        const ticket = tickets.find(t => t.id === id);
        if (!ticket) return;

        try {
            const fd = new FormData();
            fd.append('action', 'close_complaint');
            fd.append('rowIndex', String(ticket.rowIndex));
            fd.append('technician', res.technicianName);
            fd.append('details', res.details);
            
            await fetch(WEB_APP_URL, { method: 'POST', body: fd, redirect: 'follow' });
            
            if (res.gas && res.amount) {
                setInventory(prev => prev.map(item => item.name.includes(res.gas!) ? { ...item, kg: Math.max(0, item.kg - res.amount!) } : item));
            }
            showToast("Job Completed ✅");
            refreshData();
        } catch (e) {
            showToast("Resolution Failed");
        }
    };

    if (screen === 'landing') {
        return (
            <div className="h-screen bg-slate-950 flex flex-col justify-center items-center px-10 relative overflow-hidden cursor-pointer" onClick={() => setScreen('menu')}>
                <div className="z-10 text-center fade-in">
                    <div className="mb-4 flex items-center justify-center gap-2">
                        <div className="w-8 h-1 bg-indigo-500 rounded-full"></div>
                        <span className="text-indigo-400 font-bold text-[10px] uppercase tracking-[0.3em]">Portal 8.0 Elite</span>
                    </div>
                    <h1 className="text-6xl font-black text-white mb-4 tracking-tighter italic">FM CONTROL</h1>
                    <p className="text-slate-500 text-[10px] mb-12 font-bold uppercase tracking-widest">Enterprise Infrastructure v8.0.4</p>
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-3xl shadow-2xl transition-all active:scale-90 border border-indigo-400/20"><i className="fas fa-fingerprint"></i></div>
                        <span className="text-slate-400 text-[9px] font-black uppercase tracking-[0.5em] mt-4">Scan to Enter</span>
                    </div>
                </div>
            </div>
        );
    }

    if (screen === 'menu') {
        return (
            <div className="h-screen bg-slate-50 p-8 flex flex-col justify-center space-y-6 fade-in">
                <div className="mb-10 text-center">
                    <h2 className="text-4xl font-black text-slate-900 leading-tight italic uppercase tracking-tighter">Elite <span className="text-indigo-600">Control</span></h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Authorized Management Access</p>
                </div>
                <div className="grid gap-5">
                    {[
                        { id: 'dashboard', icon: 'fa-gauge-high', label: 'Command', desc: 'Real-time Telemetry', bg: 'bg-indigo-600' },
                        { id: 'ops', icon: 'fa-bolt-lightning', label: 'Incidents', desc: 'Incident Workflows', bg: 'bg-rose-600' },
                        { id: 'tech', icon: 'fa-network-wired', label: 'Field Force', desc: 'Specialist Management', bg: 'bg-emerald-600' },
                    ].map(v => (
                        <button key={v.id} onClick={() => { setView(v.id as AppView); setScreen('app'); }} className="w-full bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200/60 flex items-center gap-6 group active:scale-[0.98] transition-all hover:border-indigo-200">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl text-white ${v.bg} shadow-lg transition-transform group-hover:scale-110`}>
                                <i className={`fas ${v.icon}`}></i>
                            </div>
                            <div className="text-left flex-1">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">{v.label}</h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{v.desc}</p>
                            </div>
                            <i className="fas fa-chevron-right text-slate-200 group-hover:text-indigo-500 transition-all"></i>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-slate-50 relative fade-in overflow-hidden">
            <header className="bg-white border-b border-slate-100 px-8 py-6 flex justify-between items-center z-50 sticky top-0 shadow-sm">
                <button onClick={() => setScreen('menu')} className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white active:scale-90 transition-transform"><i className="fas fa-arrow-left"></i></button>
                <div className="text-center">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-tighter italic">{view} System</h2>
                    <div className="flex items-center gap-1.5 justify-center">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Active Link</p>
                    </div>
                </div>
                <button onClick={refreshData} className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 transition-all ${isRefreshing?'animate-spin text-indigo-600':''}`}><i className="fas fa-rotate"></i></button>
            </header>

            <div className="flex-1 overflow-hidden">
                {view === 'dashboard' && <DashboardView aiInsight={aiInsight} assets={assets} tickets={tickets} inventory={inventory} technicians={technicians} checkedAssetIds={checkedAssetIds} onUpdateGas={(n,k)=>setInventory(prev=>prev.map(i=>i.name===n?{...i,kg:k}:i))} onIssueDemerit={()=>{}} />}
                {view === 'ops' && <OpsView assets={assets} tickets={tickets} technicians={technicians} onNewTicket={handleNewTicket} onResolveTicket={handleResolveTicket} prefillAssetId={prefilledAssetId} />}
                {view === 'tech' && <TechView technicians={technicians} tickets={tickets} assets={assets} checkedAssetIds={checkedAssetIds} onToggleAttendance={(n)=>setTechnicians(prev=>prev.map(t=>t.name===n?{...t,isPresent:!t.isPresent}:t))} onTakeover={()=>{}} onMarkChecklistOk={handleMarkChecklistOk} onReportChecklistIssue={(id)=>{ setPrefilledAssetId(String(id)); setView('ops'); }} onResolveTicket={handleResolveTicket} />}
            </div>

            <nav className="bg-white border-t border-slate-100 px-8 py-5 z-50 fixed bottom-0 left-0 right-0 flex justify-around items-center backdrop-blur-md bg-white/80">
                {[
                  { id: 'dashboard', icon: 'fa-gauge', label: 'Stats' },
                  { id: 'ops', icon: 'fa-bolt', label: 'Tasks' },
                  { id: 'tech', icon: 'fa-users', label: 'Force' },
                ].map(nav => (
                  <button 
                    key={nav.id} 
                    onClick={() => { setView(nav.id as AppView); setPrefilledAssetId(undefined); }} 
                    className={`flex flex-col items-center gap-1.5 transition-all py-1.5 px-6 rounded-2xl ${view===nav.id?'text-indigo-600 bg-indigo-50 font-black':'text-slate-300'}`}
                  >
                    <i className={`fas ${nav.icon} text-lg`}></i>
                    <span className="text-[8px] font-black uppercase tracking-widest">{nav.label}</span>
                  </button>
                ))}
            </nav>

            {toast && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-3 rounded-full shadow-2xl font-black text-[9px] uppercase tracking-widest animate-fade-in z-[200] border border-white/10">{toast}</div>}
        </div>
    );
};

export default App;
