
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envPath = '.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    const email = 'a_sergio@icloud.com';
    const { data, error } = await supabase.from('users').select('id, email, nome, role').eq('email', email).maybeSingle();
    if (error) {
        console.error('Error:', error);
    } else if (data) {
        console.log('User FOUND:', data);
    } else {
        console.log('User NOT FOUND');
    }
}

check();
