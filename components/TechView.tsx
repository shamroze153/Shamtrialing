
import React from 'react';
import { Technician, Tool, Asset } from '../types';

interface TechViewProps {
    technicians: Technician[];
    tools: Tool[];
    assets: Asset[];
    onToggleAttendance: (name: string) => void;
}

const TechView: React.FC<TechViewProps> = ({ technicians, tools, assets, onToggleAttendance }) => {
    return (
        <div className="p-4 space-y-6 fade-in h-full overflow-y-auto pb-32">
            {/* Attendance Grid */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm">
                <h3 className="font-black text-slate-900 mb-4">Daily Attendance</h3>
                <div className="grid grid-cols-2 gap-3">
                    {technicians.map(t => (
                        <button 
                            key={t.name}
                            onClick={() => onToggleAttendance(t.name)}
                            className={`p-4 rounded-2xl border flex items-center justify-between transition-all active:scale-95 ${t.isPresent ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200 opacity-60'}`}
                        >
                            <span className="font-black text-sm text-slate-700">{t.name}</span>
                            <div className={`w-3 h-3 rounded-full ${t.isPresent ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tool Inventory */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-black text-slate-800">Tool Inventory</h3>
                    <i className="fas fa-wrench text-slate-400"></i>
                </div>
                <div className="max-h-60 overflow-y-auto p-2">
                    {tools.map((tool, i) => (
                        <div key={i} className="flex justify-between items-center p-3 border-b border-slate-50 last:border-0">
                            <span className="text-xs font-bold text-slate-700">{tool.name}</span>
                            <span className="text-[10px] font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-500">Qty: {tool.qty}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
                <button className="w-full bg-yellow-400 text-yellow-900 p-5 rounded-[2rem] flex items-center justify-between group active:scale-95 transition-all shadow-xl shadow-yellow-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/30 rounded-2xl flex items-center justify-center text-2xl">
                            <i className="fas fa-box-open"></i>
                        </div>
                        <div className="text-left">
                            <h3 className="font-black">Raise Material Demand</h3>
                            <p className="text-[10px] font-bold opacity-75 uppercase">Request Parts or Gas</p>
                        </div>
                    </div>
                    <i className="fas fa-chevron-right group-hover:translate-x-1 transition-transform"></i>
                </button>

                <div className="bg-slate-900 text-white p-5 rounded-[2rem] shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black">Zone Checklists</h3>
                        <span className="text-[10px] font-bold bg-white/10 px-3 py-1 rounded-full uppercase">Zone A</span>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 hide-scroll">
                        {assets.slice(0, 5).map(a => (
                            <div key={a.id} className="bg-white/5 border border-white/10 p-3 rounded-2xl flex justify-between items-center">
                                <div>
                                    <span className="font-bold text-xs block">{a.tag}</span>
                                    <span className="text-[9px] text-slate-400">{a.location}</span>
                                </div>
                                <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-green-500 transition-colors">
                                    <i className="fas fa-check text-xs"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TechView;
