import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tfertbgqeuueofqmfgvg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZXJ0YmdxZXV1ZW9mcW1mZ3ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MjA2MzksImV4cCI6MjA4NjE5NjYzOX0.VTKVdDNKNHR4GnZovGcMKiVVb5EG6wgYylxD7XZm0v8'
);

async function testDelete() {
    const { data: users } = await supabase.from('users').select('id, email, role');
    console.log("Users before delete attempt:", users);
    
    // Attempt to delete a specific user
    const targetEmail = 'divya@gmail.com'; // or whatever the user email was
    // Actually let's just see if we can do a dummy delete
    const { error } = await supabase.from('users').delete().eq('email', 'nonexistent@test.com');
    console.log("Delete error (if any):", error);
}

testDelete();
