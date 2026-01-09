
import React, { useState, useEffect, useMemo } from 'react';
import { Asset, Ticket, TicketStatus, TicketSeverity, Technician, AssetStatus } from '../types';
import { suggestAssignment } from '../services/geminiService';

interface OpsViewProps {
  assets: Asset[];
  tickets: Ticket[];
  technicians: Technician[];
  onNewTicket: (ticket: Omit<Ticket, 'id' | 'timestamp'>) => void;
  onResolveTicket: (id: number, res: { type: 'Minor' | 'Major', details: string, faultType?: string, gas?: string, amount?: number, technicianName: string }) => void;
  prefillAssetId?: string;
}

const OpsView: React.FC<OpsViewProps> = ({ assets, tickets, technicians, onNewTicket, onResolveTicket, prefillAssetId }) => {
  const [assetId, setAssetId] = useState(prefillAssetId || '');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(TicketSeverity.MINOR);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{suggestedTech: string, priority: string, explanation: string} | null>(null);

  const [resolvingTicket, setResolvingTicket] = useState<Ticket | null>(null);
  const [resStep, setResStep] = useState(1);
  const [resolverName, setResolverName] = useState('');
  const [gasType, setGasType] = useState('R22');
  const [gasAmount, setGasAmount] = useState('');

  useEffect(() => { if (prefillAssetId) setAssetId(prefillAssetId); }, [prefillAssetId]);

  const selectedAsset = assets.find(a => String(a.id) === assetId);

  const handleAiAnalyze = async () => {
    if (!description || !selectedAsset) return;
    setIsAnalyzing(true);
    try {
      const activeTechNames = technicians.filter(t => t.isPresent).map(t => t.name);
      const res = await suggestAssignment(description, activeTechNames);
      setAiAnalysis(res);
      if (res.priority === 'High') setSeverity(TicketSeverity.MAJOR);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAutoAssignSubmit = async () => {
    if (!selectedAsset || !description) return alert("System requires Asset ID and Fault Narrative.");
    setIsSubmitting(true);
    
    // Auto-assignment Logic:
    // 1. Identify present technicians.
    // 2. Prioritize technicians in the asset's zone.
    // 3. Among them, pick the one with the fewest active tickets (Load Balancing).
    // 4. If no one in zone, pick the least loaded tech overall.
    const presentTechs = technicians.filter(t => t.isPresent);
    if (presentTechs.length === 0) {
        setIsSubmitting(false);
        return alert("No technicians currently logged in for duty.");
    }

    const techLoads = presentTechs.map(tech => ({
        name: tech.name,
        zone: tech.zone,
        load: tickets.filter(t => t.assignedTo === tech.name && t.status !== TicketStatus.RESOLVED).length
    }));

    const zoneTechs = techLoads.filter(t => t.zone === selectedAsset.zone);
    let assignedTech = '';

    if (zoneTechs.length > 0) {
        zoneTechs.sort((a, b) => a.load - b.load);
        assignedTech = zoneTechs[0].name;
    } else {
        techLoads.sort((a, b) => a.load - b.load);
        assignedTech = techLoads[0].name;
    }

    try {
      await onNewTicket({
        assetTag: selectedAsset.tag,
        assetId: selectedAsset.id,
        location: selectedAsset.location,
        details: description,
        status: TicketStatus.OPEN,
        severity: severity,
        assignedTo: assignedTech,
      });
      setAssetId('');
      setDescription('');
      setSeverity(TicketSeverity.MINOR);
      setAiAnalysis(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const liveTickets = tickets.filter(t => t.status !== TicketStatus.RESOLVED && t.location !== 'Admin Panel');

  return (
    <div className="p-8 space-y-10 h-full overflow-y-auto pb-48 hide-scroll bg-slate-50 fade-in">
      <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-50 shadow-sm space-y-10">
        <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Job <span className="text-indigo-600">Dispatch</span></h3>
        
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Unit Identifier</label>
          <div className="relative">
            <input 
              type="number" 
              value={assetId} 
              onChange={(e) => setAssetId(e.target.value)} 
              placeholder="Enter Asset ID..." 
              className="w-full bg-slate-50 p-8 rounded-3xl font-black text-4xl outline-none border-2 border-slate-50 focus:border-indigo-500 transition-all shadow-inner text-slate-900" 
            />
            <div className="absolute right-8 top-1/2 -translate-y-1/2">
              {selectedAsset ? <i className="fas fa-circle-check text-emerald-500 text-3xl"></i> : <i className="fas fa-qrcode text-slate-200 text-3xl"></i>}
            </div>
          </div>
        </div>

        {selectedAsset && (
          <div className="bg-slate-950 p-8 rounded-[2rem] flex justify-between items-center fade-in shadow-2xl border border-white/5">
            <div>
               <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                  <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">{selectedAsset.tag}</span>
               </div>
               <span className="font-black text-white text-xl block tracking-tight uppercase leading-none">{selectedAsset.brand}</span>
               <span className="text-[10px] text-slate-500 font-bold uppercase mt-2 block">{selectedAsset.location} • {selectedAsset.room}</span>
            </div>
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white text-2xl border border-white/5 shadow-inner"><i className="fas fa-microchip"></i></div>
          </div>
        )}

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Fault Narrative</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            onBlur={handleAiAnalyze}
            rows={3} 
            placeholder="Describe technical issue..." 
            className="w-full bg-slate-50 p-8 rounded-3xl font-black text-lg outline-none border-2 border-slate-50 focus:border-indigo-500 transition-all shadow-inner resize-none text-slate-900" 
          />
        </div>

        {aiAnalysis && (
            <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 fade-in">
                <div className="flex items-center gap-3 mb-2">
                    <i className="fas fa-sparkles text-indigo-600"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">AI Diagnostic Suggestion</span>
                </div>
                <p className="text-xs font-bold text-slate-800 leading-relaxed mb-3">"{aiAnalysis.explanation}"</p>
                <div className="flex gap-4">
                    <div className="flex-1 bg-white p-3 rounded-xl shadow-sm border border-indigo-50">
                        <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Target Specialist</span>
                        <span className="text-[10px] font-black text-indigo-600 uppercase">{aiAnalysis.suggestedTech}</span>
                    </div>
                    <div className="flex-1 bg-white p-3 rounded-xl shadow-sm border border-indigo-50">
                        <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">AI Priority</span>
                        <span className={`text-[10px] font-black uppercase ${aiAnalysis.priority === 'High' ? 'text-rose-600' : 'text-emerald-600'}`}>{aiAnalysis.priority}</span>
                    </div>
                </div>
            </div>
        )}
        
        <div className="grid grid-cols-2 gap-5">
          <button 
            onClick={() => setSeverity(TicketSeverity.MINOR)} 
            className={`py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all shadow-sm ${severity === TicketSeverity.MINOR ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-50 text-slate-300'}`}
          >
            Routine
          </button>
          <button 
            onClick={() => setSeverity(TicketSeverity.MAJOR)} 
            className={`py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all shadow-sm ${severity === TicketSeverity.MAJOR ? 'bg-rose-600 border-rose-600 text-white shadow-xl shadow-rose-100' : 'bg-white border-slate-50 text-slate-300'}`}
          >
            Critical
          </button>
        </div>

        <button 
          disabled={isSubmitting || !selectedAsset} 
          onClick={handleAutoAssignSubmit} 
          className={`w-full py-7 rounded-[2rem] font-black text-xl shadow-2xl transition-all ${isSubmitting || !selectedAsset ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-indigo-600 text-white active:scale-95 uppercase tracking-[0.2em]'}`}
        >
          {isSubmitting ? 'Syncing...' : 'Deploy Specialist'}
        </button>
      </div>

      <div className="space-y-8 pb-32">
        <div className="flex justify-between items-center px-4">
           <h3 className="font-black text-slate-900 text-2xl tracking-tighter uppercase italic">Live <span className="text-indigo-600">Workflow</span></h3>
           <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-2xl">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
              <span className="text-indigo-700 text-[10px] font-black uppercase tracking-widest">{liveTickets.length} Active</span>
           </div>
        </div>
        
        <div className="grid gap-6">
          {liveTickets.length === 0 ? (
            <div className="bg-white p-20 rounded-[3.5rem] border-2 border-dashed border-slate-100 text-center">
               <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <i className="fas fa-shield-check text-slate-200 text-5xl"></i>
               </div>
               <p className="text-slate-400 font-black text-sm uppercase tracking-widest">Global Queue Clear</p>
            </div>
          ) : (
            liveTickets.map(t => (
              <div key={t.id} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-sm relative overflow-hidden transition-all hover:border-indigo-100 group">
                <div className={`absolute top-0 left-0 w-2 h-full ${t.severity === TicketSeverity.MAJOR ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-indigo-600'}`}></div>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">{t.assetTag}</span>
                       <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                       <span className="text-[9px] font-black text-slate-400 uppercase">{t.location}</span>
                    </div>
                    <h4 className="font-black text-slate-900 text-lg leading-snug tracking-tight uppercase italic group-hover:text-indigo-600 transition-colors">{t.details}</h4>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${t.severity === TicketSeverity.MAJOR ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-50 text-slate-400'}`}>
                    {t.severity}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-8 pt-8 border-t border-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-sm uppercase shadow-lg group-hover:scale-110 transition-transform">{t.assignedTo.substring(0,2)}</div>
                    <div>
                      <span className="text-sm font-black text-slate-900 block leading-none uppercase tracking-tight">{t.assignedTo}</span>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Operator Assign</p>
                    </div>
                  </div>
                  <button onClick={() => { setResolvingTicket(t); setResStep(1); }} className="px-8 py-3 bg-emerald-500 text-white text-[10px] font-black rounded-2xl shadow-xl shadow-emerald-100 active:scale-95 transition-all uppercase tracking-widest border-2 border-emerald-400/20">Finalize</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {resolvingTicket && (
        <div className="fixed inset-0 bg-slate-950/98 z-[100] backdrop-blur-3xl flex items-center justify-center p-8 fade-in">
          <div className="bg-white w-full max-w-sm rounded-[4rem] p-12 shadow-2xl relative text-center border-8 border-slate-900">
            <button onClick={() => setResolvingTicket(null)} className="absolute top-8 right-8 text-slate-300 active:scale-90 transition-transform"><i className="fas fa-times text-2xl"></i></button>
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-8 shadow-inner border border-emerald-100">
               <i className="fas fa-clipboard-check"></i>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-8 uppercase italic tracking-tighter">Auth <span className="text-indigo-600">Resolve</span></h3>
            
            {resStep === 1 && (
              <div className="space-y-6 fade-in">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Confirm Authorized User</p>
                <div className="grid grid-cols-2 gap-4">
                    {technicians.filter(t => t.isPresent).map(t => (
                        <button key={t.name} onClick={() => { setResolverName(t.name); setResStep(2); }} className={`py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest border-2 transition-all ${resolverName === t.name ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-100'}`}>{t.name}</button>
                    ))}
                </div>
              </div>
            )}

            {resStep === 2 && (
              <div className="space-y-5 fade-in">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Incident Classification</p>
                <button 
                  onClick={() => { onResolveTicket(resolvingTicket.id, { type: 'Minor', details: 'System adjustment successful', technicianName: resolverName }); setResolvingTicket(null); }} 
                  className="w-full py-6 rounded-2xl bg-indigo-50 text-indigo-700 font-black text-[11px] uppercase tracking-widest shadow-sm border-2 border-indigo-100 active:scale-95 transition-all"
                >
                  Standard Correction
                </button>
                <button 
                  onClick={() => setResStep(3)} 
                  className="w-full py-6 rounded-2xl bg-rose-50 text-rose-700 font-black text-[11px] uppercase tracking-widest shadow-sm border-2 border-rose-100 active:scale-95 transition-all"
                >
                  Complex Overhaul
                </button>
                <button onClick={() => setResStep(1)} className="w-full text-[9px] font-black text-slate-300 uppercase tracking-widest underline mt-8 transition-colors hover:text-indigo-600">Back to Specialists</button>
              </div>
            )}

            {resStep === 3 && (
              <div className="space-y-5 fade-in text-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Logistics Deployment</p>
                 <button onClick={() => { onResolveTicket(resolvingTicket.id, { type: 'Major', details: 'Component integrity restored', technicianName: resolverName }); setResolvingTicket(null); }} className="w-full py-6 rounded-2xl bg-slate-900 text-white font-black uppercase text-[11px] tracking-widest shadow-2xl active:scale-95 transition-all">Mech-Service Log</button>
                 <button onClick={() => setResStep(4)} className="w-full py-6 rounded-2xl bg-indigo-600 text-white font-black uppercase text-[11px] tracking-widest shadow-2xl active:scale-95 transition-all">Supplies Replenish</button>
                 <button onClick={() => setResStep(2)} className="mt-8 w-full text-[9px] font-black text-slate-300 uppercase tracking-widest underline transition-colors hover:text-indigo-600">Back to Status</button>
              </div>
            )}

            {resStep === 4 && (
              <div className="space-y-8 fade-in text-left">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Cylinder Matrix</label>
                  <select value={gasType} onChange={(e) => setGasType(e.target.value)} className="w-full bg-slate-50 p-6 rounded-2xl font-black border-2 border-slate-50 text-center appearance-none outline-none focus:border-indigo-500 text-slate-900 shadow-inner">
                    <option value="R22">R22</option>
                    <option value="R410A">R410A</option>
                    <option value="R32">R32</option>
                    <option value="R134a">R134a</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Net Usage (KG)</label>
                  <input type="number" value={gasAmount} onChange={(e) => setGasAmount(e.target.value)} className="w-full bg-slate-50 p-8 rounded-[2rem] font-black text-5xl text-center outline-none border-4 border-slate-50 text-indigo-600 shadow-inner focus:border-indigo-500 transition-all" placeholder="0.0" />
                </div>
                <button 
                  onClick={() => { 
                    onResolveTicket(resolvingTicket.id, { 
                      type: 'Major', 
                      details: `Pressure Recharge (${gasType}): ${gasAmount}kg`, 
                      technicianName: resolverName,
                      gas: gasType, 
                      amount: parseFloat(gasAmount) 
                    }); 
                    setResolvingTicket(null); 
                  }} 
                  className="w-full py-7 bg-slate-950 text-white rounded-[2rem] font-black active:scale-95 transition-all uppercase text-[11px] tracking-[0.2em] shadow-2xl border border-white/10"
                >
                  Sync Resolution
                </button>
                <button onClick={() => setResStep(3)} className="w-full text-[9px] font-black text-slate-300 uppercase tracking-widest underline text-center mt-6 transition-colors hover:text-indigo-600">Abort Protocol</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OpsView;
