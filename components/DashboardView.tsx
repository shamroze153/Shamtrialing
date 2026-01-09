
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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
        { name: 'Open', count: tickets.filter(t => t.status === TicketStatus.OPEN).length, color: '#ef4444' },
        { name: 'WIP', count: tickets.filter(t => t.status === TicketStatus.WIP).length, color: '#f59e0b' },
        { name: 'Closed', count: tickets.filter(t => t.status === TicketStatus.RESOLVED).length, color: '#10b981' },
    ];

    const rankedTechs = [...technicians].sort((a, b) => {
        const scoreA = 100 + (a.merit * 5) - a.demerit;
        const scoreB = 100 + (b.merit * 5) - b.demerit;
        return scoreB - scoreA;
    });

    return (
        <div className="p-4 space-y-6 fade-in overflow-y-auto h-full pb-32">
            {/* Master Stats */}
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => onAssetCardClick('All')}
                    className="col-span-2 bg-white border border-slate-200 border-l-4 border-slate-800 p-4 rounded-2xl shadow-sm text-left flex justify-between items-center group active:scale-95 transition-all"
                >
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Total Assets</p>
                        <h3 className="text-4xl font-black text-slate-900 mt-1">{counts.total}</h3>
                    </div>
                    <i className="fas fa-database text-slate-200 text-4xl group-hover:text-slate-300 transition-colors"></i>
                </button>
                {[
                    { label: 'Active', count: counts.active, color: 'border-green-500', status: AssetStatus.ACTIVE },
                    { label: 'Maintenance', count: counts.maintenance, color: 'border-red-500', status: AssetStatus.MAINTENANCE },
                    { label: 'Spare', count: counts.spare, color: 'border-blue-500', status: AssetStatus.SPARE },
                    { label: 'Disposed', count: counts.disposed, color: 'border-slate-400', status: AssetStatus.DISPOSED },
                ].map(card => (
                    <button 
                        key={card.label}
                        onClick={() => onAssetCardClick(card.status)}
                        className={`bg-white border border-slate-200 border-l-4 ${card.color} p-4 rounded-2xl shadow-sm text-left active:scale-95 transition-all`}
                    >
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{card.label}</p>
                        <h3 className="text-3xl font-black text-slate-800 mt-1">{card.count}</h3>
                    </button>
                ))}
            </div>

            {/* Analytics & Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-black text-slate-800 flex items-center gap-2">
                            <i className="fas fa-chart-pie text-red-500"></i> Ticket Analytics
                        </h4>
                        <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-1 rounded-lg">
                            {tickets.filter(t => t.status !== TicketStatus.RESOLVED).length} Active
                        </span>
                    </div>
                    <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ticketStats}>
                                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                    {ticketStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <h4 className="font-black text-slate-800 flex items-center gap-2 mb-4">
                        <i className="fas fa-clipboard-check text-blue-500"></i> Daily Checklist
                    </h4>
                    <div className="flex items-end gap-2 mb-3">
                        <h2 className="text-4xl font-black text-slate-800">18/24</h2>
                        <span className="text-xs font-bold text-slate-400 mb-2">Completed</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mb-6">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <button className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800">
                        <i className="fas fa-download mr-1"></i> Download Report
                    </button>
                </div>
            </div>

            {/* Gas Inventory */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-black text-slate-900">Refrigerant Status</h3>
                    <i className="fas fa-gas-pump text-slate-400"></i>
                </div>
                <div className="p-5 overflow-x-auto hide-scroll">
                    <div className="flex gap-4 min-w-max">
                        {inventory.map((item, idx) => (
                            <div key={idx} className="flex-shrink-0 w-24 bg-slate-50 rounded-2xl p-3 flex flex-col items-center border border-slate-200 space-y-2">
                                <div className={`w-14 h-18 ${item.type === 'AC' ? 'bg-indigo-500' : 'bg-slate-800'} rounded-xl shadow-lg flex items-center justify-center text-white text-[10px] font-bold`}>
                                    {item.name}
                                </div>
                                <div className="font-black text-xs text-slate-700">{item.kg}kg</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-slate-900 rounded-[2rem] border border-slate-800 shadow-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-black text-white text-lg">Tech Leaderboard</h3>
                        <p className="text-xs text-slate-500 font-bold">Top Performers of the Month</p>
                    </div>
                    <i className="fas fa-trophy text-yellow-500 text-2xl"></i>
                </div>
                <div className="space-y-3">
                    {rankedTechs.map((tech, i) => {
                        const score = 100 + (tech.merit * 5) - tech.demerit;
                        return (
                            <div key={tech.name} className="flex justify-between items-center p-3 rounded-2xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 text-center text-lg">
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                    </div>
                                    <div>
                                        <span className="text-white font-bold text-sm block">{tech.name}</span>
                                        <span className="text-[10px] text-slate-400">Merit: {tech.merit} • Demerit: {tech.demerit}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-white font-black text-xl">{score}</span>
                                    <span className={`text-[9px] block ${tech.merit > 0 ? 'text-green-400' : 'text-slate-400'}`}>
                                        {tech.merit > 0 ? `+${tech.merit * 5}` : '0'} pts
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
