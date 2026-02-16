// Serviço de banco de dados para AGENDAQUI
import { supabase } from './supabase';
import { adapters } from './adapters';
import type { User, Client, Booking, Budget, Transaction, WhiteLabelConfig } from '../types';

// Utility for database errors
const handleDbError = (error: any, context: string) => {
    console.error(`Database Error [${context}]:`, error);
    throw new Error(`Erro no banco de dados (${context}): ${error.message}${error.hint ? ' - ' + error.hint : ''}`);
};

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
        const dbUpdates = adapters.config.toDb(updates);

        // Precisamos do ID. Assumindo que só há 1 config.
        const { data: current, error: currentError } = await supabase.from('config').select('id').limit(1).maybeSingle();
        if (currentError) handleDbError(currentError, 'config.update.find');

        let query;
        if (current) {
            query = supabase.from('config').update(dbUpdates).eq('id', current.id);
        } else {
            query = supabase.from('config').insert([dbUpdates]);
        }

        const { data, error } = await query.select().single();
        if (error) handleDbError(error, 'config.update.save');

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

        if (error) handleDbError(error, 'users.getAll');
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

        if (error) handleDbError(error, 'users.getById');
        return adapters.user.toApp(data);
    },

    async getByEmail(email: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (error || !data) return null;
        return adapters.user.toApp(data);
    },

    async create(user: Omit<User, 'id'>): Promise<User> {
        const dbUser = adapters.user.toDb(user);
        const { data, error } = await supabase
            .from('users')
            .insert([dbUser])
            .select()
            .single();

        if (error) handleDbError(error, 'users.create');
        return adapters.user.toApp(data);
    },

    async update(id: string, updates: Partial<User>): Promise<User> {
        const dbUpdates = adapters.user.toDb(updates);
        const { data, error } = await supabase
            .from('users')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) handleDbError(error, 'users.update');
        return adapters.user.toApp(data);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) handleDbError(error, 'users.delete');
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

        if (error) handleDbError(error, 'clients.getAll');
        return data.map(adapters.client.toApp);
    },

    async getById(id: string): Promise<Client> {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .single();

        if (error) handleDbError(error, 'clients.getById');
        return adapters.client.toApp(data);
    },

    async create(client: Omit<Client, 'id' | 'historico'>): Promise<Client> {
        const dbClient = adapters.client.toDb(client);
        const { data, error } = await supabase
            .from('clients')
            .insert([dbClient])
            .select()
            .single();

        if (error) handleDbError(error, 'clients.create');
        return adapters.client.toApp(data);
    },

    async update(id: string, updates: Partial<Client>): Promise<Client> {
        const dbUpdates = adapters.client.toDb(updates);
        const { data, error } = await supabase
            .from('clients')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) handleDbError(error, 'clients.update');
        if (!data) return { id, ...updates } as Client;

        return adapters.client.toApp(data);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id);

        if (error) handleDbError(error, 'clients.delete');
    },

    async getHistory(clientId: string) {
        const { data, error } = await supabase
            .from('client_history')
            .select('*')
            .eq('client_id', clientId)
            .order('data', { ascending: false });

        if (error) handleDbError(error, 'clients.getHistory');
        return data;
    },

    async addHistory(clientId: string, history: { passeio: string; data: string; valor: string }) {
        const { data, error } = await supabase
            .from('client_history')
            .insert([{ client_id: clientId, ...history }])
            .select()
            .single();

        if (error) handleDbError(error, 'clients.addHistory');
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

        if (error) handleDbError(error, 'bookings.getAll');
        return data.map(adapters.booking.toApp);
    },

    async create(booking: Omit<Booking, 'id'>): Promise<Booking> {
        const dbBooking = adapters.booking.toDb(booking);
        const { data, error } = await supabase
            .from('bookings')
            .insert([dbBooking])
            .select()
            .single();

        if (error) handleDbError(error, 'bookings.create');
        return adapters.booking.toApp(data);
    },

    async update(id: string, updates: Partial<Booking>): Promise<Booking> {
        const dbUpdates = adapters.booking.toDb(updates);
        const { data, error } = await supabase
            .from('bookings')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) handleDbError(error, 'bookings.update');
        return adapters.booking.toApp(data);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', id);

        if (error) handleDbError(error, 'bookings.delete');
    }
};

