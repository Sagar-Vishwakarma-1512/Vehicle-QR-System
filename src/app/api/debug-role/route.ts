export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// TEMPORARY DEBUG ROUTE - DELETE AFTER FIXING
// Visit: /api/debug-role?email=codewithpanda28@gmail.com on Vercel to see role
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
        return NextResponse.json({ error: "Pass ?email=youremail in URL" });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { data: user, error } = await supabase
        .from('users')
        .select('id, email, role, full_name, created_at')
        .ilike('email', email.trim().toLowerCase())
        .single();

    return NextResponse.json({
        env_check: {
            supabase_url: supabaseUrl || "NOT SET ❌",
            anon_key_present: hasKey ? "YES ✅" : "NOT SET ❌",
        },
        db_result: {
            user_found: !!user,
            role: user?.role || null,
            email: user?.email || null,
            full_name: user?.full_name || null,
        },
        db_error: error?.message || null,
    });
}
