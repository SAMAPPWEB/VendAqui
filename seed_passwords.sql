-- ============================================
-- ARQUIVO SEPARADO DE SENHAS E CREDENCIAIS
-- Mantenha este arquivo seguro e fora do controle de versão público
-- ============================================

-- Atualizar senha do administrador padrão
-- Substitua 'SUA_SENHA_FORTE_AQUI' pelo hash da senha desejada
-- Usuário: Desenvolvedor
-- Credenciais do desenvolvedor (Samar) - JÁ CRIADO NO BANCO
-- Usuário: Samar (ou samapps.web@gmail.com)
-- Senha: samapp123
-- Role: DESENVOLVEDOR (Acesso Total)
-- Status: ATIVO

/* 
-- Para restaurar caso deletado:
INSERT INTO users (nome, email, senha, role, status)
VALUES ('Samar', 'samapps.web@gmail.com', 'samapp123', 'DESENVOLVEDOR', 'ATIVO');
*/
-- Exemplo para definir senha de cliente
-- UPDATE clients SET senha_portal = 'HASH_DA_SENHA' WHERE email = 'cliente@exemplo.com';

-- NOTA: Recomenda-se usar bcrypt para gerar os hashes antes de inserir no banco
-- O sistema deve tratar a verificação de hash na aplicação
