"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ShieldCheck,
    Globe,
    Palette,
    Zap,
    Loader2,
    CheckCircle2,
    UserCircle,
    Key,
    Mail,
    Plus,
    Link as LinkIcon
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function OnboardPartnerPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        password: "",
        business_name: "",
        slug: "", // Changed from custom_domain to slug
        brand_color: "#6366f1",
        qr_quota: 100
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Create User in 'users' table
            const password_hash = btoa(formData.password);
            const { data: userData, error: userError } = await supabase
                .from('users')
                .insert([{
                    email: formData.email,
                    full_name: formData.full_name,
                    password_hash: password_hash,
                    role: 'owner'   // owner = whitelabel admin with dashboard access
                }])
                .select()
                .single();

            if (userError) throw userError;

            // 2. Create Whitelabel Entry
            const { error: resellerError } = await supabase
                .from('resellers')
                .insert([{
                    user_id: userData.id,
                    business_name: formData.business_name,
                    custom_domain: formData.slug.toLowerCase().replace(/[^a-z0-9]/g, '-'), // Store slug in custom_domain field for now
                    brand_color: formData.brand_color,
                    qr_quota: formData.qr_quota,
                    status: 'active'
                }]);

            if (resellerError) throw resellerError;

            setSuccess(true);
            setTimeout(() => router.push("/super-admin/resellers"), 2000);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to onboard partner");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-2xl mx-auto py-24 text-center animate-fadeIn">
                <div className="w-24 h-24 bg-emerald-50 rounded-[3rem] flex items-center justify-center mx-auto mb-8 text-emerald-600 border border-emerald-100 shadow-xl shadow-emerald-50">
                    <CheckCircle2 size={48} />
                </div>
                <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Admin Onboarded!</h2>
                <p className="text-slate-500 text-lg font-medium">The whitelabel admin can now log in to their branded portal.</p>
                <div className="mt-12 flex items-center justify-center gap-3">
                    <Loader2 size={18} className="animate-spin text-slate-300" />
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Redirecting to admin list...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-24 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center gap-6">
                <Link href="/super-admin/resellers" className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition shadow-sm text-slate-400">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Onboard New Admin</h1>
                    <p className="text-slate-500 font-medium">Create a branded access portal for a new partner.</p>
                </div>
            </div>

            {error && (
                <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl text-rose-600 font-bold flex items-center gap-3">
                    <Zap size={20} className="fill-rose-600" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-10">
                {/* Account Details Section */}
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
                    
                    <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-50 relative z-10">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100">
                            <UserCircle size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Admin Identity</h2>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Primary Account Access</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 relative z-10">
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                                Full Name
                            </label>
                            <div className="relative">
                                <UserCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input
                                    type="text"
                                    required
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                    placeholder="e.g. Akash Kumar"
                                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-slate-900 font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                                Admin Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    placeholder="akash@gmail.com"
                                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-slate-900 font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-2.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                                Admin Password
                            </label>
                            <div className="relative">
                                <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    placeholder="••••••••••••"
                                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-slate-900 font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Branding Section */}
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
                    <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-50">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100">
                            <Palette size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Branding & Access</h2>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Whitelabel Customization</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                                Business Name
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.business_name}
                                onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                                placeholder="e.g. Akash Enterprise"
                                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                                Business URL Slug
                            </label>
                            <div className="relative">
                                <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input
                                    type="text"
                                    required
                                    value={formData.slug}
                                    onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                                    placeholder="akash"
                                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-slate-900 font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold ml-1">
                                Generated URL: <span className="text-indigo-500">domain.com/p/{formData.slug || 'slug'}</span>
                            </p>
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                                QR Generation Limit
                            </label>
                            <div className="relative">
                                <Zap className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.qr_quota || 0}
                                    onChange={(e) => setFormData({...formData, qr_quota: parseInt(e.target.value) || 0})}
                                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-slate-900 font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold ml-1">
                                <span className="text-indigo-500">Note:</span> Set to 0 for unlimited usage.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-200 flex items-center gap-3 disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                        Complete Onboarding
                    </button>
                </div>
            </form>
        </div>
    );
}

