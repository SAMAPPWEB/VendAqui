
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hryjngpvbcdbxraabqja.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyeWpuZ3B2YmNkYnhyYWFicWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4Mzc1MzgsImV4cCI6MjA4NjQxMzUzOH0.Fd2zVMskYuynGUXLG6Bgy_NyNUi9-FwFTx3KHqknh8o';

const supabase = createClient(supabaseUrl, supabaseKey);

import bcrypt from 'bcryptjs';

async function testIntegratedLogin() {
    const email = 'a_sergio@icloud.com';
    const passwordInput = 'a_sergio@icloud.com';

    console.log(`--- TESTANDO LOGIN INTEGRADO ---`);

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (!data) {
        console.log('Usuário não encontrado.');
        return;
    }

    console.log('Usuário:', data.nome);
    console.log('Hash no Banco:', data.senha);

    // Exata lógica do authService.ts
    const isMatch = await bcrypt.compare(passwordInput, data.senha).catch((err) => {
        console.error('Erro no bcrypt.compare:', err);
        return false;
    });

    console.log('Bcrypt Match:', isMatch);

    // Fallback
    const isFallbackMatch = (!isMatch && data.senha === passwordInput);
    console.log('Fallback Match:', isFallbackMatch);

    if (isMatch || isFallbackMatch) {
        console.log('✅ LOGIN SUCESSO NO SCRIPT');
    } else {
        console.log('❌ LOGIN FALHA NO SCRIPT');
    }
}

testIntegratedLogin();
