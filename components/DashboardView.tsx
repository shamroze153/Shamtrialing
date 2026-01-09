
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Asset, Ticket, TicketStatus, AssetStatus, InventoryItem, Technician, TicketSeverity } from '../types';

interface DashboardViewProps {
  assets: Asset[];
  tickets: Ticket[];
  inventory: InventoryItem[];
  technicians: Technician[];
  checkedAssetIds: Set<string>;
  onUpdateGas: (name: string, kg: number) => void;
  onIssueDemerit: (name: string, points: number, reason: string) => void;
  aiInsight: string;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  assets,
  tickets,
  inventory,
  technicians,
  checkedAssetIds,
  onUpdateGas,
  onIssueDemerit,
  aiInsight
}) => {
  // Fix: Added 'Daily Routine' to the activeDetail type union to match categories array
  const [activeDetail, setActiveDetail] = useState<'' | 'Daily Routine' | 'Monthly Deep Clean' | 'Quarterly Audit' | 'Registry' | null>(null);
  const [reportFilter, setReportFilter] = useState<TicketStatus | null>(null);
  const [clickCount, setClickCount] = useState<{ [key: string]: number }>({});
  const [secretModal, setSecretModal] = useState<{ type: 'gas' | 'demerit', target: string } | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [tempReason, setTempReason] = useState('');
  
  const categories = ['Daily Routine', 'Monthly Deep Clean', 'Quarterly Audit'] as const;

  const handleSecretClick = (id: string, type: 'gas' | 'demerit') => {
    const newCount = (clickCount[id] || 0) + 1;
    setClickCount({ ...clickCount, [id]: newCount });
    if (newCount >= 5) {
      setClickCount({ ...clickCount, [id]: 0 });
      setSecretModal({ type, target: id });
    }
    setTimeout(() => setClickCount(prev => ({ ...prev, [id]: 0 })), 3000);
  };

  const getCategoryStats = (category: string) => {
    // Comment: Fixed 'unknown' type error by asserting id as string in the filter callback
    const checkedCount = Array.from(checkedAssetIds).filter((id: any) => (id as string).endsWith(category)).length;
    const total = assets.length;
    const percent = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
    return { checkedCount, total, percent };
  };

  const chartData = useMemo(() => [
    { name: 'Open', status: TicketStatus.OPEN, value: tickets.filter(t => t.status === TicketStatus.OPEN && t.location !== 'Admin Panel').length, color: '#f43f5e' },
    { name: 'Working', status: TicketStatus.WIP, value: tickets.filter(t => t.status === TicketStatus.WIP && t.location !== 'Admin Panel').length, color: '#f59e0b' },
    { name: 'Fixed', status: TicketStatus.RESOLVED, value: tickets.filter(t => t.status === TicketStatus.RESOLVED && t.location !== 'Admin Panel').length, color: '#10b981' },
  ], [tickets]);

  const assetHealthData = useMemo(() => [
    { name: 'Healthy', value: assets.filter(a => a.status === AssetStatus.ACTIVE).length, color: '#10b981' },
    { name: 'Mainten.', value: assets.filter(a => a.status !== AssetStatus.ACTIVE).length, color: '#f43f5e' },
  ], [assets]);

  const filteredReportTickets = useMemo(() => {
    if (!reportFilter) return [];
    return tickets.filter(t => t.status === reportFilter && t.location !== 'Admin Panel');
  }, [reportFilter, tickets]);

  const activeTechsCount = technicians.filter(t => t.isPresent).length;
  const criticalTickets = tickets.filter(t => t.severity === TicketSeverity.MAJOR && t.status !== TicketStatus.RESOLVED).length;

  if (activeDetail === 'Registry') {
      return (
        <div className="p-8 h-full bg-slate-50 flex flex-col fade-in">
          <header className="flex justify-between items-center mb-10">
            <button onClick={() => setActiveDetail(null)} className="w-14 h-14 bg-white rounded-3xl shadow-sm flex items-center justify-center text-slate-400 active:scale-90 border-2 border-slate-50 transition-all hover:border-indigo-100"><i className="fas fa-chevron-left text-xl"></i></button>
            <div className="text-center">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Master <span className="text-indigo-600">Registry</span></h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Asset Inventory Index</p>
            </div>
            <div className="w-14"></div>
          </header>
          <div className="flex-1 overflow-y-auto space-y-4 pb-48 hide-scroll">
             {assets.map(a => (
                <div key={a.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-50 shadow-sm flex justify-between items-center group hover:border-indigo-200 transition-all">
                   <div>
                      <div className="flex items-center gap-2 mb-1">
                         <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">ID: {a.id}</span>
                         <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Zone {a.zone}</span>
                      </div>
                      <h4 className="text-lg font-black text-slate-900 tracking-tight uppercase italic leading-none">{a.brand}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">{a.room} • {a.tag}</p>
                   </div>
                   <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${a.status === AssetStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                      {a.status}
                   </div>
                </div>
             ))}
          </div>
        </div>
      );
  }

  // Fix: Simplified check to activeDetail. Since 'Registry' is handled and returned above, truthy activeDetail implies other categories.
  if (activeDetail) {
    return (
      <div className="p-8 h-full bg-slate-50 flex flex-col fade-in">
        <header className="flex justify-between items-center mb-10">
           <button onClick={() => setActiveDetail(null)} className="w-14 h-14 bg-white rounded-3xl shadow-sm flex items-center justify-center text-slate-400 active:scale-90 border-2 border-slate-50 transition-all hover:border-indigo-100"><i className="fas fa-chevron-left text-xl"></i></button>
           <div className="text-center">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">{activeDetail}</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Live Verification Log</p>
           </div>
           <div className="w-14"></div>
        </header>

        <div className="flex-1 overflow-y-auto space-y-4 pb-48 hide-scroll px-1">
           {assets.map(a => {
             const isChecked = checkedAssetIds.has(`${a.id}-${activeDetail}`);
             return (
               <div key={a.id} className={`p-6 rounded-[2.5rem] border-2 flex items-center justify-between transition-all ${isChecked ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-white border-slate-50 shadow-sm hover:border-indigo-200'}`}>
                  <div className="flex-1">
                     <h4 className={`font-black text-sm uppercase tracking-tight italic ${isChecked ? 'text-emerald-700' : 'text-slate-900'}`}>{a.room || 'Technical Point'}</h4>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{a.tag} • {a.brand} • {a.capacity}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${isChecked ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                     {isChecked ? 'VALIDATED' : 'WAITING'}
                  </div>
               </div>
             );
           })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-slate-50 h-full overflow-y-auto pb-48 hide-scroll fade-in">
      {/* GLOBAL HUD HEADER */}
      <div className="flex justify-between items-start px-2">
         <div>
            <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Command <span className="text-indigo-600">HUD</span></h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">v8.0 Elite Real-Time Link</p>
         </div>
         <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-1">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active System</span>
            </div>
            <p className="text-[8px] font-black text-slate-300 uppercase">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</p>
         </div>
      </div>

      {/* INTELLIGENT ANALYTICS HUD */}
      <div className="grid grid-cols-2 gap-5">
         <button onClick={() => setActiveDetail('Registry')} className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-50 shadow-sm flex items-center gap-5 group hover:border-indigo-200 transition-all text-left active:scale-95">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
               <i className="fas fa-layer-group text-lg"></i>
            </div>
            <div>
               <span className="text-2xl font-black text-slate-900 block tracking-tighter leading-none">{assets.length}</span>
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 block">Master Assets</span>
            </div>
         </button>
         <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-50 shadow-sm flex items-center gap-5 group hover:border-emerald-200 transition-all text-left">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner">
               <i className="fas fa-id-badge text-lg"></i>
            </div>
            <div>
               <span className="text-2xl font-black text-slate-900 block tracking-tighter leading-none">{activeTechsCount}</span>
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 block">Duty Specialists</span>
            </div>
         </div>
         <button onClick={() => setReportFilter(TicketStatus.OPEN)} className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-50 shadow-sm flex items-center gap-5 group hover:border-rose-200 transition-all text-left active:scale-95">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-inner">
               <i className="fas fa-triangle-exclamation text-lg"></i>
            </div>
            <div>
               <span className="text-2xl font-black text-slate-900 block tracking-tighter leading-none">{criticalTickets}</span>
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 block">Open Issues</span>
            </div>
         </button>
         <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-50 shadow-sm flex items-center gap-5 group hover:border-amber-200 transition-all text-left">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-inner">
               <i className="fas fa-flask-vial text-lg"></i>
            </div>
            <div>
               <span className="text-2xl font-black text-slate-900 block tracking-tighter leading-none">{inventory.filter(i=>i.kg < 20).length}</span>
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 block">Vault Alerts</span>
            </div>
         </div>
      </div>

      {/* AI PREDICTIVE INSIGHT OVERLAY */}
      <div className="bg-slate-950 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
         <div className="absolute top-0 right-0 p-10 opacity-5">
            <i className="fas fa-microchip text-8xl"></i>
         </div>
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></div>
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">AI Diagnostic Kernel</span>
            </div>
            <p className="text-sm font-medium italic text-slate-300 leading-relaxed tracking-tight">"{aiInsight}"</p>
         </div>
      </div>

      {/* INFRASTRUCTURE HEALTH ANALYTICS */}
      <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-50 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all">
         <div className="flex-1">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] mb-2">Health Index</h4>
            <p className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest">Global Asset Reliability</p>
            <div className="space-y-4">
               {assetHealthData.map(d => (
                  <div key={d.name} className="flex items-center gap-4">
                     <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: d.color }}></div>
                     <span className="text-[11px] font-black text-slate-500 uppercase w-20 tracking-tighter">{d.name}</span>
                     <span className="text-lg font-black text-slate-900 tracking-tighter">{d.value}</span>
                  </div>
               ))}
            </div>
         </div>
         <div className="w-32 h-32 relative">
            <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                  <Pie data={assetHealthData} innerRadius={42} outerRadius={58} paddingAngle={8} dataKey="value" stroke="none">
                     {assetHealthData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
               </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-xl font-black text-slate-900 tracking-tighter">98%</span>
               <span className="text-[7px] font-black text-slate-300 uppercase">Load</span>
            </div>
         </div>
      </div>

      {/* INTERACTIVE COMPLAINT ANALYTICS */}
      <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-50 shadow-sm relative overflow-hidden group">
         <div className="flex justify-between items-center mb-10">
            <div>
               <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Lifecycle Stats</h4>
               <p className="text-[10px] font-black text-slate-300 uppercase mt-1 tracking-widest">Interactive Audit Stream</p>
            </div>
            <div className="flex gap-1.5">
               <div className="w-4 h-4 rounded-full bg-rose-500 shadow-xl shadow-rose-200"></div>
               <div className="w-4 h-4 rounded-full bg-amber-500 shadow-xl shadow-amber-200"></div>
               <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-xl shadow-emerald-200"></div>
            </div>
         </div>
         <div className="h-56 w-full cursor-pointer">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} margin={{top: 0, right: 10, left: -25, bottom: 0}}>
                  <Bar 
                    dataKey="value" 
                    radius={[18, 18, 18, 18]} 
                    animationDuration={2500}
                    onClick={(data: any) => setReportFilter(data.payload.status)}
                  >
                     {chartData.map((e, i) => <Cell key={i} fill={e.color} className="hover:opacity-60 transition-opacity" />)}
                  </Bar>
               </BarChart>
            </ResponsiveContainer>
         </div>
         <div className="grid grid-cols-3 gap-3 mt-10 pt-10 border-t border-slate-50">
            {chartData.map(d => (
               <button key={d.name} onClick={() => setReportFilter(d.status)} className="text-center group transition-all p-4 rounded-3xl hover:bg-slate-50 active:scale-95">
                  <span className="text-3xl font-black block tracking-tighter transition-transform group-hover:scale-125 group-hover:mb-2" style={{ color: d.color }}>{d.value}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 block">{d.name}</span>
               </button>
            ))}
         </div>
         <div className="mt-8 flex justify-center">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] flex items-center gap-3 italic">
               <i className="fas fa-arrow-pointer animate-bounce"></i> Interactive Sub-Panels Enabled
            </span>
         </div>
      </div>

      {/* COMPLIANCE PROGRESS & CHECKLISTS */}
      <div className="space-y-6">
         <div className="flex justify-between items-center px-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Compliance Matrix</h4>
            <div className="px-4 py-1.5 bg-indigo-50 rounded-full">
               <span className="text-indigo-600 text-[9px] font-black uppercase tracking-widest italic">Verification Live</span>
            </div>
         </div>
         <div className="grid gap-6">
            {categories.map(cat => {
              const stats = getCategoryStats(cat);
              return (
                <button 
                  key={cat} 
                  onClick={() => setActiveDetail(cat)}
                  className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 shadow-sm flex flex-col group active:scale-[0.98] transition-all hover:border-indigo-100 relative overflow-hidden"
                >
                  <div className="flex justify-between items-center w-full mb-6 relative z-10">
                     <span className="text-[12px] font-black text-slate-900 uppercase tracking-wider italic">{cat}</span>
                     <div className="flex items-center gap-4">
                        <span className="text-2xl font-black text-slate-900 tracking-tighter">{stats.percent}%</span>
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                           <i className="fas fa-arrow-right text-[12px]"></i>
                        </div>
                     </div>
                  </div>
                  <div className="h-3.5 w-full bg-slate-50 rounded-full overflow-hidden border-2 border-slate-100 p-[3px] shadow-inner">
                     <div 
                       className={`h-full rounded-full transition-all duration-1500 ease-out ${stats.percent > 90 ? 'bg-emerald-500 shadow-xl shadow-emerald-100' : 'bg-indigo-600 shadow-xl shadow-indigo-100'}`} 
                       style={{ width: `${stats.percent}%` }}
                     ></div>
                  </div>
                  <div className="flex justify-between w-full mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <span>{stats.checkedCount} / {stats.total} Units Clear</span>
                     <span className="text-slate-300">Detailed Diagnostic Log <i className="fas fa-chevron-right ml-1"></i></span>
                  </div>
                </button>
              );
            })}
         </div>
      </div>

      {/* RESOURCE VAULT: CRYOGENIC MONITOR */}
      <div className="bg-slate-950 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden border-4 border-slate-900">
         <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-60"></div>
         <div className="flex justify-between items-center mb-12">
            <div>
               <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.5em] italic">Supply Chain Vault</h4>
               <p className="text-[9px] font-black text-slate-500 uppercase mt-2 tracking-widest">Remote Tank Telemetry</p>
            </div>
            <div className="w-14 h-14 bg-white/5 rounded-3xl flex items-center justify-center text-slate-600 text-3xl shadow-inner border border-white/5"><i className="fas fa-database"></i></div>
         </div>
         <div className="grid grid-cols-2 gap-x-14 gap-y-14">
            {inventory.slice(0, 4).map(g => (
              <div key={g.name} onClick={() => handleSecretClick(g.name, 'gas')} className="flex flex-col gap-5 group cursor-pointer active:scale-95 transition-all relative">
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white/30 group-hover:text-indigo-400 border border-white/5 transition-all shadow-inner group-hover:scale-110">
                       <i className="fas fa-fill-drip text-2xl"></i>
                    </div>
                    <div>
                       <span className="text-lg font-black block tracking-tighter uppercase italic leading-none mb-2 group-hover:text-white transition-colors">{g.name}</span>
                       <span className={`text-[11px] font-black uppercase tracking-widest block ${g.kg < 20 ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`}>
                          {g.kg} KG <span className="text-[8px] opacity-20 ml-1 font-black">RESERVE</span>
                       </span>
                    </div>
                 </div>
                 <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden p-[2px] shadow-inner">
                    <div className={`h-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)] transition-all duration-2000 ease-out`} style={{ width: `${Math.min(100, (g.kg / 80) * 100)}%` }}></div>
                 </div>
              </div>
            ))}
         </div>
      </div>

      {/* SPECIALIST PERSONNEL PERFORMANCE */}
      <div className="bg-white p-12 rounded-[3.5rem] border-2 border-slate-50 shadow-sm">
         <div className="flex justify-between items-center mb-10">
            <div>
               <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Personnel Efficiency</h4>
               <p className="text-[10px] font-black text-slate-300 uppercase mt-2 tracking-widest">Weighted KPI Analytics</p>
            </div>
            <div className="w-14 h-14 rounded-3xl bg-slate-50 flex items-center justify-center text-indigo-500 shadow-inner border border-slate-100">
               <i className="fas fa-shield-halved text-2xl"></i>
            </div>
         </div>
         <div className="space-y-5">
            {technicians.map(t => (
              <div key={t.name} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2.5rem] cursor-pointer active:scale-95 transition-all hover:bg-white hover:shadow-xl border-2 border-transparent hover:border-slate-50 group" onClick={() => handleSecretClick(t.name, 'demerit')}>
                 <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-3xl flex items-center justify-center text-white text-sm font-black shadow-xl transition-all group-hover:scale-110 ${t.isPresent ? 'bg-indigo-600' : 'bg-slate-300 grayscale'}`}>
                       {t.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                       <span className="font-black text-lg text-slate-900 uppercase tracking-tighter italic leading-none">{t.name}</span>
                       <div className="flex items-center gap-3 mt-2">
                          <div className={`w-2 h-2 rounded-full ${t.isPresent ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-rose-500'}`}></div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.isPresent ? 'On Force' : 'Offline'}</p>
                       </div>
                    </div>
                 </div>
                 <div className="text-right bg-white p-4 rounded-3xl shadow-sm border-2 border-slate-50 group-hover:border-indigo-100 transition-colors">
                    <span className={`text-2xl font-black block tracking-tighter leading-none ${t.merit + t.bonusPoints - t.demerit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                       {t.merit + t.bonusPoints - t.demerit}
                    </span>
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Force Score</p>
                 </div>
              </div>
            ))}
         </div>
      </div>

      {/* INCIDENT DRILL-DOWN: SYSTEM REPORT */}
      {reportFilter && (
        <div className="fixed inset-0 bg-slate-950/98 z-[200] backdrop-blur-3xl flex flex-col fade-in overflow-hidden">
           <header className="p-10 border-b border-white/5 flex justify-between items-center">
              <div>
                 <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">{reportFilter} <span className="text-indigo-400">Vault</span></h3>
                 <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] mt-2">Incident Audit Repository</p>
              </div>
              <button onClick={() => setReportFilter(null)} className="w-16 h-16 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center text-white active:scale-90 transition-all hover:bg-white/10 shadow-2xl"><i className="fas fa-times text-2xl"></i></button>
           </header>
           
           <div className="flex-1 overflow-y-auto p-10 space-y-8 pb-32 hide-scroll">
              {filteredReportTickets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-20 opacity-20">
                   <div className="w-40 h-40 bg-white/5 rounded-full flex items-center justify-center mb-10 border-4 border-white/5 shadow-inner">
                      <i className="fas fa-check-double text-8xl text-white"></i>
                   </div>
                   <p className="text-white font-black uppercase tracking-[0.6em] text-lg italic">System Nominal - No Records</p>
                </div>
              ) : (
                filteredReportTickets.map(t => (
                  <div key={t.id} className="bg-white/5 border border-white/10 p-10 rounded-[3.5rem] relative overflow-hidden group hover:bg-white/10 transition-all shadow-2xl">
                     <div className={`absolute top-0 left-0 w-2.5 h-full ${t.severity === TicketSeverity.MAJOR ? 'bg-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.6)]' : 'bg-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.6)]'}`}></div>
                     <div className="flex justify-between items-start mb-8">
                        <div className="flex-1">
                           <div className="flex items-center gap-4 mb-3">
                              <span className="text-[12px] font-black text-indigo-400 uppercase tracking-widest">{t.assetTag}</span>
                              <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.timestamp}</span>
                           </div>
                           <h4 className="text-2xl font-black text-white leading-tight italic tracking-tighter group-hover:text-indigo-200 transition-colors uppercase">{t.details}</h4>
                           <div className="flex flex-wrap gap-8 mt-10 pt-10 border-t border-white/5">
                              <div className="flex items-center gap-3">
                                 <i className="fas fa-map-pin text-indigo-500 text-sm"></i>
                                 <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t.location}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                 <i className="fas fa-id-card text-indigo-500 text-sm"></i>
                                 <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Assign: {t.assignedTo}</span>
                              </div>
                           </div>
                        </div>
                        <div className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl border ${t.severity === TicketSeverity.MAJOR ? 'bg-rose-500 text-white border-rose-400/20' : 'bg-indigo-600 text-white border-indigo-500/20'}`}>
                           {t.severity}
                        </div>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      )}

      {/* ADMINISTRATIVE AUTH MODAL */}
      {secretModal && (
        <div className="fixed inset-0 bg-slate-950/98 z-[300] backdrop-blur-[60px] flex items-center justify-center p-8 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[4.5rem] p-14 text-center shadow-2xl relative overflow-hidden border-8 border-slate-900 shadow-[0_0_60px_rgba(0,0,0,0.5)]">
            <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400"></div>
            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-900 text-4xl mx-auto mb-10 shadow-inner border-2 border-slate-100">
               <i className={secretModal.type === 'gas' ? 'fas fa-fingerprint' : 'fas fa-user-shield'}></i>
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter italic leading-none">Force <span className="text-indigo-600">Auth</span></h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-12">Target: {secretModal.target}</p>
            
            <div className="space-y-10">
              <div className="space-y-3 text-left px-4">
                 <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Entry Vector</label>
                 <input 
                   type="number" 
                   placeholder="0.0" 
                   value={tempValue} 
                   onChange={e => setTempValue(e.target.value)}
                   className="w-full p-10 bg-slate-50 rounded-[2.5rem] font-black text-6xl text-center outline-none border-4 border-slate-50 focus:border-indigo-500 transition-all text-indigo-600 shadow-inner"
                 />
              </div>
              {secretModal.type === 'demerit' && (
                <div className="space-y-3 text-left px-4">
                   <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Audit Narrative</label>
                   <input 
                     type="text" 
                     placeholder="Specify breach..." 
                     value={tempReason} 
                     onChange={e => setTempReason(e.target.value)}
                     className="w-full p-7 bg-slate-50 rounded-3xl text-center outline-none border-2 border-slate-50 font-black text-[11px] uppercase tracking-widest text-slate-700 shadow-inner"
                   />
                </div>
              )}
              <div className="grid grid-cols-2 gap-6 pt-10">
                 <button 
                   onClick={() => setSecretModal(null)}
                   className="py-7 bg-slate-100 text-slate-400 rounded-[2rem] font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 shadow-sm"
                 >
                   Discard
                 </button>
                 <button 
                   onClick={() => {
                     if (secretModal.type === 'gas') onUpdateGas(secretModal.target, parseFloat(tempValue));
                     else onIssueDemerit(secretModal.target, parseInt(tempValue), tempReason);
                     setSecretModal(null);
                     setTempValue(''); setTempReason('');
                   }}
                   className="py-7 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-100 active:scale-95 transition-all border border-slate-800"
                 >
                   Sync Link
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;
