
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual env parsing since we can't use dotenv
const envPath = '.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'];

console.log('Verifying Schema...');
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Env variables missing!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const tables = ['users', 'clients', 'bookings', 'budgets', 'budget_items', 'transactions', 'tasks', 'config', 'tours', 'client_history', 'booking_media'];

async function verify() {
    for (const table of tables) {
        process.stdout.write(`Checking table ${table}... `);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log('❌ FAILED: ' + error.message);
        } else {
            console.log('✅ OK');

            if (table === 'bookings') {
                const { error: guideError } = await supabase.from('bookings').select('guide_id, guide_name').limit(1);
                if (guideError) {
                    console.log('   ⚠️ Missing columns: guide_id or guide_name');
                } else {
                    console.log('   ✅ guide_id and guide_name exist');
                }

                // Check for guide_revenue
                const { error: grError } = await supabase.from('bookings').select('guide_revenue').limit(1);
                if (grError) console.log('   ⚠️ Missing column: guide_revenue');
                else console.log('   ✅ guide_revenue exists');
            }

            if (table === 'tasks') {
                const { error: assignError } = await supabase.from('tasks').select('assigned_to').limit(1);
                if (assignError) {
                    console.log('   ⚠️ Missing column: assigned_to');
                } else {
                    console.log('   ✅ assigned_to exists');
                }
            }
            if (table === 'users') {
                const { error: userColsError } = await supabase.from('users').select('whatsapp, cnpj, endereco').limit(1);
                if (userColsError) {
                    console.log('   ⚠️ Missing columns: ' + userColsError.message);
                } else {
                    console.log('   ✅ whatsapp, cnpj, and endereco exist');
                }

                // Check for daily_rate
                const { error: drError } = await supabase.from('users').select('daily_rate').limit(1);
                if (drError) console.log('   ⚠️ Missing column: daily_rate');
                else console.log('   ✅ daily_rate exists');
            }
        }
    }
}

verify();
