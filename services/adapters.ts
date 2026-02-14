import { User, Client, Booking, Budget, Transaction, WhiteLabelConfig } from '../types';

export const adapters = {
    config: {
        toApp(dbConfig: any): WhiteLabelConfig {
            return {
                logo: dbConfig.logo,
                primaryColor: dbConfig.primary_color,
                instanceName: dbConfig.instance_name,
                cnpj: dbConfig.cnpj,
                cadastur: dbConfig.cadastur,
                address: dbConfig.address,
                phone: dbConfig.phone,
                instagram: dbConfig.instagram,
                site: dbConfig.site,
                pixKey: dbConfig.pix_key
            };
        },
        toDb(appConfig: Partial<WhiteLabelConfig>): any {
            const map: any = {};
            if (appConfig.logo !== undefined) map.logo = appConfig.logo;
            if (appConfig.primaryColor !== undefined) map.primary_color = appConfig.primaryColor;
            if (appConfig.instanceName !== undefined) map.instance_name = appConfig.instanceName;
            if (appConfig.cnpj !== undefined) map.cnpj = appConfig.cnpj;
            if (appConfig.cadastur !== undefined) map.cadastur = appConfig.cadastur;
            if (appConfig.address !== undefined) map.address = appConfig.address;
            if (appConfig.phone !== undefined) map.phone = appConfig.phone;
            if (appConfig.instagram !== undefined) map.instagram = appConfig.instagram;
            if (appConfig.site !== undefined) map.site = appConfig.site;
            if (appConfig.pixKey !== undefined) map.pix_key = appConfig.pixKey;
            return map;
        }
    },

    user: {
        toApp(dbUser: any): User {
            return {
                id: dbUser.id,
                nome: dbUser.nome,
                email: dbUser.email,
                role: dbUser.role,
                status: dbUser.status,
                avatar: dbUser.avatar,
                senha: dbUser.senha
            };
        }
    },

    client: {
        toApp(dbClient: any): Client {
            return {
                id: dbClient.id,
                nome: dbClient.nome,
                whatsapp: dbClient.whatsapp,
                email: dbClient.email,
                endereco: dbClient.endereco,
                senhaPortal: dbClient.senha_portal,
                dataAtivacao: dbClient.data_ativacao,
                status: dbClient.status,
                historico: [],
                createdAt: dbClient.created_at,
                updatedAt: dbClient.updated_at
            };
        }
    },

    booking: {
        toApp(dbBooking: any): Booking {
            return {
                id: dbBooking.id,
                clientId: dbBooking.client_id,
                client: dbBooking.client_name,
                whatsapp: dbBooking.whatsapp,
                tour: dbBooking.tour_name,
                date: dbBooking.booking_date,
                pax: {
                    adl: dbBooking.pax_adults,
                    chd: dbBooking.pax_children,
                    free: dbBooking.pax_free
                },
                price: dbBooking.price.toString(),
                status: dbBooking.status,
                location: dbBooking.location,
                confirmed: dbBooking.confirmed,
                observation: dbBooking.observation,
                paymentMethod: dbBooking.payment_method,
                createdAt: dbBooking.created_at,
                updatedAt: dbBooking.updated_at
            };
        }
    },

    budget: {
        toApp(dbBudget: any): Budget {
            return {
                id: dbBudget.id,
                budgetNumber: dbBudget.budget_number,
                clientName: dbBudget.client_name,
                clientWhatsapp: dbBudget.client_whatsapp,
                date: dbBudget.budget_date,
                validUntil: dbBudget.valid_until,
                items: dbBudget.budget_items ? dbBudget.budget_items.map((item: any) => ({
                    id: item.id,
                    description: item.description,
                    pax: item.pax,
                    unitPrice: item.unit_price.toString(),
                    total: item.total.toString()
                })) : [],
                totalAmount: dbBudget.total_amount.toString(),
                notes: dbBudget.notes,
                status: dbBudget.status,
                createdAt: dbBudget.created_at,
                updatedAt: dbBudget.updated_at
            };
        }
    },

    transaction: {
        toApp(dbTrans: any): Transaction {
            return {
                id: dbTrans.id,
                description: dbTrans.description,
                category: dbTrans.category,
                amount: dbTrans.amount,
                type: dbTrans.type,
                status: dbTrans.status,
                date: dbTrans.transaction_date,
                userName: dbTrans.user_name,
                createdAt: dbTrans.created_at,
                updatedAt: dbTrans.updated_at
            };
        }
    },

    task: {
        toApp(dbTask: any): any {
            return {
                id: dbTask.id,
                title: dbTask.title,
                description: dbTask.description,
                assignedTo: dbTask.assigned_to,
                dueDate: dbTask.due_date,
                priority: dbTask.priority,
                status: dbTask.status
            };
        }
    },

    tour: {
        toApp(dbTour: any): any {
            return {
                id: dbTour.id,
                title: dbTour.title,
                image: dbTour.image,
                price: dbTour.price.toString(),
                duration: dbTour.duration,
                region: dbTour.region,
                rating: dbTour.rating.toString(),
                description: dbTour.description,
                active: dbTour.active
            };
        }
    }
};
