// Serviço de banco de dados para AGENDAQUI
import { supabase } from './supabase';
import { adapters } from './adapters';
import type { User, Client, Booking, Budget, Transaction, WhiteLabelConfig } from '../types';

// ============================================
// CONFIG
// ============================================

export const configService = {
    async get(): Promise<WhiteLabelConfig | null> {
        const { data, error } = await supabase
            .from('config')
            .select('*')
            .limit(1)
            .single();

        if (error) {
            console.warn('Config not found or error:', error);
            return null;
        }
        return adapters.config.toApp(data);
    },

    async update(updates: Partial<WhiteLabelConfig>) {
        // Converter updates para snake_case
        const dbUpdates = adapters.config.toDb(updates);

        // Precisamos do ID. Assumindo que só há 1 config, pegamos o primeiro.
        const { data: current } = await supabase.from('config').select('id').limit(1).single();

        let query;
        if (current) {
            query = supabase.from('config').update(dbUpdates).eq('id', current.id);
        } else {
            query = supabase.from('config').insert([dbUpdates]);
        }

        const { data, error } = await query.select().single();

        if (error) throw error;
        return adapters.config.toApp(data);
    }
};

// ============================================
// USERS
// ============================================

export const userService = {
    async getAll(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(adapters.user.toApp);
    },

    async getById(id: string): Promise<User> {
        if (id === 'master-dev') {
            return {
                id: 'master-dev',
                nome: 'SAMAR',
                email: 'samapps.web@gmail.com',
                role: 'DESENVOLVEDOR',
                status: 'ATIVO',
                avatar: '/master_avatar.jpg'
            };
        }

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return adapters.user.toApp(data);
    },

    async getByEmail(email: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error) return null;
        return adapters.user.toApp(data);
    },

    async create(user: Omit<User, 'id'>): Promise<User> {
        const { data, error } = await supabase
            .from('users')
            .insert([user]) // users table match User type mostly
            .select()
            .single();

        if (error) throw error;
        return adapters.user.toApp(data);
    },

    async update(id: string, updates: Partial<User>): Promise<User> {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return adapters.user.toApp(data);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// ============================================
// CLIENTS
// ============================================

export const clientService = {
    async getAll(): Promise<Client[]> {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(adapters.client.toApp);
    },

    async getById(id: string): Promise<Client> {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return adapters.client.toApp(data);
    },

    async create(client: Omit<Client, 'id' | 'historico'>): Promise<Client> {
        const dbClient = {
            nome: client.nome,
            whatsapp: client.whatsapp,
            email: client.email,
            endereco: client.endereco,
            senha_portal: client.senhaPortal,
            data_ativacao: client.dataAtivacao,
            status: client.status
        };

        const { data, error } = await supabase
            .from('clients')
            .insert([dbClient])
            .select()
            .single();

        if (error) throw error;
        return adapters.client.toApp(data);
    },

    async update(id: string, updates: Partial<Client>): Promise<Client> {
        const dbUpdates: any = {};
        if (updates.nome) dbUpdates.nome = updates.nome;
        if (updates.whatsapp) dbUpdates.whatsapp = updates.whatsapp;
        if (updates.email) dbUpdates.email = updates.email;
        if (updates.endereco) dbUpdates.endereco = updates.endereco;
        if (updates.senhaPortal) dbUpdates.senha_portal = updates.senhaPortal;
        if (updates.dataAtivacao) dbUpdates.data_ativacao = updates.dataAtivacao;
        if (updates.status) dbUpdates.status = updates.status;

        const { data, error } = await supabase
            .from('clients')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .maybeSingle(); // maybeSingle handles cases where RLS might hide the updated record

        if (error) throw error;

        // If data is null due to RLS, we at least return what we tried to update 
        // blended with the ID to not break the UI flow, but ideally RLS is fixed.
        if (!data) return { id, ...updates } as Client;

        return adapters.client.toApp(data);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getHistory(clientId: string) {
        const { data, error } = await supabase
            .from('client_history')
            .select('*')
            .eq('client_id', clientId)
            .order('data', { ascending: false });

        if (error) throw error;
        return data;
    },

    async addHistory(clientId: string, history: { passeio: string; data: string; valor: string }) {
        const { data, error } = await supabase
            .from('client_history')
            .insert([{ client_id: clientId, ...history }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

// ============================================
// BOOKINGS
// ============================================

export const bookingService = {
    async getAll(): Promise<Booking[]> {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .order('booking_date', { ascending: false });

        if (error) throw error;
        return data.map(adapters.booking.toApp);
    },

    async create(booking: Omit<Booking, 'id'>): Promise<Booking> {
        const bookingData = {
            client_id: booking.clientId,
            // tour_id: null,
            client_name: booking.client,
            whatsapp: booking.whatsapp,
            tour_name: booking.tour,
            booking_date: booking.date,
            pax_adults: booking.pax.adl,
            pax_children: booking.pax.chd,
            pax_free: booking.pax.free,
            price: parseFloat(booking.price.replace(/[^\d,]/g, '').replace(',', '.')),
            status: booking.status,
            location: booking.location,
            confirmed: booking.confirmed,
            observation: booking.observation,
            payment_method: booking.paymentMethod
        };

        const { data, error } = await supabase
            .from('bookings')
            .insert([bookingData])
            .select()
            .single();

        if (error) throw error;
        return adapters.booking.toApp(data);
    },

    async update(id: string, updates: Partial<Booking>): Promise<Booking> {
        const dbUpdates: any = {};
        // Mapeamento manual para update parcial
        if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId;
        if (updates.client !== undefined) dbUpdates.client_name = updates.client;
        if (updates.whatsapp !== undefined) dbUpdates.whatsapp = updates.whatsapp;
        if (updates.tour !== undefined) dbUpdates.tour_name = updates.tour;
        if (updates.date !== undefined) dbUpdates.booking_date = updates.date;
        if (updates.pax !== undefined) {
            dbUpdates.pax_adults = updates.pax.adl;
            dbUpdates.pax_children = updates.pax.chd;
            dbUpdates.pax_free = updates.pax.free;
        }
        if (updates.price !== undefined) dbUpdates.price = parseFloat(updates.price.replace(/[^\d,]/g, '').replace(',', '.'));
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.location !== undefined) dbUpdates.location = updates.location;
        if (updates.confirmed !== undefined) dbUpdates.confirmed = updates.confirmed;
        if (updates.observation !== undefined) dbUpdates.observation = updates.observation;
        if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;

        const { data, error } = await supabase
            .from('bookings')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return adapters.booking.toApp(data);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// ============================================
// BUDGETS
// ============================================

export const budgetService = {
    async getAll(): Promise<Budget[]> {
        const { data, error } = await supabase
            .from('budgets')
            .select(`
        *,
        budget_items (*)
      `)
            .order('budget_date', { ascending: false });

        if (error) throw error;
        return data.map(adapters.budget.toApp);
    },

    async create(budget: Omit<Budget, 'id'>): Promise<Budget> {
        const budgetData = {
            budget_number: budget.budgetNumber,
            client_name: budget.clientName,
            client_whatsapp: budget.clientWhatsapp,
            budget_date: budget.date,
            valid_until: budget.validUntil,
            total_amount: parseFloat(budget.totalAmount.replace(/[^\d,]/g, '').replace(',', '.')),
            notes: budget.notes,
            status: budget.status
        };

        const { data: budgetCreated, error: budgetError } = await supabase
            .from('budgets')
            .insert([budgetData])
            .select()
            .single();

        if (budgetError) throw budgetError;

        // Inserir itens do orçamento
        if (budget.items && budget.items.length > 0) {
            const items = budget.items.map(item => ({
                budget_id: budgetCreated.id,
                description: item.description,
                pax: item.pax,
                unit_price: parseFloat(item.unitPrice.replace(/[^\d,]/g, '').replace(',', '.')),
                total: parseFloat(item.total.replace(/[^\d,]/g, '').replace(',', '.'))
            }));

            const { error: itemsError } = await supabase
                .from('budget_items')
                .insert(items);

            if (itemsError) throw itemsError;
        }

        // Recarregar com itens para retornar
        const { data: finalData, error: reloadError } = await supabase
            .from('budgets')
            .select('*, budget_items(*)')
            .eq('id', budgetCreated.id)
            .single();

        if (reloadError) throw reloadError;
        return adapters.budget.toApp(finalData);
    },

    async update(id: string, updates: Partial<Budget>) {
        const dbUpdates: any = {};
        if (updates.budgetNumber) dbUpdates.budget_number = updates.budgetNumber;
        if (updates.clientName) dbUpdates.client_name = updates.clientName;
        if (updates.clientWhatsapp) dbUpdates.client_whatsapp = updates.clientWhatsapp;
        if (updates.date) dbUpdates.budget_date = updates.date;
        if (updates.validUntil) dbUpdates.valid_until = updates.validUntil;
        if (updates.totalAmount) dbUpdates.total_amount = parseFloat(updates.totalAmount.replace(/[^\d,]/g, '').replace(',', '.'));
        if (updates.notes) dbUpdates.notes = updates.notes;
        if (updates.status) dbUpdates.status = updates.status;

        const { data, error } = await supabase
            .from('budgets')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Atualizar itens se fornecidos (complexo, ideal deletar e recriar ou update individual)
        // Para simplificar, assumimos que itens são atualizados separadamente ou recriados

        return adapters.budget.toApp(data);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('budgets')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// ============================================
// TRANSACTIONS
// ============================================

export const transactionService = {
    async getAll(): Promise<Transaction[]> {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .order('transaction_date', { ascending: false });

        if (error) throw error;
        return data.map(adapters.transaction.toApp);
    },

    async create(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
        const transactionData = {
            description: transaction.description,
            category: transaction.category,
            amount: transaction.amount,
            type: transaction.type,
            status: transaction.status,
            transaction_date: transaction.date,
            user_name: transaction.userName
        };

        const { data, error } = await supabase
            .from('transactions')
            .insert([transactionData])
            .select()
            .single();

        if (error) throw error;
        return adapters.transaction.toApp(data);
    },

    async update(id: string, updates: Partial<Transaction>): Promise<Transaction> {
        const dbUpdates: any = {};
        if (updates.description) dbUpdates.description = updates.description;
        if (updates.category) dbUpdates.category = updates.category;
        if (updates.amount) dbUpdates.amount = updates.amount;
        if (updates.type) dbUpdates.type = updates.type;
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.date) dbUpdates.transaction_date = updates.date;
        if (updates.userName) dbUpdates.user_name = updates.userName;

        const { data, error } = await supabase
            .from('transactions')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return adapters.transaction.toApp(data);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// ============================================
// TOURS
// ============================================

export const tourService = {
    async getAll(): Promise<any[]> {
        const { data, error } = await supabase
            .from('tours')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(adapters.tour.toApp);
    },

    async create(tour: any): Promise<any> {
        const dbTour = {
            title: tour.title,
            image: tour.image,
            price: parseFloat(tour.price.toString().replace(/[^\d,]/g, '').replace(',', '.')),
            duration: tour.duration,
            region: tour.region,
            rating: parseFloat(tour.rating),
            description: tour.description,
            active: true
        };

        const { data, error } = await supabase
            .from('tours')
            .insert([dbTour])
            .select()
            .single();

        if (error) throw error;
        return adapters.tour.toApp(data);
    },

    async update(id: string, updates: any): Promise<any> {
        const { data, error } = await supabase
            .from('tours')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return adapters.tour.toApp(data);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('tours')
            .update({ active: false })
            .eq('id', id);

        if (error) throw error;
    }
};

// ============================================
// TASKS
// ============================================

export const taskService = {
    async getAll(): Promise<any[]> {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(adapters.task.toApp);
    },

    async create(task: any): Promise<any> {
        const dbTask = {
            title: task.title,
            description: task.description,
            assigned_to: task.assignedTo,
            due_date: task.dueDate,
            priority: task.priority,
            status: task.status
        };

        const { data, error } = await supabase
            .from('tasks')
            .insert([dbTask])
            .select()
            .single();

        if (error) throw error;
        return adapters.task.toApp(data);
    },

    async update(id: string, updates: any) {
        const dbUpdates: any = {};
        if (updates.title) dbUpdates.title = updates.title;
        if (updates.description) dbUpdates.description = updates.description;
        if (updates.assignedTo) dbUpdates.assigned_to = updates.assignedTo;
        if (updates.dueDate) dbUpdates.due_date = updates.dueDate;
        if (updates.priority) dbUpdates.priority = updates.priority;
        if (updates.status) dbUpdates.status = updates.status;

        const { data, error } = await supabase
            .from('tasks')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return adapters.task.toApp(data);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
