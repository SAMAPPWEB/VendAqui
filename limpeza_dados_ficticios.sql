-- ============================================
-- SCRIPT DE LIMPEZA DE DADOS FICTÍCIOS
-- Data: 2026-02-13
-- Instruções: Copie e cole este conteúdo no editor SQL do Supabase
-- ============================================

-- 1. Remover itens de orçamento
DELETE FROM budget_items 
WHERE created_at < '2026-02-13';

-- 2. Remover orçamentos
DELETE FROM budgets 
WHERE created_at < '2026-02-13';

-- 3. Remover agendamentos
DELETE FROM bookings 
WHERE created_at < '2026-02-13';

-- 4. Remover transações financeiras
DELETE FROM transactions 
WHERE created_at < '2026-02-13';

-- 5. Remover tarefas
DELETE FROM tasks 
WHERE created_at < '2026-02-13';

-- 6. Remover histórico de clientes
DELETE FROM client_history 
WHERE created_at < '2026-02-13';

-- 7. Remover clientes antigos
DELETE FROM clients 
WHERE created_at < '2026-02-13';

-- NOTA: Usuários e Passeios (Tours) não foram afetados para manter o catálogo.
