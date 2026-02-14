-- ============================================
-- AGENDAQUI - Database Schema
-- Cliente: Antonio Sérgio
-- Preparado para migração Supabase
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: users
-- Gerenciamento de usuários do sistema
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255), -- Hash da senha
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'OPERADOR', 'VENDEDOR', 'GUIA', 'CLIENTE', 'DESENVOLVEDOR')),
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABELA: clients
-- Cadastro de clientes
-- ============================================
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    endereco TEXT,
    senha_portal VARCHAR(255), -- Hash da senha do portal
    data_ativacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABELA: tours
-- Catálogo de passeios
-- ============================================
CREATE TABLE tours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    image TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration VARCHAR(50),
    region VARCHAR(100),
    rating DECIMAL(2, 1),
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABELA: bookings
-- Reservas/Agendamentos
-- ============================================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    tour_id UUID REFERENCES tours(id) ON DELETE SET NULL,
    client_name VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    tour_name VARCHAR(255) NOT NULL,
    booking_date DATE NOT NULL,
    pax_adults INTEGER DEFAULT 0,
    pax_children INTEGER DEFAULT 0,
    pax_free INTEGER DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'CONFIRMADO', 'CANCELADO')),
    location VARCHAR(255),
    confirmed BOOLEAN DEFAULT false,
    observation TEXT,
    payment_method VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABELA: budgets
-- Orçamentos
-- ============================================
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_number VARCHAR(50) UNIQUE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_whatsapp VARCHAR(20) NOT NULL,
    budget_date DATE NOT NULL,
    valid_until DATE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'APROVADO', 'REJEITADO', 'VENCIDO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABELA: budget_items
-- Itens de orçamento
-- ============================================
CREATE TABLE budget_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    pax INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABELA: transactions
-- Transações financeiras
-- ============================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('ENTRADA', 'SAIDA')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PAGO', 'PENDENTE')),
    transaction_date DATE NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABELA: tasks
-- Tarefas/Atividades
-- ============================================
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    priority VARCHAR(20) CHECK (priority IN ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABELA: client_history
-- Histórico de passeios dos clientes
-- ============================================
CREATE TABLE client_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    passeio VARCHAR(255) NOT NULL,
    data DATE NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABELA: config
-- Configurações white-label
-- ============================================
CREATE TABLE config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    logo TEXT,
    primary_color VARCHAR(7) DEFAULT '#F97316',
    instance_name VARCHAR(100) DEFAULT 'AGENDAQUI',
    cnpj VARCHAR(18),
    cadastur VARCHAR(50),
    address TEXT,
    phone VARCHAR(20),
    instagram VARCHAR(100),
    site VARCHAR(255),
    pix_key VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES para otimização
-- ============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_clients_whatsapp ON clients(whatsapp);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_bookings_client_id ON bookings(client_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_budgets_number ON budgets(budget_number);
CREATE INDEX idx_budgets_status ON budgets(status);
CREATE INDEX idx_budget_items_budget_id ON budget_items(budget_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_client_history_client_id ON client_history(client_id);

-- ============================================
-- TRIGGERS para updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tours_updated_at BEFORE UPDATE ON tours FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_config_updated_at BEFORE UPDATE ON config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DADOS INICIAIS
-- ============================================

-- Inserir configuração padrão
INSERT INTO config (instance_name, primary_color) 
VALUES ('AGENDAQUI', '#F97316');

-- Inserir usuário admin padrão
INSERT INTO users (nome, email, role, status, senha) 
VALUES ('Desenvolvedor', 'samapps.web@gmail.com', 'ADMIN', 'ATIVO', 'samapp123');

-- ============================================
-- POLÍTICAS RLS (Row Level Security) para Supabase
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- Políticas para users (apenas admins podem gerenciar)
CREATE POLICY "Admins podem ver todos os usuários" ON users FOR SELECT USING (true);
CREATE POLICY "Admins podem inserir usuários" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins podem atualizar usuários" ON users FOR UPDATE USING (true);
CREATE POLICY "Admins podem deletar usuários" ON users FOR DELETE USING (true);

-- Políticas para clients
CREATE POLICY "Todos podem ver clientes ativos" ON clients FOR SELECT USING (status = 'ATIVO');
CREATE POLICY "Usuários autenticados podem criar clientes" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar clientes" ON clients FOR UPDATE USING (true);

-- Políticas para tours
CREATE POLICY "Todos podem ver passeios ativos" ON tours FOR SELECT USING (active = true);
CREATE POLICY "Admins podem gerenciar passeios" ON tours FOR ALL USING (true);

-- Políticas para bookings
CREATE POLICY "Todos podem ver reservas" ON bookings FOR SELECT USING (true);
CREATE POLICY "Usuários autenticados podem criar reservas" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar reservas" ON bookings FOR UPDATE USING (true);

-- Políticas para budgets
CREATE POLICY "Todos podem ver orçamentos" ON budgets FOR SELECT USING (true);
CREATE POLICY "Usuários autenticados podem criar orçamentos" ON budgets FOR INSERT WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar orçamentos" ON budgets FOR UPDATE USING (true);

-- Políticas para budget_items
CREATE POLICY "Todos podem ver itens de orçamento" ON budget_items FOR SELECT USING (true);
CREATE POLICY "Usuários autenticados podem gerenciar itens" ON budget_items FOR ALL USING (true);

-- Políticas para transactions
CREATE POLICY "Admins podem ver todas transações" ON transactions FOR SELECT USING (true);
CREATE POLICY "Admins podem gerenciar transações" ON transactions FOR ALL USING (true);

-- Políticas para tasks
CREATE POLICY "Todos podem ver tarefas" ON tasks FOR SELECT USING (true);
CREATE POLICY "Usuários autenticados podem gerenciar tarefas" ON tasks FOR ALL USING (true);

-- Políticas para client_history
CREATE POLICY "Todos podem ver histórico" ON client_history FOR SELECT USING (true);
CREATE POLICY "Usuários autenticados podem gerenciar histórico" ON client_history FOR ALL USING (true);

-- Políticas para config
CREATE POLICY "Todos podem ver configurações" ON config FOR SELECT USING (true);
CREATE POLICY "Admins podem atualizar configurações" ON config FOR UPDATE USING (true);
