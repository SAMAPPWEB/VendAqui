
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Key:', supabaseAnonKey ? 'Found' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Environment variables missing!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    try {
        const { data, error } = await supabase.from('config').select('*').limit(1);
        if (error) {
            console.error('Error fetching config:', error);
            process.exit(1);
        }
        console.log('Connection Successful! Config data:', data);

        // Test INSERT
        console.log('Testing INSERT permissions on tasks...');
        const { data: insertData, error: insertError } = await supabase.from('tasks').insert([
            { title: 'CONNECTION_TEST_TASK', status: 'PENDENTE' }
        ]).select();

        if (insertError) {
            console.error('INSERT Test Failed:', insertError);
            process.exit(1);
        }
        console.log('INSERT Test Successful:', insertData);

        // Cleanup
        const { error: deleteError } = await supabase.from('tasks').delete().eq('title', 'CONNECTION_TEST_TASK');
        if (deleteError) {
            console.warn('Cleanup Failed:', deleteError);
        } else {
            console.log('Cleanup Successful.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Fatal Error:', err);
        process.exit(1);
    }
}

test();
