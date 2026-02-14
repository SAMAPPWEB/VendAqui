# Guia de Migração - AGENDAQUI para Supabase

## 📋 Pré-requisitos

- [ ] Conta no Supabase criada (<https://supabase.com>)
- [ ] Projeto Supabase criado
- [ ] URL do projeto e Anon Key em mãos

---

## 🚀 Passo a Passo

### 1. Criar Projeto no Supabase

1. Acesse <https://supabase.com>
2. Clique em "New Project"
3. Preencha:
   - **Name**: AGENDAQUI-AntonioSergio
   - **Database Password**: Escolha uma senha forte
   - **Region**: South America (São Paulo)
4. Aguarde a criação do projeto (~2 minutos)

### 2. Executar Schema SQL

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Copie todo o conteúdo do arquivo `db_schema.sql`
4. Cole no editor SQL
5. Clique em **Run** (ou pressione Ctrl+Enter)
6. Aguarde a execução (~30 segundos)
7. Verifique se apareceu "Success. No rows returned"

### 3. Verificar Tabelas Criadas

1. Vá em **Table Editor** no menu lateral
2. Você deve ver 10 tabelas:
   - ✅ users
   - ✅ clients
   - ✅ tours
   - ✅ bookings
   - ✅ budgets
   - ✅ budget_items
   - ✅ transactions
   - ✅ tasks
   - ✅ client_history
   - ✅ config

### 4. Obter Credenciais

1. Vá em **Settings** → **API**
2. Copie:
   - **Project URL** (formato: `https://xxxxx.supabase.co`)
   - **anon public** key (começa com `eyJ...`)

### 5. Configurar Projeto Local

Edite o arquivo `.env.local` e adicione:

```env
GEMINI_API_KEY=PLACEHOLDER_API_KEY
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 6. Instalar Dependências

```bash
npm install @supabase/supabase-js
```

### 7. Migrar Dados do localStorage (Opcional)

Se você já tem dados no localStorage que deseja preservar:

1. Abra a aplicação atual no navegador
2. Abra o Console do navegador (F12)
3. Execute o script de migração que será fornecido
4. Verifique no Supabase se os dados foram transferidos

---

## ✅ Verificação Final

### No Supabase

- [ ] 10 tabelas criadas
- [ ] Tabela `config` tem 1 registro
- [ ] Tabela `users` tem 1 registro (admin Samar)
- [ ] RLS (Row Level Security) está habilitado em todas as tabelas

### Na Aplicação

- [ ] Arquivo `.env.local` configurado
- [ ] Dependência `@supabase/supabase-js` instalada
- [ ] Aplicação inicia sem erros
- [ ] Console do navegador não mostra erros de conexão

---

## 🔧 Próximos Passos

Após a ativação do banco de dados:

1. **Atualizar componentes** para usar o serviço de banco de dados
2. **Remover dependência do localStorage** gradualmente
3. **Testar todas as funcionalidades** com dados reais
4. **Configurar backup automático** no Supabase

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique se as credenciais estão corretas no `.env.local`
2. Confirme que o projeto Supabase está ativo
3. Verifique o console do navegador para erros específicos
4. Consulte a documentação: <https://supabase.com/docs>

---

## 🎯 Estrutura do Banco de Dados

```
AGENDAQUI Database
├── users (Usuários do sistema)
├── clients (Clientes/Leads)
├── tours (Catálogo de passeios)
├── bookings (Reservas/Agendamentos)
├── budgets (Orçamentos)
│   └── budget_items (Itens de orçamento)
├── transactions (Transações financeiras)
├── tasks (Tarefas/Atividades)
├── client_history (Histórico de passeios)
└── config (Configurações white-label)
```

---

## 🔐 Segurança

- ✅ **RLS habilitado**: Proteção em nível de linha
- ✅ **Políticas configuradas**: Controle de acesso por role
- ✅ **Chave anônima**: Apenas operações permitidas pelas políticas
- ✅ **Senhas**: Devem ser armazenadas com hash (bcrypt)
