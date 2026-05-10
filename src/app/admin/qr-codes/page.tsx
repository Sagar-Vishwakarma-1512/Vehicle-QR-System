"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
    Plus, 
    Search, 
    Filter, 
    Download, 
    Eye, 
    Loader2, 
    Package, 
    CheckSquare, 
    Ban, 
    Trash2, 
    ExternalLink, 
    FileDown, 
    Wand2,
    Play,
    AlertCircle,
    CheckCircle2,
    Check
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function QrCodesPage() {
    const [qrCodes, setQrCodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [search, setSearch] = useState("");
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkQty, setBulkQty] = useState(10);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [alertModal, setAlertModal] = useState<{show: boolean, type: 'error' | 'success', title: string, message: string}>({
        show: false, type: 'error', title: '', message: ''
    });

    // Lock scroll when modal is open
    useEffect(() => {
        if (showBulkModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [showBulkModal]);
    const router = useRouter();

    const fetchQrCodes = async () => {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
            setLoading(false);
            return;
        }
        const user = JSON.parse(userStr);

        try {
            const { data, error } = await supabase
                .from('qr_codes')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setQrCodes(data);
        } catch (err) {
            console.error("Error fetching QR codes:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQrCodes();
    }, []);

    const handleGenerate = async (quantity: number = 1) => {
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        const user = JSON.parse(userStr);

        setGenerating(true);
        try {
            const response = await fetch("/api/qr/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: user.id,
                    quantity: quantity
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Generation failed");

            await fetchQrCodes();
            setShowBulkModal(false);
            setAlertModal({
                show: true,
                type: 'success',
                title: 'Success!',
                message: `Successfully generated ${quantity} QR Code(s)!`
            });
        } catch (err: any) {
            setAlertModal({
                show: true,
                type: 'error',
                title: 'Generation Failed',
                message: err.message
            });
        } finally {
            setGenerating(false);
        }
    };

    const handleBulkGenerate = async () => {
        setShowBulkModal(false);
        await handleGenerate(bulkQty);
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase.from('qr_codes').delete().eq('id', id);
            if (error) throw error;
            setQrCodes(prev => prev.filter(q => q.id !== id));
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
            setAlertModal({
                show: true,
                type: 'success',
                title: 'Deleted Successfully',
                message: `The QR Code has been deleted.`
            });
        } catch (err: any) {
            setAlertModal({
                show: true,
                type: 'error',
                title: 'Delete Failed',
                message: err.message
            });
        }
    };

    const handleBulkDelete = async () => {
        const count = selectedIds.length;
        if (count === 0) return;
        
        try {
            const { error } = await supabase.from('qr_codes').delete().in('id', selectedIds);
            if (error) throw error;
            setQrCodes(prev => prev.filter(q => !selectedIds.includes(q.id)));
            setSelectedIds([]);
            setAlertModal({
                show: true,
                type: 'success',
                title: 'Deleted Successfully',
                message: `Successfully deleted ${count} QR Code(s).`
            });
        } catch (err: any) {
            setAlertModal({
                show: true,
                type: 'error',
                title: 'Delete Failed',
                message: err.message
            });
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'paused' : 'active';
        try {
            const { error } = await supabase
                .from('qr_codes')
                .update({ status: newStatus })
                .eq('id', id);
            if (error) throw error;
            setQrCodes(prev => prev.map(q => q.id === id ? { ...q, status: newStatus } : q));
        } catch (err: any) {
            alert("Error: " + err.message);
        }
    };

    const handleDownload = (url: string, filename: string) => {
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filtered = qrCodes.filter(qr => 
        qr.qr_unique_id?.toLowerCase().includes(search.toLowerCase()) ||
        qr.vehicle_number?.toLowerCase().includes(search.toLowerCase())
    );

    const getDisplayId = (uniqueId: string) => {
        if (!uniqueId) return "";
        const parts = uniqueId.split('-');
        if (parts.length > 1) return `#${parts[parts.length - 1]}`;
        return `#${uniqueId}`;
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-20 bg-white">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">QR Code Tags</h1>
                    <p className="text-slate-500 mt-1 font-medium text-sm">Manage all your vehicle safety tags and their settings.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowBulkModal(true)}
                        disabled={generating}
                        className="flex items-center gap-2 bg-[#F1F5F9] text-slate-700 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition disabled:opacity-50"
                    >
                        <Package size={16} />
                        Bulk Generate
                    </button>
                    <button
                        onClick={() => handleGenerate(1)}
                        disabled={generating}
                        className="flex items-center gap-2 bg-[#2563EB] text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-200 disabled:opacity-50"
                    >
                        {generating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                        {generating ? "Generating..." : "Create New QR"}
                    </button>
                </div>
            </div>

            {/* Search Row */}
            <div className="flex flex-col md:flex-row gap-4 items-center px-2">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by QR code number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[#f8fafc] border border-slate-100 pl-14 pr-6 py-4 rounded-[2rem] text-slate-900 font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-blue-50 outline-none transition"
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                        onClick={() => {
                            if (selectedIds.length === filtered.length && filtered.length > 0) {
                                setSelectedIds([]);
                            } else {
                                setSelectedIds(filtered.map(qr => qr.id));
                            }
                        }}
                        className={`flex items-center justify-center gap-2 border px-6 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest transition shadow-sm ${selectedIds.length === filtered.length && filtered.length > 0 ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'}`}
                    >
                        <CheckSquare size={16} className={selectedIds.length === filtered.length && filtered.length > 0 ? 'text-blue-500' : 'text-slate-400'} />
                        {selectedIds.length === filtered.length && filtered.length > 0 ? 'Deselect All' : 'Select All'}
                    </button>
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="bg-slate-900 text-white rounded-[2rem] p-4 px-6 flex items-center justify-between shadow-xl animate-fadeIn mx-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-black text-lg">
                            {selectedIds.length}
                        </div>
                        <span className="font-bold text-sm tracking-widest uppercase text-slate-300">Selected</span>
                    </div>
                    <button 
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition"
                    >
                        <Trash2 size={16} />
                        Delete Selected
                    </button>
                </div>
            )}

            {/* Grid */}
            {loading ? (
                <div className="min-h-[400px] flex items-center justify-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-2">
                    {filtered.map((qr, index) => {
                        const isUnassigned = !qr.is_activated;
                        const isActive = qr.status === 'active';
                        return (
                            <div key={qr.id} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] p-6 flex flex-col items-center relative">
                                
                                {/* Top Badges */}
                                <div className="w-full flex justify-between items-start mb-4">
                                    <div className="flex-1 text-left">
                                        {index === 0 && (
                                            <div className="inline-flex items-center gap-2 bg-[#2563EB] text-white pl-2 pr-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                Latest Batch
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] pt-1 text-center">QR Preview</span>
                                    <div className="flex-1 flex justify-end">
                                        {!isUnassigned && (
                                            <div className={`flex items-center gap-1.5 ${isActive ? 'bg-[#10B981]' : 'bg-slate-400'} text-white pl-2 pr-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-colors`}>
                                                <div className="w-1 h-1 bg-white rounded-full"></div>
                                                {isActive ? 'Active' : 'Paused'}
                                            </div>
                                        )}
                                        <div 
                                            onClick={() => {
                                                setSelectedIds(prev => 
                                                    prev.includes(qr.id) ? prev.filter(id => id !== qr.id) : [...prev, qr.id]
                                                );
                                            }}
                                            className={`w-7 h-7 rounded-full border flex items-center justify-center ml-2 cursor-pointer transition-colors ${selectedIds.includes(qr.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 hover:border-blue-400'}`}
                                        >
                                            {selectedIds.includes(qr.id) && <Check size={14} strokeWidth={4} />}
                                        </div>
                                    </div>
                                </div>

                                {/* QR Image */}
                                <div className="w-48 h-48 border-[1.5px] border-[#10B981] rounded-[2rem] p-4 flex items-center justify-center mb-6 bg-white relative">
                                    <img 
                                        src={qr.qr_image_url} 
                                        alt="QR Code" 
                                        className="w-full h-full object-contain"
                                    />
                                </div>

                                {/* Serial */}
                                <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">
                                    {getDisplayId(qr.qr_unique_id)}
                                </h3>

                                {/* Info Box */}
                                <div className={`w-full rounded-[1.8rem] p-5 text-center border mb-6 ${isUnassigned ? 'bg-[#FFFBEB] border-amber-100' : 'bg-[#F0FDF4] border-[#DCFCE7]'}`}>
                                    {isUnassigned ? (
                                        <div className="py-1">
                                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1">● UNASSIGNED</p>
                                            <p className="text-[9px] font-bold text-slate-400">Ready for activation</p>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-[9px] font-black text-[#10B981] uppercase tracking-[0.2em] mb-1">Vehicle</p>
                                            <h4 className="text-lg font-black text-slate-900 mb-1 leading-tight">{qr.vehicle_number}</h4>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                Owner: <span className="text-slate-500">{qr.owner_name}</span>
                                            </p>
                                        </>
                                    )}
                                </div>

                                {/* Action Buttons Row */}
                                <div className="w-full flex items-center gap-2">
                                    <Link 
                                        href={`/admin/qr-codes/${qr.qr_unique_id}`}
                                        className={`flex-1 ${isUnassigned ? 'bg-[#2563EB] shadow-blue-100' : 'bg-[#059669] shadow-emerald-100'} text-white flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition shadow-lg`}
                                    >
                                        {isUnassigned ? <Wand2 size={14} /> : <Eye size={14} />}
                                        {isUnassigned ? 'Setup' : 'View'}
                                    </Link>
                                    
                                    {!isUnassigned && (
                                        <button 
                                            onClick={() => handleToggleStatus(qr.id, qr.status)}
                                            className={`w-12 h-12 ${isActive ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'} flex items-center justify-center rounded-xl hover:scale-105 transition border ${isActive ? 'border-rose-100' : 'border-emerald-100'}`}
                                            title={isActive ? "Pause QR" : "Activate QR"}
                                        >
                                            {isActive ? <Ban size={18} /> : <Play size={18} />}
                                        </button>
                                    )}

                                    <button 
                                        onClick={() => handleDownload(qr.qr_image_url, qr.qr_unique_id)}
                                        className="flex-1 bg-[#0F172A] text-white flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition shadow-lg shadow-slate-200"
                                    >
                                        <FileDown size={14} />
                                        Export
                                    </button>

                                    <button 
                                        onClick={() => handleDelete(qr.id)}
                                        className="w-12 h-12 bg-rose-50 text-rose-500 flex items-center justify-center rounded-xl hover:bg-rose-100 transition border border-rose-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Bulk Generate Modal — rendered via Portal to bypass overflow-hidden */}
            {showBulkModal && typeof window !== 'undefined' && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 99999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {/* Backdrop */}
                    <div
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                        onClick={() => setShowBulkModal(false)}
                    />
                    {/* Dialog */}
                    <div style={{ position: 'relative', background: 'white', borderRadius: '1.5rem', padding: '2rem', width: '380px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
                        <h3 style={{ fontWeight: 900, fontSize: '1.25rem', color: '#0f172a', marginBottom: '4px' }}>Bulk Generate</h3>
                        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>How many QR codes? (max 100)</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <button
                                onClick={() => setBulkQty(q => Math.max(1, q - 1))}
                                style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#f1f5f9', border: 'none', fontSize: '1.5rem', fontWeight: 900, cursor: 'pointer' }}
                            >−</button>
                            <input
                                type="number"
                                min={1}
                                max={100}
                                value={bulkQty}
                                onChange={(e) => setBulkQty(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                                style={{ flex: 1, border: '2px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem', fontSize: '1.75rem', fontWeight: 900, textAlign: 'center', outline: 'none' }}
                            />
                            <button
                                onClick={() => setBulkQty(q => Math.min(100, q + 1))}
                                style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#f1f5f9', border: 'none', fontSize: '1.5rem', fontWeight: 900, cursor: 'pointer' }}
                            >+</button>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={() => setShowBulkModal(false)}
                                style={{ flex: 1, padding: '0.875rem', borderRadius: '10px', background: '#f1f5f9', border: 'none', fontWeight: 900, fontSize: '0.875rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkGenerate}
                                disabled={generating}
                                style={{ flex: 1, padding: '0.875rem', borderRadius: '10px', background: '#2563eb', border: 'none', fontWeight: 900, fontSize: '0.875rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', opacity: generating ? 0.6 : 1 }}
                            >
                                {generating && <Loader2 size={16} className="animate-spin" />}
                                Generate {bulkQty}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Alert Modal */}
            {alertModal.show && typeof window !== 'undefined' && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 999999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <div
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                        onClick={() => setAlertModal(prev => ({ ...prev, show: false }))}
                    />
                    <div style={{ position: 'relative', background: 'white', borderRadius: '1.5rem', padding: '2rem', width: '380px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                            {alertModal.type === 'error' ? (
                                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <AlertCircle size={32} />
                                </div>
                            ) : (
                                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CheckCircle2 size={32} />
                                </div>
                            )}
                        </div>
                        <h3 style={{ fontWeight: 900, fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.5rem' }}>{alertModal.title}</h3>
                        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5 }}>{alertModal.message}</p>
                        <button
                            onClick={() => setAlertModal(prev => ({ ...prev, show: false }))}
                            style={{ width: '100%', padding: '0.875rem', borderRadius: '10px', background: alertModal.type === 'error' ? '#ef4444' : '#10b981', border: 'none', fontWeight: 900, fontSize: '0.875rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'white' }}
                        >
                            Understood
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}