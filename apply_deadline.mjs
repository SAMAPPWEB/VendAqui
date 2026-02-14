
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hryjngpvbcdbxraabqja.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyeWpuZ3B2YmNkYnhyYWFicWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4Mzc1MzgsImV4cCI6MjA4NjQxMzUzOH0.Fd2zVMskYuynGUXLG6Bgy_NyNUi9-FwFTx3KHqknh8o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
    const email = 'a_sergio@icloud.com';
    const password = 'a_sergio@icloud.com';

    console.log(`--- TESTANDO LOGIN PARA: ${email} ---`);

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim())
        .eq('status', 'ATIVO')
        .maybeSingle();

    if (error) {
        console.error('Erro Supabase:', error);
        return;
    }

    if (!data) {
        console.log('ERRO: Usuário não encontrado ou INATIVO.');
        return;
    }

    console.log('Usuário encontrado:', data.nome);
    console.log('Senha no Banco:', `'${data.senha}'`);
    console.log('Senha digitada:', `'${password}'`);

    if (data.senha === password) {
        console.log('✅ SUCESSO: As senhas coincidem exatamente.');
    } else {
        console.log('❌ ERRO: As senhas NÃO coincidem.');
    }
}

testLogin();
