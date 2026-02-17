
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

async function listAll() {
    console.log('--- TABLE LISTING ---');
    // Using a common RPC or just trying to select from information_schema if allowed (usually not via anon key)
    // But we can check which tables are visible to the API
    const tables = ['users', 'clients', 'bookings', 'budgets', 'tasks', 'config', 'tours'];
    for (const t of tables) {
        const { error } = await supabase.from(t).select('count', { count: 'exact', head: true });
        if (error) {
            console.log(`Table ${t}: ❌ ${error.message}`);
        } else {
            console.log(`Table ${t}: ✅ EXISTS`);
        }
    }

    // Test if we can see the schema via a trick (selecting from a non-existent table in a specific schema)
    const { error: schemaError } = await supabase.from('non_existent').select('*');
    console.log('Trace hint:', schemaError?.message);
}

listAll();
