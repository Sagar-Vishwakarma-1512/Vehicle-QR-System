import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tfertbgqeuueofqmfgvg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZXJ0YmdxZXV1ZW9mcW1mZ3ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MjA2MzksImV4cCI6MjA4NjE5NjYzOX0.VTKVdDNKNHR4GnZovGcMKiVVb5EG6wgYylxD7XZm0v8'
);

async function testDelete() {
    const targetUserId = 'cbec596e-2267-46ec-8378-42bed9a44a1d'; // divya@gmail.com
    
    // Attempt to delete a specific user
    const { data, error } = await supabase.from('users').delete().eq('id', targetUserId).select();
    console.log("Delete error (if any):", error);
    console.log("Deleted data:", data);
}

testDelete();
