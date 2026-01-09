
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { Asset, Ticket, TicketStatus, AssetStatus, InventoryItem, Technician } from '../types';

interface DashboardViewProps {
    assets: Asset[];
    tickets: Ticket[];
    inventory: InventoryItem[];
    technicians: Technician[];
    onAssetCardClick: (status: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ assets, tickets, inventory, technicians, onAssetCardClick }) => {
    const counts = {
        total: assets.length,
        active: assets.filter(a => a.status === AssetStatus.ACTIVE).length,
        maintenance: assets.filter(a => a.status === AssetStatus.MAINTENANCE).length,
        spare: assets.filter(a => a.status === AssetStatus.SPARE).length,
        disposed: assets.filter(a => a.status === AssetStatus.DISPOSED).length,
    };

    const ticketStats = [
      { name: 'Open', count: tickets.filter(t => t.status === TicketStatus.OPEN).length, color: '#F43F5E' },
      { name: 'WIP', count: tickets.filter(t => t.status === TicketStatus.WIP).length, color: '#F59E0B' },
      { name: 'Closed', count: tickets.filter(t => t.status === TicketStatus.RESOLVED).length, color: '#10B981' },
    ];

    // Mock trend data for the Area Chart
    const performanceData = [
      { day: 'Mon', load: 12 },
      { day: 'Tue', load: 18 },
      { day: 'Wed', load: 15 },
      { day: 'Thu', load: 22 },
      { day: 'Fri', load: 30 },
      { day: 'Sat', load: 20 },
      { day: 'Sun', load: 14 },
    ];

    const rankedTechs = [...technicians].sort((a, b) => {
        const scoreA = 100 + (a.merit * 5) - a.demerit;
        const scoreB = 100 + (b.merit * 5) - b.demerit;
        return scoreB - scoreA;
    });

    return (
        <div className="p-4 space-y-6 fade-in overflow-y-auto h-full pb-32 hide-scroll bg-slate-50">
            {/* Main Hero Header */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Facility Health Index</p>
                            <h2 className="text-5xl font-black tracking-tighter mb-1">94.2%</h2>
                            <p className="text-slate-400 text-xs font-bold flex items-center gap-1">
                                <i className="fas fa-caret-up text-green-400"></i> +2.4% from last period
                            </p>
                        </div>
                        <div className="flex -space-x-3">
                          {technicians.filter(t => t.isPresent).map((t, idx) => (
                            <div key={idx} title={t.name} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-indigo-500 flex items-center justify-center text-[10px] font-black shadow-lg ring-1 ring-white/10">
                              {t.name.substring(0, 2).toUpperCase()}
                            </div>
                          ))}
                        </div>
                    </div>
                    
                    <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                        <div>
                            <p className="text-slate-500 text-[9px] font-bold uppercase mb-1">MTTR</p>
                            <p className="text-lg font-black tracking-tight">42<span className="text-[10px] ml-1 text-slate-400 font-normal">min</span></p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-[9px] font-bold uppercase mb-1">Up-Time</p>
                            <p className="text-lg font-black tracking-tight">99.9<span className="text-[10px] ml-1 text-slate-400 font-normal">%</span></p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-[9px] font-bold uppercase mb-1">Gas Stock</p>
                            <p className="text-lg font-black tracking-tight">250<span className="text-[10px] ml-1 text-slate-400 font-normal">kg</span></p>
                        </div>
                    </div>
                </div>
                {/* Visual Flair */}
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-600/30 rounded-full blur-[100px]"></div>
                <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px]"></div>
            </div>

            {/* Assets Quick Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Assets', count: counts.total, color: 'bg-white text-slate-900', icon: 'fa-cube', sub: 'Managed Units' },
                  { label: 'Active', count: counts.active, color: 'bg-green-500 text-white', icon: 'fa-check-circle', sub: 'Operational' },
                  { label: 'Faulty', count: counts.maintenance, color: 'bg-rose-500 text-white', icon: 'fa-tools', sub: 'Down' },
                  { label: 'Spares', count: counts.spare, color: 'bg-amber-400 text-amber-950', icon: 'fa-warehouse', sub: 'In Stock' },
                ].map((card, i) => (
                  <button 
                    key={i} 
                    onClick={() => onAssetCardClick(card.label.includes('Total') ? 'All' : card.label)}
                    className={`${card.color} p-5 rounded-[2rem] shadow-sm flex flex-col justify-between h-40 border border-slate-100 transition-all hover:-translate-y-1 active:scale-95 text-left`}
                  >
                    <div className="flex justify-between items-start">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${card.color.includes('white') ? 'bg-slate-100 text-slate-900' : 'bg-black/10 text-current'}`}>
                            <i className={`fas ${card.icon}`}></i>
                        </div>
                        <i className="fas fa-chevron-right opacity-20 text-xs"></i>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black leading-none">{card.count}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mt-1">{card.label}</p>
                    </div>
                  </button>
                ))}
            </div>

            {/* Performance Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h4 className="font-black text-slate-900">Workload Pulse</h4>
                            <p className="text-[10px] font-bold text-slate-400">7-Day Complaint Inflow</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                            <i className="fas fa-heartbeat text-rose-500 text-xs"></i>
                        </div>
                    </div>
                    <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData}>
                                <defs>
                                    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', background: '#0f172a', color: '#fff', fontSize: '10px' }}
                                    itemStyle={{ color: '#818cf8' }}
                                />
                                <Area type="monotone" dataKey="load" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorLoad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-black text-slate-900">Queue Distribution</h4>
                            <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1 rounded-full uppercase">Live</span>
                        </div>
                        <div className="h-32 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ticketStats}>
                                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                                    <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                                        {ticketStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl mt-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                            <i className="fas fa-clock text-amber-500"></i>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Avg Response</p>
                            <p className="font-black text-slate-800">12m 30s</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Refrigerant & Supplies */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-black text-slate-900">Supply Chain Status</h3>
                        <p className="text-[10px] font-bold text-slate-400">Refrigerant Gas (kg)</p>
                    </div>
                    <button className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl">View Inventory</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {inventory.map((item, idx) => {
                        const fillPercent = (item.kg / 50) * 100;
                        return (
                            <div key={idx} className="bg-slate-50 border border-slate-100 p-4 rounded-3xl group transition-all hover:bg-slate-100">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="font-black text-xs text-slate-900">{item.name}</span>
                                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${item.type === 'AC' ? 'bg-blue-100 text-blue-700' : 'bg-slate-900 text-white'}`}>{item.type}</span>
                                </div>
                                <div className="relative h-20 w-full bg-slate-200 rounded-xl overflow-hidden mb-2">
                                    <div 
                                        className={`absolute bottom-0 w-full transition-all duration-1000 ${fillPercent < 20 ? 'bg-rose-500' : fillPercent < 50 ? 'bg-amber-500' : 'bg-indigo-500'}`} 
                                        style={{ height: `${fillPercent}%` }}
                                    >
                                        <div className="absolute top-0 w-full h-1 bg-white/20"></div>
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-800 mix-blend-overlay">
                                        {item.kg}kg
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Performance Leaderboard */}
            <div className="bg-slate-900 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20"></div>
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <div>
                        <h3 className="text-2xl font-black text-white">Technician Merit</h3>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Monthly Performance Index</p>
                    </div>
                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-3xl">
                        <i className="fas fa-medal text-yellow-400 text-2xl"></i>
                    </div>
                </div>
                <div className="space-y-4 relative z-10">
                    {rankedTechs.map((tech, i) => {
                        const score = 100 + (tech.merit * 5) - tech.demerit;
                        const rankColors = [
                          'from-yellow-400 to-amber-600',
                          'from-slate-300 to-slate-500',
                          'from-orange-400 to-orange-700',
                          'from-slate-700 to-slate-800'
                        ];
                        return (
                            <div key={tech.name} className="group flex justify-between items-center p-4 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-default">
                                <div className="flex items-center gap-5">
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${rankColors[i] || rankColors[3]} flex items-center justify-center text-white text-lg font-black shadow-lg`}>
                                        {i + 1}
                                    </div>
                                    <div>
                                        <span className="text-white font-black text-lg block leading-none">{tech.name}</span>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-[9px] font-black text-green-400 uppercase tracking-tighter bg-green-400/10 px-2 py-0.5 rounded-full">Merit +{tech.merit}</span>
                                            <span className="text-[9px] font-black text-rose-400 uppercase tracking-tighter bg-rose-400/10 px-2 py-0.5 rounded-full">Demerit -{tech.demerit}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-500 text-[9px] font-black uppercase">KPI SCORE</p>
                                    <span className="text-3xl font-black text-white tracking-tighter">{score}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                    <button className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-white transition-colors">
                        View Detailed Performance Ledger <i className="fas fa-arrow-right ml-2"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
