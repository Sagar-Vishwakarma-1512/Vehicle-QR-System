"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    ShieldCheck,
    Loader2,
    ChevronRight,
    UserCircle
} from "lucide-react";

const navItems = [
    { icon: <LayoutDashboard size={18} />, label: "Platform Overview", href: "/super-admin/dashboard" },
    { icon: <Users size={18} />, label: "Whitelabel Partners", href: "/super-admin/resellers" },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [checking, setChecking] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (!stored) {
            router.replace("/login");
            return;
        }
        const parsed = JSON.parse(stored);
        
        // No redirect for admin/super-admin to allow dual-role management
        setUser(parsed);
        setChecking(false);
    }, []);

    const logout = () => {
        localStorage.removeItem("user");
        router.push("/login");
    };

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 lg:translate-x-0 flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
                {/* Logo Area */}
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                            <ShieldCheck size={22} className="text-white" />
                        </div>
                        <div>
                            <p className="font-black text-lg tracking-tight text-slate-900">Platform</p>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]">Super Admin</p>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-6 space-y-2">
                    {navItems.map((item) => {
                        const active = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                                    active 
                                    ? "bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100" 
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                            >
                                {item.icon}
                                {item.label}
                                {active && <ChevronRight size={14} className="ml-auto" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Account Actions */}
                <div className="p-6 border-t border-slate-100 space-y-3">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-rose-600 hover:bg-rose-50"
                    >
                        <LogOut size={16} />
                        Logout Session
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Header */}
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-50 rounded-xl">
                            <Menu size={22} className="text-slate-600" />
                        </button>
                        <div className="hidden md:block">
                            <h2 className="text-sm font-bold text-slate-900 leading-tight">
                                {navItems.find(n => pathname === n.href || pathname.startsWith(n.href + "/"))?.label || "Platform Control"}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Control Center</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-black text-slate-900">{user?.full_name || "Panda"}</p>
                            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-tighter">Platform Super Admin</p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                            <UserCircle size={24} />
                        </div>
                    </div>
                </header>

                {/* Page View */}
                <main className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

