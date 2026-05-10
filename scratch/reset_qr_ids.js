const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetIds() {
    console.log("Starting ID reset...");
    
    const { data: resellers } = await supabase.from('resellers').select('user_id, custom_domain');
    if (!resellers) return console.log("No resellers found");

    for (const reseller of resellers) {
        console.log(`Processing reseller: ${reseller.custom_domain}`);
        
        const { data: qrCodes } = await supabase
            .from('qr_codes')
            .select('id')
            .eq('user_id', reseller.user_id)
            .order('created_at', { ascending: true });

        if (!qrCodes) continue;

        for (let i = 0; i < qrCodes.length; i++) {
            const serial = i + 1;
            const newId = `${reseller.custom_domain}-${serial.toString().padStart(2, '0')}`;
            
            const { error } = await supabase
                .from('qr_codes')
                .update({ qr_unique_id: newId })
                .eq('id', qrCodes[i].id);
            
            if (error) console.error(`Error updating ${qrCodes[i].id}:`, error);
            else console.log(`Updated to ${newId}`);
        }
    }
    console.log("Reset complete! Refresh the page now.");
}

resetIds();
