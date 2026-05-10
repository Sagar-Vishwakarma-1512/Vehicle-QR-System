const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1);
        env[match[1]] = value;
    }
});

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixUnassignedQRs() {
    try {
        // 1. Get the first admin user
        const { data: admin, error: adminError } = await supabase
            .from('resellers')
            .select('user_id')
            .limit(1)
            .single();

        if (adminError || !admin) {
            console.log("No admin found to assign QRs to.");
            return;
        }

        const targetUserId = admin.user_id;
        console.log(`Assigning unassigned QRs to admin: ${targetUserId}`);

        // 2. Update all QRs where user_id is null
        const { error } = await supabase
            .from('qr_codes')
            .update({ user_id: targetUserId })
            .is('user_id', null);

        if (error) throw error;
        
        console.log("SUCCESS: All unassigned QR codes have been linked to your admin account!");
    } catch (err) {
        console.error("Error fixing QRs:", err.message);
    }
}

fixUnassignedQRs();
