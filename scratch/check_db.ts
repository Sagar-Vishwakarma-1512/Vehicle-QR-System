import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://tfertbgqeuueofqmfgvg.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZXJ0YmdxZXV1ZW9mcW1mZ3ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MjA2MzksImV4cCI6MjA4NjE5NjYzOX0.VTKVdDNKNHR4GnZovGcMKiVVb5EG6wgYylxD7XZm0v8"

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDuplicates() {
    console.log("Checking for duplicate slugs and QR codes...")
    
    // Check resellers
    const { data: resellers, error: rError } = await supabase.from('resellers').select('id, custom_domain, user_id')
    if (rError) {
        console.error("Error fetching resellers:", rError)
        return
    }
    
    console.log("Resellers found:", resellers.length)
    const slugs = resellers.map(r => r.custom_domain)
    const duplicateSlugs = slugs.filter((item, index) => slugs.indexOf(item) !== index)
    console.log("Duplicate slugs found:", duplicateSlugs)

    // Check QR codes
    const { data: qrCodes, error: qError } = await supabase.from('qr_codes').select('qr_unique_id, user_id')
    if (qError) {
        console.error("Error fetching QR codes:", qError)
        return
    }
    
    console.log("Total QR codes:", qrCodes.length)
    const ids = qrCodes.map(q => q.qr_unique_id)
    
    // Sort IDs to see them better
    ids.sort();
    
    console.log("Latest QR IDs (sorted):", ids.slice(-20))
    
    // Group by slug
    const groups: Record<string, string[]> = {};
    ids.forEach(id => {
        const slug = id.split('-')[0];
        if (!groups[slug]) groups[slug] = [];
        groups[slug].push(id);
    });
    
    console.log("Slugs and their counts:");
    Object.keys(groups).forEach(slug => {
        console.log(`- ${slug}: ${groups[slug].length} codes (Max: ${groups[slug].slice(-1)})`);
    });
}

checkDuplicates()
