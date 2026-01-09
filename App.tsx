
import React, { useState, useEffect, useCallback } from 'react';
import { Asset, Ticket, Technician, InventoryItem, Tool, AssetStatus, TicketStatus, TicketSeverity } from './types';
import { TECHS, DEFAULT_GAS, DEFAULT_TOOLS, WEB_APP_URL, ZONE_MAP } from './constants';
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
    const [aiInsight, setAiInsight] = useState<string>("Infrastructure Diagnostic: System synchronization active. Real-time telemetry linked to Tab 01.");

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
            
            // Sync local checklist state with remote history
            if (stats.checklists || stats.history) {
                const history = stats.checklists || stats.history;
                const restoredChecks = new Set<string>();
                history.forEach((entry: any) => {
                    const assetTag = entry.assetTag || entry.tag || entry.asset_tag;
                    // Important: Look for 'task' or 'type' to distinguish between daily/monthly/quarterly
                    const taskType = entry.task || entry.task_type || entry.type || 'Daily Routine';
                    const targetAsset = mappedAssets.find((a: any) => a.tag === assetTag);
                    if (targetAsset) {
                        restoredChecks.add(`${targetAsset.id}-${taskType}`);
                    }
                });
                setCheckedAssetIds(restoredChecks);
            }
            
            const updatedTechs = technicians.map(tech => {
                const meritCount = allTickets.filter(t => t.assignedTo?.includes(tech.name) && t.status === TicketStatus.RESOLVED && t.location !== 'Admin Panel').length;
                const demeritLogs = allTickets.filter(t => t.location === 'Admin Panel' && t.assignedTo === tech.name);
                let demeritSum = 0;
                demeritLogs.forEach(log => {
                    const match = log.details.match(/-(\d+) pts/);
                    if (match) demeritSum += parseInt(match[1]);
                });
                return { ...tech, merit: meritCount, demerit: demeritSum };
            });
            setTechnicians(updatedTechs);
            
            setAiInsight(`Cloud Sync: 100%. AC_HVAC_Daily_Checklist tab is the primary log target.`);
            showToast("System Synced ✅");
        } catch (error) {
            console.error("Refresh Error:", error);
            showToast("Sync Error");
        } finally { setIsRefreshing(false); }
    }, [technicians, showToast]);

    useEffect(() => { if (screen === 'app') refreshData(); }, [screen]);

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
                showToast("Job Logged 🚀");
                refreshData();
            }
        } catch (e) {
            showToast("Server Link Failed");
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
            showToast("Resolved & Synced ✅");
            refreshData();
        } catch (e) {
            showToast("Update Error");
        }
    };

    const handleMarkChecklistOk = async (assetId: number, technicianName: string, category: string = 'Daily Routine') => {
        const asset = assets.find(a => a.id === assetId);
        if (!asset) return;
        
        try {
            const now = new Date();
            // DD/MM/YYYY for precise Google Sheet parsing
            const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
            const syncId = `SYNC-${now.getTime()}-${assetId}`;
            
            // CORE ROUTING RULE: Everything goes to Tab 01
            const UNIFIED_TAB_NAME = 'AC_HVAC_Daily_Checklist';

            const fd = new FormData();
            fd.append('action', 'checklist');
            
            // ROUTING KEYS: Force backend to use the specific tab
            fd.append('category', UNIFIED_TAB_NAME);
            fd.append('sheetName', UNIFIED_TAB_NAME);
            fd.append('tabName', UNIFIED_TAB_NAME);
            
            // IDENTITY KEYS
            fd.append('technician', technicianName);
            fd.append('tech', technicianName);
            fd.append('technician_name', technicianName);
            
            // ASSET KEYS
            fd.append('assetTag', asset.tag);
            fd.append('tag', asset.tag);
            fd.append('asset_tag', asset.tag);
            fd.append('location', asset.location);
            fd.append('room', asset.room || 'N/A');
            
            // TASK DIFFERENTIATION (Daily / Monthly / Quarterly)
            fd.append('task', category);
            fd.append('type', category);
            fd.append('task_type', category);
            fd.append('taskCategory', category);
            
            // DATA STATUS
            fd.append('status', 'OK');
            fd.append('workingStatus', 'OK');
            fd.append('working_status', 'OK');
            fd.append('condition', 'Verified OK');
            
            // TIMESTAMP & SYNC
            fd.append('date', dateStr);
            fd.append('formatted_date', dateStr);
            fd.append('timestamp', now.toISOString());
            fd.append('syncId', syncId);
            fd.append('sync_id', syncId);

            const response = await fetch(WEB_APP_URL, { method: 'POST', body: fd, redirect: 'follow' });
            const result = await response.json();
            
            if (result.result === 'success' || result.status === 'success') {
                setCheckedAssetIds(prev => {
                  const next = new Set(prev);
                  next.add(`${assetId}-${category}`);
                  return next;
                });
                showToast("Tab 01 Updated ✅");
            } else {
                throw new Error("Server Rejection");
            }
        } catch (e) {
            console.error("Checklist Error:", e);
            showToast("Local Only (Sync Pending) ⚠");
            // Still update UI to show it's "done"
            setCheckedAssetIds(prev => {
                const next = new Set(prev);
                next.add(`${assetId}-${category}`);
                return next;
            });
        }
    };

    const handleIssueDemerit = async (name: string, pts: number, reason: string) => {
        try {
            const fd = new FormData();
            fd.append('action', 'complain');
            fd.append('category', 'AC / HVAC');
            fd.append('location', 'Admin Panel');
            fd.append('details', `AUDIT: ${reason} (-${pts} pts)`);
            fd.append('assetTag', 'ADMIN-LOG');
            fd.append('assignedTech', name);
            
            const resp = await fetch(WEB_APP_URL, { method: 'POST', body: fd, redirect: 'follow' });
            const res = await resp.json();
            
            if (res.result === 'success' && res.rowIndex) {
                const fdClose = new FormData();
                fdClose.append('action', 'close_complaint');
                fdClose.append('rowIndex', String(res.rowIndex));
                fdClose.append('technician', 'System Audit');
                fdClose.append('details', 'Audit Logged');
                await fetch(WEB_APP_URL, { method: 'POST', body: fdClose, redirect: 'follow' });
            }
            showToast("Audit Penalty Applied ⚠");
            refreshData();
        } catch (e) {
            showToast("Sync Failed");
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
                    <p className="text-slate-500 text-[10px] mb-12 font-bold uppercase tracking-widest">Enterprise Facility Infrastructure</p>
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-3xl shadow-2xl transition-all active:scale-90 border border-indigo-400/20"><i className="fas fa-fingerprint"></i></div>
                        <span className="text-slate-400 text-[9px] font-black uppercase tracking-[0.5em] mt-2">Biometric Entry</span>
                    </div>
                </div>
            </div>
        );
    }

    if (screen === 'menu') {
        return (
            <div className="h-screen bg-slate-50 p-8 flex flex-col justify-center space-y-6 fade-in">
                <div className="mb-10">
                    <h2 className="text-4xl font-black text-slate-900 leading-tight italic">Elite <span className="text-indigo-600">Sync</span></h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Authenticated Management</p>
                </div>
                <div className="grid gap-5">
                    {[
                        { id: 'dashboard', icon: 'fa-gauge-high', label: 'Command', desc: 'Global Intelligence', bg: 'bg-indigo-600' },
                        { id: 'ops', icon: 'fa-bolt-lightning', label: 'Incidents', desc: 'Repair Workflows', bg: 'bg-rose-600' },
                        { id: 'tech', icon: 'fa-network-wired', label: 'Specialists', desc: 'Field Force Ops', bg: 'bg-emerald-600' },
                    ].map(v => (
                        <button key={v.id} onClick={() => { setView(v.id as AppView); setScreen('app'); }} className="w-full bg-white p-8 rounded-[2.5rem] shadow-sm border-2 border-slate-50 flex items-center gap-8 group active:scale-[0.98] transition-all hover:border-indigo-100">
                            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-2xl text-white ${v.bg} shadow-lg transition-transform group-hover:scale-110`}>
                                <i className={`fas ${v.icon}`}></i>
                            </div>
                            <div className="text-left flex-1">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">{v.label}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{v.desc}</p>
                            </div>
                            <i className="fas fa-chevron-right text-slate-200 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all"></i>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-slate-50 relative fade-in overflow-hidden">
            <header className="bg-white border-b border-slate-100 px-8 py-6 flex justify-between items-center z-50 sticky top-0 shadow-sm">
                <button onClick={() => setScreen('menu')} className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg"><i className="fas fa-arrow-left"></i></button>
                <div className="text-center">
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">{view === 'tech' ? 'Specialists' : view === 'ops' ? 'Incidents' : 'Command'}</h2>
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-0.5">Session ID: 772-X</p>
                </div>
                <button onClick={refreshData} className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 active:scale-95 transition-all shadow-sm ${isRefreshing?'animate-spin text-indigo-600':''}`}><i className="fas fa-rotate"></i></button>
            </header>

            <div className="flex-1 overflow-hidden">
                {view === 'dashboard' && <DashboardView aiInsight={aiInsight} assets={assets} tickets={tickets} inventory={inventory} technicians={technicians} checkedAssetIds={checkedAssetIds} onUpdateGas={(n,k) => { setInventory(prev=>prev.map(i=>i.name===n?{...i,kg:k}:i)); showToast(`Vault: ${n} Synced`); }} onIssueDemerit={handleIssueDemerit} />}
                {view === 'ops' && <OpsView assets={assets} tickets={tickets} technicians={technicians} onNewTicket={handleNewTicket} onResolveTicket={handleResolveTicket} prefillAssetId={prefilledAssetId} />}
                {view === 'tech' && <TechView technicians={technicians} tickets={tickets} assets={assets} checkedAssetIds={checkedAssetIds} onToggleAttendance={(n)=>setTechnicians(prev=>prev.map(t=>t.name===n?{...t,isPresent:!t.isPresent}:t))} onTakeover={(abs,cov) => { setTechnicians(prev=>prev.map(t=>t.name===cov?{...t,bonusPoints:t.bonusPoints+1}:t)); showToast(`${cov} covering Zone ${ZONE_MAP[abs]}`); }} onMarkChecklistOk={handleMarkChecklistOk} onReportChecklistIssue={(id)=>{ setPrefilledAssetId(String(id)); setView('ops'); }} onResolveTicket={handleResolveTicket} />}
            </div>

            <nav className="bg-white border-t border-slate-100 px-8 py-6 z-50 fixed bottom-0 left-0 right-0 flex justify-around items-center">
                {[
                  { id: 'dashboard', icon: 'fa-gauge', label: 'Stats' },
                  { id: 'ops', icon: 'fa-bolt', label: 'Alerts' },
                  { id: 'tech', icon: 'fa-users', label: 'Force' },
                ].map(nav => (
                  <button 
                    key={nav.id} 
                    onClick={() => { setView(nav.id as AppView); setPrefilledAssetId(undefined); }} 
                    className={`flex flex-col items-center gap-2 transition-all py-2 px-6 rounded-2xl ${view===nav.id?'text-indigo-600 bg-indigo-50 font-black':'text-slate-300'}`}
                  >
                    <i className={`fas ${nav.icon} text-xl`}></i>
                    <span className="text-[9px] font-black uppercase tracking-widest">{nav.label}</span>
                  </button>
                ))}
            </nav>

            {toast && <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl font-black text-[10px] uppercase tracking-[0.2em] animate-fade-in z-[200] border border-white/10 backdrop-blur-md">{toast}</div>}
        </div>
    );
};

export default App;
