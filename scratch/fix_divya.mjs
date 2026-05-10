import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tfertbgqeuueofqmfgvg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZXJ0YmdxZXV1ZW9mcW1mZ3ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MjA2MzksImV4cCI6MjA4NjE5NjYzOX0.VTKVdDNKNHR4GnZovGcMKiVVb5EG6wgYylxD7XZm0v8'
);

async function fixDivya() {
    const fakeEmail = `deleted_${Date.now()}_divya@deleted.com`;
    const { error } = await supabase.from('users').update({
        email: fakeEmail,
        password_hash: 'deleted',
        role: 'deleted'
    }).eq('email', 'divya@gmail.com');
    
    console.log("Scramble error (if any):", error);
}

fixDivya();
