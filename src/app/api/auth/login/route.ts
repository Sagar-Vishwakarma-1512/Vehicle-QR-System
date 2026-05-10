export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
        }

        // Trim whitespace from email just in case
        const cleanEmail = email.trim().toLowerCase();

        // Check if user exists in the custom users table
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .ilike('email', cleanEmail)  // case-insensitive email match
            .single();

        if (error || !user) {
            console.error("User lookup error:", error?.message, "for email:", cleanEmail);
            return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
        }

        // Verify password (Base64 check as per registration)
        const inputHash = Buffer.from(password.trim()).toString('base64');

        console.log("DB hash:", user.password_hash);
        console.log("Input hash:", inputHash);

        if (user.password_hash !== inputHash) {
            console.error("Password mismatch for user:", cleanEmail);
            return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
        }

        // Return user without sensitive fields
        const { password_hash, ...safeUser } = user;

        // Normalize role to prevent whitespace/case issues on Vercel
        const normalizedRole = (safeUser.role || 'admin').toLowerCase().trim();
        safeUser.role = normalizedRole;

        console.log("Login success for:", cleanEmail, "| Role in DB:", user.role, "| Normalized:", normalizedRole);

        return NextResponse.json({ success: true, user: safeUser });
    } catch (error: any) {
        console.error("Login API error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
