
import React, { useState } from 'react';
import { Technician, Ticket, Asset, TicketStatus, TicketSeverity } from '../types';
import { ZONE_LABELS, ZONE_MAP } from '../constants';

interface TechViewProps {
  technicians: Technician[];
  tickets: Ticket[];
  assets: Asset[];
  checkedAssetIds: Set<string>; // Strings like "assetId-category"
  onToggleAttendance: (name: string) => void;
  onTakeover: (absentTechName: string, coveringTechName: string) => void;
  onMarkChecklistOk: (assetId: number, techName: string, category: string) => void;
  onReportChecklistIssue: (assetId: number) => void;
  onResolveTicket: (id: number, res: { type: 'Minor' | 'Major', details: string, technicianName: string, gas?: string, amount?: number }) => void;
}

const TechView: React.FC<TechViewProps> = ({
  technicians,
  tickets,
  assets,
  checkedAssetIds,
  onToggleAttendance,
  onTakeover,
  onMarkChecklistOk,
  onReportChecklistIssue,
  onResolveTicket
}) => {
  const [activeTech, setActiveTech] = useState<Technician | null>(null);
  const [activeZone, setActiveZone] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [checklistCategory, setChecklistCategory] = useState<'Daily Routine' | 'Monthly Deep Clean' | 'Quarterly Audit'>('Daily Routine');
  const [takeoverTarget, setTakeoverTarget] = useState<string | null>(null);

  // Resolution Modal States
  const [resolvingTicket, setResolvingTicket] = useState<Ticket | null>(null);
  const [resolverSelection, setResolverSelection] = useState<string>('');
  const [resStep, setResStep] = useState(0); 
  const [gasType, setGasType] = useState('R22');
  const [gasAmount, setGasAmount] = useState('');

  const getAvatar = (name: string, size: 'sm' | 'lg' = 'sm') => {
    const initials = name.substring(0, 2).toUpperCase();
    const bgColors: Record<string, string> = {
      'Bilal': 'bg-indigo-600',
      'Asad': 'bg-emerald-600',
      'Taimoor': 'bg-rose-600',
      'Saboor': 'bg-cyan-600'
    };
    const bg = bgColors[name] || 'bg-slate-900';
    const dimensions = size === 'sm' ? 'w-14 h-14 text-sm' : 'w-20 h-20 text-2xl';
    return (
      <div className={`${dimensions} rounded-2xl flex items-center justify-center text-white font-black shadow-lg ${bg}`}>
        {initials}
      </div>
    );
  };

  const getTicketsForTech = (name: string) => {
    return tickets.filter(t => t.assignedTo?.includes(name) && t.status !== TicketStatus.RESOLVED && t.location !== 'Admin Panel');
  };

  if (activeTech) {
    const techTickets = getTicketsForTech(activeTech.name);
    return (
      <div className="p-6 h-full bg-slate-50 flex flex-col fade-in overflow-hidden">
        <header className="flex justify-between items-center mb-8">
          <button onClick={() => setActiveTech(null)} className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 active:scale-90 border border-slate-100"><i className="fas fa-chevron-left"></i></button>
          <div className="text-center">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{activeTech.name}'s Panel</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Zone {activeTech.zone} Specialist</p>
          </div>
          <div className="w-10"></div>
        </header>

        <div className="grid grid-cols-2 gap-4 mb-8">
           <button onClick={() => setActiveZone(activeTech.zone)} className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col items-center gap-3 active:scale-95 transition-all">
              <i className="fas fa-clipboard-list text-2xl text-indigo-400"></i>
              <span className="text-[10px] font-bold uppercase">Inspect Zone</span>
           </button>
           <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center gap-2">
              <span className="text-3xl font-black text-slate-900">{techTickets.length}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">My Jobs</span>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pb-32 hide-scroll">
          <div className="flex justify-between items-center px-2 mb-2">
             <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Repair Queue</h4>
             <span className="text-[9px] font-bold text-slate-300 uppercase">Live Assign</span>
          </div>
          
          {techTickets.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl text-center border border-dashed border-slate-200">
               <i className="fas fa-circle-check text-slate-100 text-4xl mb-4"></i>
               <p className="text-slate-400 text-xs font-bold uppercase">No tasks pending.</p>
            </div>
          ) : (
            techTickets.map(t => (
              <div key={t.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden transition-all active:bg-slate-50">
                <div className={`absolute left-0 top-0 w-1.5 h-full ${t.severity === TicketSeverity.MAJOR ? 'bg-rose-500' : 'bg-slate-900'}`}></div>
                <div className="flex justify-between items-start mb-4">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-indigo-600">{t.assetTag}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{t.location}</span>
                   </div>
                   <span className={`text-[9px] font-bold px-3 py-1 rounded-lg uppercase ${t.severity === TicketSeverity.MAJOR ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>{t.severity}</span>
                </div>
                <h5 className="text-sm font-bold text-slate-800 leading-tight mb-5">{t.details}</h5>
                <button 
                  onClick={() => { setResolvingTicket(t); setResolverSelection(activeTech.name); setResStep(0); }} 
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md active:scale-95"
                >
                  Resolve Now
                </button>
              </div>
            ))
          )}
        </div>

        {/* Zone Checklist Portal */}
        {activeZone && (
          <div className="fixed inset-0 bg-white z-[100] p-6 fade-in flex flex-col">
            <header className="flex justify-between items-center mb-6">
               <button onClick={() => setActiveZone(null)} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center active:scale-90 border border-slate-100"><i className="fas fa-times"></i></button>
               <div className="text-center">
                 <h3 className="text-xl font-black text-slate-900 uppercase">Operations: {activeZone}</h3>
                 <p className="text-indigo-600 text-[10px] font-bold uppercase tracking-wider">{ZONE_LABELS[activeZone]}</p>
               </div>
               <div className="w-10"></div>
            </header>

            <div className="flex gap-2 mb-6 overflow-x-auto hide-scroll pb-2">
                {['Daily Routine', 'Monthly Deep Clean', 'Quarterly Audit'].map((cat: any) => (
                    <button 
                        key={cat} 
                        onClick={() => setChecklistCategory(cat)}
                        className={`px-5 py-3 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all border-2 flex-shrink-0 ${checklistCategory === cat ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto hide-scroll pb-24">
              {assets.filter(a => a.zone === activeZone).map(a => {
                const isChecked = checkedAssetIds.has(`${a.id}-${checklistCategory}`);
                return (
                  <div key={a.id} className={`p-5 rounded-3xl flex flex-col gap-4 border ${isChecked ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                         <h5 className={`font-bold text-sm ${isChecked ? 'text-emerald-700' : 'text-slate-900'}`}>{a.room || 'Technical Point'}</h5>
                         <p className="text-[10px] text-slate-400 font-bold uppercase">{a.tag} • {a.brand}</p>
                      </div>
                      {isChecked && <i className="fas fa-circle-check text-emerald-500 text-xl"></i>}
                    </div>
                    <div className="flex gap-3">
                       <button 
                         disabled={isChecked}
                         onClick={() => onMarkChecklistOk(a.id, activeTech.name, checklistCategory)} 
                         className={`flex-1 py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all ${isChecked ? 'bg-emerald-200 text-emerald-700 cursor-default' : 'bg-slate-900 text-white active:scale-95'}`}
                       >
                         {isChecked ? 'Verified' : 'Verify OK'}
                       </button>
                       <button 
                         onClick={() => { setActiveZone(null); onReportChecklistIssue(a.id); }} 
                         className="flex-1 py-3 bg-white text-rose-600 border border-rose-100 rounded-xl font-bold text-[10px] uppercase shadow-sm active:scale-95"
                       >
                         Issue Alert
                       </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resolution Wizard Overlay */}
        {resolvingTicket && (
          <div className="fixed inset-0 bg-slate-950/95 z-[200] flex items-center justify-center p-6 backdrop-blur-sm">
             <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative text-center">
                <button onClick={() => setResolvingTicket(null)} className="absolute top-6 right-6 text-slate-300 active:scale-90"><i className="fas fa-times text-xl"></i></button>
                <h3 className="text-2xl font-black text-slate-900 mb-8 italic tracking-tight">Finalize Job</h3>

                {resStep === 0 && (
                   <div className="space-y-6">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Confirm Identity</p>
                      <div className="grid grid-cols-2 gap-3">
                        {technicians.filter(t => t.isPresent).map(t => (
                          <button key={t.name} onClick={() => { setResolverSelection(t.name); setResStep(1); }} className={`py-4 rounded-xl font-bold text-xs uppercase border-2 transition-all ${resolverSelection === t.name ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-300'}`}>{t.name}</button>
                        ))}
                      </div>
                   </div>
                )}

                {resStep === 1 && (
                   <div className="space-y-4 fade-in">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">Service Intensity</p>
                      <button onClick={() => { onResolveTicket(resolvingTicket.id, { type: 'Minor', details: 'Minor repair successfully completed', technicianName: resolverSelection }); setResolvingTicket(null); setResStep(0); }} className="w-full py-4 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm uppercase shadow-sm border border-emerald-100">Routine Adjustment</button>
                      <button onClick={() => setResStep(2)} className="w-full py-4 rounded-xl bg-rose-50 text-rose-700 font-bold text-sm uppercase shadow-sm border border-rose-100">Major Overhaul</button>
                      <button onClick={() => setResStep(0)} className="mt-6 text-[10px] font-bold text-slate-300 uppercase underline">Go Back</button>
                   </div>
                )}

                {resStep === 2 && (
                   <div className="space-y-4 fade-in">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">Service Classification</p>
                      <button onClick={() => { onResolveTicket(resolvingTicket.id, { type: 'Major', details: 'Component replacement completed', technicianName: resolverSelection }); setResolvingTicket(null); setResStep(0); }} className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold text-sm uppercase shadow-lg">Mechanical Service</button>
                      <button onClick={() => setResStep(3)} className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold text-sm uppercase shadow-lg">Gas Service</button>
                      <button onClick={() => setResStep(1)} className="mt-6 text-[10px] font-bold text-slate-300 uppercase underline">Back</button>
                   </div>
                )}

                {resStep === 3 && (
                   <div className="space-y-6 text-left fade-in">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 block">Cylinder ID</label>
                        <select value={gasType} onChange={e => setGasType(e.target.value)} className="w-full bg-slate-50 p-4 rounded-xl font-bold border border-slate-100 text-slate-900 outline-none focus:border-indigo-500">
                          <option value="R22">R22</option><option value="R410A">R410A</option><option value="R32">R32</option><option value="R134a">R134a</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 block">Net Amount (KG)</label>
                        <input type="number" value={gasAmount} onChange={e => setGasAmount(e.target.value)} className="w-full bg-slate-50 p-6 rounded-2xl font-black text-4xl text-center border-2 border-slate-100 text-indigo-600 outline-none focus:border-indigo-500 shadow-inner" placeholder="0.0" />
                      </div>
                      <button onClick={() => { onResolveTicket(resolvingTicket.id, { type: 'Major', details: `Refrigerant Recharge (${gasType}): ${gasAmount}kg`, technicianName: resolverSelection, gas: gasType, amount: parseFloat(gasAmount) }); setResolvingTicket(null); setResStep(0); }} className="w-full py-5 bg-slate-950 text-white rounded-2xl font-bold text-sm uppercase shadow-xl active:scale-95 transition-all">Submit & Sync</button>
                      <button onClick={() => setResStep(2)} className="w-full text-center text-[10px] font-bold text-slate-300 uppercase underline mt-4">Abort</button>
                   </div>
                )}
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-10 h-full overflow-y-auto pb-48 hide-scroll bg-slate-50">
      <div className="text-center mb-4">
        <h3 className="text-4xl font-black text-slate-900 tracking-tight italic">Field <span className="text-indigo-600">Ops</span></h3>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Specialist Network Status</p>
      </div>

      <div className="grid grid-cols-2 gap-5 max-w-sm mx-auto">
        {technicians.map(t => {
          const isAbsent = !t.isPresent;
          const techTickets = getTicketsForTech(t.name);
          return (
            <div 
              key={t.name} 
              className={`bg-white p-6 rounded-[2.5rem] border-2 shadow-sm flex flex-col items-center gap-5 relative transition-all active:scale-95 group cursor-pointer ${isAbsent ? 'border-dashed border-slate-200 opacity-60' : 'border-slate-50 hover:border-indigo-200'}`}
              onClick={() => t.isPresent ? setActiveTech(t) : setTakeoverTarget(t.name)}
            >
              <div className="relative">
                 {getAvatar(t.name, 'sm')}
                 <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white shadow-md ${t.isPresent ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
              </div>
              <div className="text-center">
                 <h4 className="text-md font-black text-slate-900 uppercase group-hover:text-indigo-600">{t.name}</h4>
                 <div className="mt-3 space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Zone {t.zone}</p>
                    <div className="flex items-center justify-center gap-1.5">
                       <i className="fas fa-ticket text-[9px] text-indigo-400"></i>
                       <span className={`text-[10px] font-black ${techTickets.length > 0 ? 'text-rose-600' : 'text-slate-300'}`}>{techTickets.length} Jobs</span>
                    </div>
                 </div>
              </div>
              
              {isAbsent && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center p-4">
                   <span className="bg-rose-600 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase shadow-lg">OFFLINE</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
         <div className="relative z-10">
           <div className="flex items-center gap-4 mb-8 text-indigo-400">
               <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                  <i className="fas fa-user-clock text-xl"></i>
               </div>
               <h4 className="text-md font-black uppercase tracking-widest">Shift Roster</h4>
           </div>
           <div className="grid grid-cols-2 gap-3">
              {technicians.map(t => (
                 <button 
                   key={t.name} 
                   onClick={(e) => { e.stopPropagation(); onToggleAttendance(t.name); }} 
                   className={`p-4 rounded-2xl border-2 font-bold text-[10px] uppercase tracking-wider transition-all ${t.isPresent ? 'bg-white text-slate-900 border-white shadow-xl' : 'bg-transparent text-slate-700 border-white/5 hover:border-white/10'}`}
                 >
                   {t.name}: {t.isPresent ? 'On Duty' : 'Off Duty'}
                 </button>
              ))}
           </div>
         </div>
      </div>

      {takeoverTarget && (
        <div className="fixed inset-0 bg-slate-950/95 z-[150] flex items-center justify-center p-8 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 text-center shadow-2xl">
             <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-inner"><i className="fas fa-hand-holding-heart"></i></div>
             <h3 className="text-xl font-black text-slate-900 mb-2">Assign Coverage</h3>
             <p className="text-[10px] font-bold text-slate-400 mb-8 uppercase px-4">{takeoverTarget} is offline. Who is covering Zone {technicians.find(t=>t.name===takeoverTarget)?.zone}?</p>
             <div className="space-y-3">
                {technicians.filter(t => t.isPresent && t.name !== takeoverTarget).map(t => (
                  <button key={t.name} onClick={() => { onTakeover(takeoverTarget, t.name); setTakeoverTarget(null); }} className="w-full py-4 bg-slate-900 rounded-xl font-bold text-white uppercase text-xs active:scale-95 shadow-lg">{t.name}</button>
                ))}
             </div>
             <button onClick={() => setTakeoverTarget(null)} className="mt-8 text-slate-300 hover:text-rose-500 text-[10px] font-bold uppercase transition-colors tracking-widest">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechView;
