import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://tfertbgqeuueofqmfgvg.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZXJ0YmdxZXV1ZW9mcW1mZ3ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MjA2MzksImV4cCI6MjA4NjE5NjYzOX0.VTKVdDNKNHR4GnZovGcMKiVVb5EG6wgYylxD7XZm0v8"

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDetails() {
    const { data: resellers } = await supabase.from('resellers').select('*')
    console.log("Resellers:")
    resellers?.forEach(r => console.log(`- ID: ${r.id}, User: ${r.user_id}, Slug: [${r.custom_domain}]`))

    const { data: qrCodes } = await supabase.from('qr_codes').select('qr_unique_id, user_id')
    console.log("\nQR Codes Mapping:")
    qrCodes?.forEach(q => console.log(`- ${q.qr_unique_id} -> User: ${q.user_id}`))
}

checkDetails()
