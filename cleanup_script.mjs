import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.trim().split('=')));

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Erro: Credenciais do Supabase não encontradas no .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    console.log('Iniciando limpeza de dados fictícios (anteriores a 2026-02-13)...');
    const cutoffDate = '2026-02-13';

    const tables = [
        { name: 'budget_items', dateField: 'created_at' },
        { name: 'budgets', dateField: 'created_at' },
        { name: 'bookings', dateField: 'created_at' },
        { name: 'transactions', dateField: 'created_at' },
        { name: 'tasks', dateField: 'created_at' },
        { name: 'client_history', dateField: 'created_at' },
        { name: 'clients', dateField: 'created_at' }
    ];

    for (const table of tables) {
        console.log(`Limpando tabela: ${table.name}...`);
        const { error, count } = await supabase
            .from(table.name)
            .delete()
            .lt(table.dateField, cutoffDate);

        if (error) {
            console.error(`Erro ao limpar ${table.name}:`, error.message);
        } else {
            console.log(`Tabela ${table.name} limpa.`);
        }
    }

    console.log('Limpeza concluída!');
}

cleanup();
