"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
    ArrowLeft, 
    QrCode, 
    Loader2, 
    Sparkles, 
    CheckCircle2, 
    Download,
    ExternalLink,
    Settings
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function CreateQrPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [generatedCode, setGeneratedCode] = useState<any>(null);
    const [count, setCount] = useState(1);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const userStr = localStorage.getItem("user");
            if (!userStr) throw new Error("User not found");
            const user = JSON.parse(userStr);

            // Call the generation API
            const response = await fetch("/api/qr/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: user.id,
                    quantity: count
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Generation failed");

            setGeneratedCode(data.qr_codes[0]);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-10 px-4">
            <div className="mb-8 flex items-center gap-4">
                <Link href="/admin/qr-codes" className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-900">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Generate QR</h1>
                    <p className="text-slate-500 font-medium">Create new vehicle safety tags for your fleet.</p>
                </div>
            </div>

            {!generatedCode ? (
                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-2xl shadow-slate-100 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 text-blue-600">
                        <QrCode size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Ready to generate?</h3>
                    <p className="text-slate-500 font-medium mb-8 max-w-sm">New QR codes will be added to your account and can be activated later by assigning them to vehicles.</p>
                    
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-100 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                        {loading ? "Generating..." : "Generate Now"}
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-2xl shadow-slate-100 flex flex-col items-center text-center animate-fadeIn">
                    <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6 text-emerald-600">
                        <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Successfully Generated!</h3>
                    <p className="text-slate-500 font-medium mb-8">Your new QR code tag is ready to be assigned.</p>
                    
                    <div className="w-48 h-48 border-[1.5px] border-emerald-100 rounded-3xl p-4 flex items-center justify-center mb-8 bg-[#F0FDF4]">
                        <img 
                            src={generatedCode.qr_image_url} 
                            alt="Generated QR" 
                            className="w-full h-full object-contain"
                        />
                    </div>

                    <div className="flex flex-col w-full gap-3">
                        <button 
                            onClick={() => window.location.href = `/admin/qr-codes/${generatedCode.qr_unique_id}`}
                            className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition flex items-center justify-center gap-2"
                        >
                            <Settings size={16} /> Setup Vehicle Now
                        </button>
                        <Link 
                            href="/admin/qr-codes"
                            className="w-full bg-slate-50 text-slate-600 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition text-center"
                        >
                            Back to All Tags
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
