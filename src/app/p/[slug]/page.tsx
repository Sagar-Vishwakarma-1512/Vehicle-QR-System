"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { QrCode, Mail, Lock, Loader2 } from "lucide-react";
import Link from "next/link";

export default function PartnerLoginPage() {
    const { slug } = useParams();
    const router = useRouter();
    const [partner, setPartner] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [loginLoading, setLoginLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchPartner = async () => {
            const { data, error } = await supabase
                .from('resellers')
                .select('*')
                .eq('custom_domain', slug)
                .single();

            if (data) {
                setPartner(data);
            }
            setLoading(false);
        };
        fetchPartner();
    }, [slug]);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoginLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.error || "Invalid credentials");

            localStorage.setItem("user", JSON.stringify(result.user));
            router.push("/admin/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoginLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" /></div>;

    if (!partner) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-bold">Portal not found.</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Dynamic Logo from Reseller Data */}
                <div className="flex flex-col items-center justify-center gap-4 mb-8 group">
                    <div className="bg-blue-600 p-4 rounded-[2rem] shadow-xl shadow-blue-100 group-hover:scale-105 transition duration-500">
                        {partner.logo_url ? (
                            <img src={partner.logo_url} alt={partner.business_name} className="w-12 h-12 object-contain invert brightness-0" />
                        ) : (
                            <QrCode className="text-white w-10 h-10" />
                        )}
                    </div>
                    <div className="text-center">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">{partner.business_name || "Admin Portal"}</h2>
                        <p className="text-blue-600 font-bold text-xs uppercase tracking-[0.2em] mt-1">Authorized Partner Portal</p>
                    </div>
                </div>

                {/* Card Styling matching main login */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100/50 p-10 border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
                    
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-black text-gray-900 mb-2">Welcome Back</h1>
                        <p className="text-gray-400 font-medium">Log in to your admin dashboard</p>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Email Address</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="admin@example.com"
                                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all font-bold text-gray-700"
                                />
                                <Mail className="w-5 h-5 text-gray-300 absolute left-4 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Password</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all font-bold text-gray-700"
                                />
                                <Lock className="w-5 h-5 text-gray-300 absolute left-4 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        <button
                            disabled={loginLoading}
                            className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 transition-all duration-300 shadow-xl shadow-gray-200 disabled:opacity-50"
                        >
                            {loginLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Access Dashboard"}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-10 text-gray-400 text-xs font-bold uppercase tracking-widest">
                    Powered by SafeDrive Infrastructure
                </p>
            </div>
        </div>
    );
}
