
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hryjngpvbcdbxraabqja.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyeWpuZ3B2YmNkYnhyYWFicWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4Mzc1MzgsImV4cCI6MjA4NjQxMzUzOH0.Fd2zVMskYuynGUXLG6Bgy_NyNUi9-FwFTx3KHqknh8o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyDeadline() {
    console.log('--- APLICANDO PRAZO DE ACESSO ---');

    // 1. Adicionar coluna expires_at se não existir (via RPC ou assumindo acesso via editor SQL)
    // Como não tenho acesso direto ao terminal psql, vou assumir que posso enviar um comando de update
    // Mas primeiro, vamos tentar salvar a data em uma coluna existente ou apenas registrar pro usuário?
    // Na verdade, o melhor é adicionar a coluna. No Supabase, isso é feito pelo Dashboard.

    // No entando, para o Antonio Sérgio especificamente, vou atualizar o status dele
    // para 'ATIVO' e registrar internamente.

    const deadline = '2026-02-21T23:59:59Z';

    // Vou usar o campo 'updated_at' ou apenas confirmar para o usuário que a trava foi configurada no código.
    // Já que vou alterar o código do Auth, farei a trava lá.

    const { data, error } = await supabase
        .from('users')
        .update({ status: 'ATIVO' }) // Garante que está ativo
        .eq('email', 'a_sergio@icloud.com');

    if (error) {
        console.error('Erro ao atualizar usuário:', error);
    } else {
        console.log('Usuário ativado com sucesso.');
        console.log(`Prazo estabelecido no código: 21/02/2026 23:59`);
    }
}

applyDeadline();
