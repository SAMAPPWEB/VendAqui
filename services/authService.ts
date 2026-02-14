import { supabase } from './supabase';
import { User, UserRole } from '../types';
import bcrypt from 'bcryptjs';

export const authService = {
    async login(emailOrUser: string, senha?: string): Promise<User | null> {
        try {
            const identifier = emailOrUser.trim();

            // ============================================
            // MASTER LOGIN (HARDCODED)
            // ============================================
            if ((identifier.toLowerCase() === 'samar' || identifier.toLowerCase() === 'samapps.web@gmail.com') && senha === 'samapp123') {
                return {
                    id: 'master-dev',
                    nome: 'SAMAR',
                    email: 'samapps.web@gmail.com',
                    role: 'DESENVOLVEDOR',
                    status: 'ATIVO',
                    avatar: '/master_avatar.jpg' // Foto local enviada pelo usuário
                };
            }

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .or(`email.ilike.${identifier},nome.ilike.${identifier}`)
                .eq('status', 'ATIVO')
                .maybeSingle();

            if (error || !data) return null;

            if (senha && data.senha) {
                const isMatch = await bcrypt.compare(senha, data.senha).catch(() => false);

                // Fallback for plain text passwords
                if (!isMatch && data.senha === senha) {
                    return data as User;
                }

                if (!isMatch) return null;
            } else if (senha || data.senha) {
                return null;
            }

            return data as User;
        } catch (error) {
            console.error('Erro no login:', error);
            return null;
        }
    },

    async clientLogin(identifier: string, senha?: string): Promise<any | null> {
        try {
            const cleanIdentifier = identifier.trim();

            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .or(`email.ilike.${cleanIdentifier},whatsapp.ilike.${cleanIdentifier}`)
                .eq('status', 'ATIVO')
                .maybeSingle();

            if (error || !data) return null;

            if (data.senha_portal && senha && data.senha_portal !== senha) {
                return null;
            }

            return {
                ...data,
                role: 'CLIENTE' as UserRole
            };
        } catch (error) {
            console.error('Erro no login de cliente:', error);
            return null;
        }
    }
};
