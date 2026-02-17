# 🚀 Próximos Passos - AGENDAQUI

## ⚠️ AÇÕES CRÍTICAS IMEDIATAS

### 1. Executar Schema no Supabase

#### Status: PENDENTE (Banco de Dados)

Você precisa executar o script SQL para criar as tabelas.

1. Vá em [Supabase Dashboard](https://supabase.com/dashboard/project/hryjngpvbcdbxraabqja)
2. Abra o **SQL Editor**
3. Cole o conteúdo de `db_schema.sql` e execute.

---

### 2. Instalar Dependências e Rodar

#### Status: PENDENTE (Ambiente)

```powershell
# No terminal do VS Code:
# Projeto já está na pasta atual
npm install @supabase/supabase-js
npm run dev
```

---

### 3. Migrar Dados Locais (NOVO!)

#### Status: PRONTO PARA USO (Migração)

Adicionei um botão automático para isso!

1. Abra a aplicação rodando (`npm run dev`)
2. Faça login e vá em **Configurações** (engrenagem no topo)
3. Role até o final da página
4. Clique no botão azul: **"MIGRAR DADOS PARA CLOUD (SUPABASE)"**
5. Aguarde o alerta de confirmação.

---

## 🎨 Design & Segurança

### Padronização Visual

- **Tema**: Arquivo `config/theme.ts` criado com as cores solicitadas (#F97316, Branco, #191919).
- **CSS**: `index.css` atualizado com classes utilitárias globais.
- **Tailwind**: `tailwind.config.js` configurado para reconhecer as novas cores.

### Segurança de Senhas

- **Seed de Senhas**: Arquivo `seed_passwords.sql` criado.
- **Nota**: As senhas de usuários e clientes devem ser gerenciadas neste arquivo separado ou via painel do Supabase Auth no futuro. Não coloque senhas reais no `db_schema.sql`.

---

## 📞 Precisa de Ajuda?

- **Erro de conexão?** Verifique se rodou o SQL no Supabase.
- **Erro de migração?** Verifique o console do navegador (F12) para detalhes.
