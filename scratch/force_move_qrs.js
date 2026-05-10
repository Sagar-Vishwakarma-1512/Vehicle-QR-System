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

async function forceMoveQRs() {
    try {
        const nivedanId = '70f1adc5-50c6-4eff-82c2-04117736cbf8';
        
        // 1. Get ALL QR codes regardless of who they belong to
        const { data: allQRs, error: fetchError } = await supabase
            .from('qr_codes')
            .select('id, user_id, qr_unique_id');

        if (fetchError) throw fetchError;
        
        console.log(`Total QR Codes found: ${allQRs?.length || 0}`);

        if (allQRs && allQRs.length > 0) {
            // 2. Assign EVERY SINGLE ONE to Nivedan
            const { error: updateError } = await supabase
                .from('qr_codes')
                .update({ user_id: nivedanId });
                // No filter means update ALL records (Supabase requires a filter usually, 
                // but we can use .not('id', 'is', null) to target all)
            
            const { error: updateAllError } = await supabase
                .from('qr_codes')
                .update({ user_id: nivedanId })
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy filter to update all

            if (updateAllError) throw updateAllError;
            
            console.log(`SUCCESS: All ${allQRs.length} QR codes moved to Nivedan's account!`);
        } else {
            console.log("No QR codes found in the database at all.");
        }
    } catch (err) {
        console.error("Error moving QRs:", err.message);
    }
}

forceMoveQRs();
