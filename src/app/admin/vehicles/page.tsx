"use client";

import { useState, useEffect, useRef } from "react";
import {
    Car,
    Search,
    Filter,
    Plus,
    MoreVertical,
    ExternalLink,
    ChevronRight,
    ShieldCheck,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { QRCode } from "@/types";

export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState<QRCode[]>([]);
    const [filteredVehicles, setFilteredVehicles] = useState<QRCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>("all");
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [openActionId, setOpenActionId] = useState<string | null>(null);
    const actionMenuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
                setOpenActionId(null);
            }
        };
        if (openActionId) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openActionId]);

    useEffect(() => {
        const fetchVehicles = async () => {
            const userStr = localStorage.getItem("user");
            if (!userStr) {
                setLoading(false);
                return;
            }
            const user = JSON.parse(userStr);

            const { data, error } = await supabase
                .from('qr_codes')
                .select('*')
                .eq('user_id', user.id) // DATA ISOLATION FIX
                .order('created_at', { ascending: false });

            if (data) {
                setVehicles(data as QRCode[]);
                setFilteredVehicles(data as QRCode[]);
            }
            setLoading(false);
        };

        fetchVehicles();
    }, []);

    // Filter vehicles
    useEffect(() => {
        let result = vehicles;
        if (filterType === "active") {
            result = result.filter(v => v.status === "active");
        } else if (filterType === "paused") {
            result = result.filter(v => v.status === "paused");
        } else if (filterType !== "all") {
            result = result.filter(v => v.vehicle_type === filterType);
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(v =>
                (v.vehicle_number || "").toLowerCase().includes(query) ||
                (v.owner_name || "").toLowerCase().includes(query)
            );
        }
        setFilteredVehicles(result);
    }, [filterType, searchQuery, vehicles]);

    return (
        <div className="space-y-8 animate-fadeIn pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Vehicle Management</h1>
                    <p className="text-slate-500 mt-1 font-medium">Monitoring your isolated fleet.</p>
                </div>
                <Link href="/admin/qr-codes" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition shadow-xl shadow-indigo-100">
                    + Add New Vehicle
                </Link>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <input
                        type="text"
                        placeholder="Search your vehicles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 transition outline-none font-bold"
                    />
                    <Search className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" /></div>
                ) : filteredVehicles.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white border-2 border-dashed border-slate-100 rounded-[40px]">
                        <Car size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">No vehicles registered</p>
                    </div>
                ) : (
                    filteredVehicles.map((vh) => (
                        <div key={vh.id} className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-sm hover:shadow-xl transition-all group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Car size={28} />
                                </div>
                                <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full ${vh.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {vh.status}
                                </span>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-1">{vh.vehicle_number || "NO PLATE"}</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">{vh.vehicle_make || "Brand"} {vh.vehicle_model || "Model"}</p>
                            
                            <div className="pt-6 border-t border-slate-50 space-y-4">
                                <div className="flex justify-between items-center text-sm font-bold">
                                    <span className="text-slate-400">Owner</span>
                                    <span className="text-slate-900">{vh.owner_name || "New Customer"}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-bold">
                                    <span className="text-slate-400">Contact</span>
                                    <span className="text-slate-900">{vh.owner_mobile || "N/A"}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
