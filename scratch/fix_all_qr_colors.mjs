import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';

const supabase = createClient(
  'https://tfertbgqeuueofqmfgvg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZXJ0YmdxZXV1ZW9mcW1mZ3ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MjA2MzksImV4cCI6MjA4NjE5NjYzOX0.VTKVdDNKNHR4GnZovGcMKiVVb5EG6wgYylxD7XZm0v8'
);

async function fix() {
  const { data: qrs, error } = await supabase.from('qr_codes').select('id, scan_url');
  if (error) {
    console.error(error);
    return;
  }
  
  console.log(`Found ${qrs.length} QR codes. Processing...`);
  
  for (const qr of qrs) {
    if (!qr.scan_url) continue;
    
    try {
        const qr_image_url = await QRCode.toDataURL(qr.scan_url, {
            margin: 2,
            width: 512,
            color: {
                dark: '#000000', 
                light: '#ffffff'
            }
        });
        
        await supabase.from('qr_codes').update({ qr_image_url }).eq('id', qr.id);
        console.log(`Updated QR ${qr.id}`);
    } catch(err) {
        console.error(`Failed on QR ${qr.id}`, err);
    }
  }
  console.log("All done!");
}

fix();
