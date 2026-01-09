
import React, { useState } from 'react';
import { Asset, Ticket, TicketStatus, TicketSeverity, Technician } from '../types';
import { suggestAssignment } from '../services/geminiService';

interface OpsViewProps {
    assets: Asset[];
    tickets: Ticket[];
    technicians: Technician[];
    onNewTicket: (ticket: Omit<Ticket, 'id' | 'timestamp'>) => void;
    onResolveTicket: (id: number) => void;
}

const OpsView: React.FC<OpsViewProps> = ({ assets, tickets, technicians, onNewTicket, onResolveTicket }) => {
    const [assetId, setAssetId] = useState('');
    const [description, setDescription] = useState('');
    const [assignedTech, setAssignedTech] = useState('Admin');
    const [severity, setSeverity] = useState(TicketSeverity.MINOR);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<any>(null);

    const selectedAsset = assets.find(a => a.id === parseInt(assetId));

    const handleAiAutoAssign = async () => {
        if (!description) return alert("Please enter fault description first.");
        setIsAiLoading(true);
        const suggestion = await suggestAssignment(description, technicians.filter(t => t.isPresent).map(t => t.name));
        setAiSuggestion(suggestion);
        setAssignedTech(suggestion.suggestedTech);
        setIsAiLoading(false);
    };

    const handleSubmit = () => {
        if (!selectedAsset || !description) return;
        onNewTicket({
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
        setAiSuggestion(null);
    };

    return (
        <div className="p-4 space-y-6 fade-in h-full overflow-y-auto pb-32">
            {/* Health Alert Container (Simplified demo) */}
            <div className="space-y-3">
                {assets.filter(a => a.status === 'Maintenance').slice(0, 2).map(a => (
                    <div key={a.id} className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-4 animate-pulse">
                        <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                        <div>
                            <h4 className="font-black text-red-800 uppercase">Critical Alert: {a.tag}</h4>
                            <p className="text-[10px] text-red-600 font-bold">Health below 40% - Action Required</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Report Issue Form */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xl font-black text-slate-900">Report Fault</h3>
                
                <div className="flex gap-2">
                    <input 
                        type="number" 
                        value={assetId}
                        onChange={(e) => setAssetId(e.target.value)}
                        placeholder="Enter Asset ID (e.g. 1-100)" 
                        className="flex-1 bg-slate-50 p-4 rounded-2xl font-bold text-sm outline-none border border-slate-100"
                    />
                </div>

                {selectedAsset && (
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex justify-between items-center">
                        <div>
                            <span className="font-black text-sm text-blue-900 block">{selectedAsset.brand}</span>
                            <span className="text-xs text-blue-700">{selectedAsset.location}</span>
                        </div>
                        <span className="text-xs bg-white text-blue-600 px-3 py-1 rounded-full font-mono font-bold border border-blue-200">{selectedAsset.tag}</span>
                    </div>
                )}

                <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3} 
                    placeholder="Describe the fault..." 
                    className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-sm outline-none border border-slate-100"
                />

                <div className="flex gap-2">
                    <select 
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value as TicketSeverity)}
                        className="bg-slate-100 p-3 rounded-2xl font-bold text-xs outline-none w-1/3"
                    >
                        <option value={TicketSeverity.MINOR}>Minor 🟡</option>
                        <option value={TicketSeverity.MAJOR}>Major 🔴</option>
                    </select>
                    <select 
                        value={assignedTech}
                        onChange={(e) => setAssignedTech(e.target.value)}
                        className="bg-slate-100 p-3 rounded-2xl font-bold text-xs outline-none flex-1"
                    >
                        <option value="Admin">Select Technician</option>
                        {technicians.map(t => (
                            <option key={t.name} value={t.name}>{t.isPresent ? '🟢' : '🔴'} {t.name}</option>
                        ))}
                    </select>
                    <button 
                        onClick={handleAiAutoAssign}
                        disabled={isAiLoading}
                        className="bg-slate-900 text-white px-4 rounded-2xl flex items-center justify-center disabled:opacity-50"
                    >
                        {isAiLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
                    </button>
                </div>

                {aiSuggestion && (
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] text-indigo-900 leading-tight">
                        <span className="font-bold block uppercase mb-1">✨ Gemini AI Insight</span>
                        {aiSuggestion.explanation} (Priority: <strong>{aiSuggestion.priority}</strong>)
                    </div>
                )}

                <button 
                    onClick={handleSubmit}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg shadow-slate-200 active:scale-95 transition-transform"
                >
                    Submit Ticket
                </button>
            </div>

            {/* Ticket List */}
            <div className="space-y-4">
                <h3 className="font-black text-slate-900 ml-1">Live Queue</h3>
                {tickets.filter(t => t.status !== TicketStatus.RESOLVED).map(t => (
                    <div key={t.id} className={`bg-white p-5 rounded-2xl border-l-4 ${t.severity === TicketSeverity.MAJOR ? 'border-red-600' : 'border-yellow-400'} shadow-sm`}>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase">{t.location} • {t.assetTag}</span>
                                <h4 className="font-bold text-slate-800">{t.details}</h4>
                            </div>
                            <span className="text-[9px] bg-slate-100 px-2 py-1 rounded-lg uppercase font-bold text-slate-600">{t.status}</span>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold">
                                <i className="fas fa-user-gear mr-1"></i> {t.assignedTo}
                            </span>
                            <button 
                                onClick={() => onResolveTicket(t.id)}
                                className="text-xs font-black text-green-600 hover:text-green-700 bg-green-50 px-3 py-1 rounded-xl border border-green-200"
                            >
                                Mark Resolved
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OpsView;
