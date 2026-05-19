import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import QRCode from 'qrcode';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            quantity: bodyQuantity,
            count: bodyCount,
            user_id: bodyUserId,
            userId: bodyUserIdAlt
        } = body;

        const quantity = bodyQuantity || bodyCount || 1;
        const user_id = bodyUserId || bodyUserIdAlt;

        if (!user_id) {
            return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
        }

        // 1. Get Reseller Slug for prefixing. If the user is not a reseller, fallback to their own account data.
        const { data: reseller, error: resellerError } = await supabase
            .from('resellers')
            .select('custom_domain, qr_quota')
            .eq('user_id', user_id)
            .single();

        let slug = 'u';
        let quota = 0;

        if (reseller && !resellerError) {
            slug = reseller.custom_domain || 'u';
            quota = reseller.qr_quota || 0;
        } else {
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('full_name, email')
                .eq('id', user_id)
                .single();

            if (userError || !user) {
                return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 });
            }

            const normalizedSlug = (user.full_name || user.email || 'u')
                .toString()
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');

            slug = normalizedSlug || 'u';
            quota = 0; // No reseller quota means unlimited generation for owner/admin accounts
        }

        // 2. Find the highest existing serial for this SLUG to avoid collisions
        // We search globally by slug prefix because multiple users might have had the same slug 
        // (e.g. if a reseller was deleted and recreated)
        const { data: slugCodes, error: slugError } = await supabase
            .from('qr_codes')
            .select('qr_unique_id')
            .like('qr_unique_id', `${slug}-%`);

        if (slugError) throw slugError;

        // 3. Check Quota (Per User)
        const { count: userCount, error: countError } = await supabase
            .from('qr_codes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user_id);

        if (countError) throw countError;

        const currentCount = userCount || 0;
        const remaining = Math.max(0, quota - currentCount);

        if (quota > 0 && quantity > remaining) {
            return NextResponse.json({ 
                success: false, 
                error: remaining === 0 
                    ? `Your QR generation limit has ended. You cannot generate any more QR codes.` 
                    : `You only have ${remaining} QR codes left in your limit, but you are trying to generate ${quantity}. Please enter a number up to ${remaining}.` 
            }, { status: 403 });
        }

        let maxSerial = 0;
        if (slugCodes && slugCodes.length > 0) {
            slugCodes.forEach(code => {
                const parts = code.qr_unique_id.split('-');
                const serialStr = parts[parts.length - 1];
                const serial = parseInt(serialStr);
                if (!isNaN(serial) && serial > maxSerial) {
                    maxSerial = serial;
                }
            });
        }

        const generatedCodes = [];
        const startSerial = maxSerial + 1;

        for (let i = 0; i < quantity; i++) {
            const serial = startSerial + i;
            // FORMAT: [slug]-[serial] -> e.g. akash-01
            // This ensures URL uniqueness while keeping sequential numbering per user
            const qr_unique_id = `${slug}-${serial.toString().padStart(2, '0')}`;

            const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://nfctool.com').replace(/\/$/, '');
            const scan_url = `${appUrl}/${qr_unique_id}`;

            const qr_image_url = await QRCode.toDataURL(scan_url, {
                margin: 2,
                width: 512,
                color: {
                    dark: '#000000', 
                    light: '#ffffff'
                }
            });

            const qrData = {
                qr_unique_id,
                scan_url,
                qr_image_url,
                status: 'paused', 
                is_activated: false,
                user_id: user_id,
                call_enabled: true,
                whatsapp_enabled: true,
                emergency_enabled: true,
                show_owner_name: false,
                require_otp: false, 
            };

            const { data, error } = await supabase
                .from('qr_codes')
                .insert([qrData])
                .select()
                .single();

            if (error) throw error;
            generatedCodes.push(data);
        }

        return NextResponse.json({
            success: true,
            message: `${quantity} QR code(s) generated starting from #${startSerial}`,
            qr_codes: generatedCodes
        });
    } catch (error: any) {
        console.error("QR Generation Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
