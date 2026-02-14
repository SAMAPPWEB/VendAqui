
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hryjngpvbcdbxraabqja.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyeWpuZ3B2YmNkYnhyYWFicWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4Mzc1MzgsImV4cCI6MjA4NjQxMzUzOH0.Fd2zVMskYuynGUXLG6Bgy_NyNUi9-FwFTx3KHqknh8o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClient() {
    console.log('--- BUSCANDO EM USERS ---');
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('nome, email, senha, role, status')
        .eq('email', 'a_sergio@icloud.com')
        .maybeSingle();

    if (userData) {
        console.log('Usuário encontrado em USERS:');
        console.log(`Nome: ${userData.nome} | Email: ${userData.email} | Senha: ${userData.senha} | Role: ${userData.role} | Status: ${userData.status}`);
    } else {
        console.log('Usuário não encontrado em USERS.');
    }

    const { data: allUsers, error: allUsersError } = await supabase
        .from('users')
        .select('nome, email, role, status');

    if (allUsers) {
        console.log('\n--- LISTA DE TODOS OS USUÁRIOS (EQUIPE) ---');
        allUsers.forEach(u => {
            console.log(`Nome: ${u.nome} | Email: ${u.email} | Role: ${u.role} | Status: ${u.status}`);
        });
    }
}

checkClient();