// ============================================
// BUDGETS
// ============================================

export const budgetService = {
    async getAll(): Promise<Budget[]> {
        const { data, error } = await supabase
            .from('budgets')
            .select('*, budget_items (*)')
            .order('budget_date', { ascending: false });

        if (error) handleDbError(error, 'budgets.getAll');
        return data.map(adapters.budget.toApp);
    },

    async create(budget: Omit<Budget, 'id'>): Promise<Budget> {
        const dbBudget = adapters.budget.toDb(budget);
        const { data: budgetCreated, error: budgetError } = await supabase
            .from('budgets')
            .insert([dbBudget])
            .select()
            .single();

        if (budgetError) handleDbError(budgetError, 'budgets.create');

        // Itens
        if (budget.items && budget.items.length > 0) {
            const items = budget.items.map(item => ({
                budget_id: budgetCreated.id,
                description: item.description,
                pax: item.pax,
                unit_price: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice.replace(/[^\d,]/g, '').replace(',', '.')) : item.unitPrice,
                total: typeof item.total === 'string' ? parseFloat(item.total.replace(/[^\d,]/g, '').replace(',', '.')) : item.total
            }));

            const { error: itemsError } = await supabase.from('budget_items').insert(items);
            if (itemsError) handleDbError(itemsError, 'budgets.create.items');
        }

        const { data: finalData, error: reloadError } = await supabase
            .from('budgets')
            .select('*, budget_items(*)')
            .eq('id', budgetCreated.id)
            .single();

        if (reloadError) handleDbError(reloadError, 'budgets.create.reload');
        return adapters.budget.toApp(finalData);
    },

    async update(id: string, updates: Partial<Budget>) {
        const dbUpdates = adapters.budget.toDb(updates);
        const { data, error } = await supabase
            .from('budgets')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) handleDbError(error, 'budgets.update');
        return adapters.budget.toApp(data);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('budgets')
            .delete()
            .eq('id', id);

        if (error) handleDbError(error, 'budgets.delete');
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

        if (error) handleDbError(error, 'transactions.getAll');
        return data.map(adapters.transaction.toApp);
    },

    async create(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
        const dbTrans = adapters.transaction.toDb(transaction);
        const { data, error } = await supabase
            .from('transactions')
            .insert([dbTrans])
            .select()
            .single();

        if (error) handleDbError(error, 'transactions.create');
        return adapters.transaction.toApp(data);
    },

    async update(id: string, updates: Partial<Transaction>): Promise<Transaction> {
        const dbUpdates = adapters.transaction.toDb(updates);
        const { data, error } = await supabase
            .from('transactions')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) handleDbError(error, 'transactions.update');
        return adapters.transaction.toApp(data);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id);

        if (error) handleDbError(error, 'transactions.delete');
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

        if (error) handleDbError(error, 'tours.getAll');
        return data.map(adapters.tour.toApp);
    },

    async create(tour: any): Promise<any> {
        const dbTour = adapters.tour.toDb(tour);
        const { data, error } = await supabase
            .from('tours')
            .insert([dbTour])
            .select()
            .single();

        if (error) handleDbError(error, 'tours.create');
        return adapters.tour.toApp(data);
    },

    async update(id: string, updates: any): Promise<any> {
        const dbUpdates = adapters.tour.toDb(updates);
        const { data, error } = await supabase
            .from('tours')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) handleDbError(error, 'tours.update');
        return adapters.tour.toApp(data);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('tours')
            .update({ active: false })
            .eq('id', id);

        if (error) handleDbError(error, 'tours.delete');
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

        if (error) handleDbError(error, 'tasks.getAll');
        return data.map(adapters.task.toApp);
    },

    async create(task: any): Promise<any> {
        const dbTask = adapters.task.toDb(task);
        const { data, error } = await supabase
            .from('tasks')
            .insert([dbTask])
            .select()
            .single();

        if (error) handleDbError(error, 'tasks.create');
        return adapters.task.toApp(data);
    },

    async update(id: string, updates: any) {
        const dbUpdates = adapters.task.toDb(updates);
        const { data, error } = await supabase
            .from('tasks')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) handleDbError(error, 'tasks.update');
        return adapters.task.toApp(data);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) handleDbError(error, 'tasks.delete');
    }
};

