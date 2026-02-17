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
                senha: dbUser.senha,
                whatsapp: dbUser.whatsapp,
                cnpj: dbUser.cnpj,
                endereco: dbUser.endereco,
                dailyRate: dbUser.daily_rate ? dbUser.daily_rate.toString() : "0"
            };
        },
        toDb(appUser: Partial<User>): any {
            const map: any = {};
            if (appUser.nome !== undefined) map.nome = appUser.nome;
            if (appUser.email !== undefined) map.email = appUser.email;
            if (appUser.role !== undefined) map.role = appUser.role;
            if (appUser.status !== undefined) map.status = appUser.status;
            if (appUser.avatar !== undefined) map.avatar = appUser.avatar;
            if (appUser.senha !== undefined) map.senha = appUser.senha;
            if (appUser.whatsapp !== undefined) map.whatsapp = appUser.whatsapp;
            if (appUser.cnpj !== undefined) map.cnpj = appUser.cnpj;
            if (appUser.endereco !== undefined) map.endereco = appUser.endereco;
            if (appUser.dailyRate !== undefined) {
                map.daily_rate = typeof appUser.dailyRate === 'string'
                    ? parseFloat(appUser.dailyRate.replace(/[^\d,]/g, '').replace(',', '.'))
                    : appUser.dailyRate;
            }
            return map;
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
        },
        toDb(appClient: Partial<Client>): any {
            const map: any = {};
            if (appClient.nome !== undefined) map.nome = appClient.nome;
            if (appClient.whatsapp !== undefined) map.whatsapp = appClient.whatsapp;
            if (appClient.email !== undefined) map.email = appClient.email;
            if (appClient.endereco !== undefined) map.endereco = appClient.endereco;
            if (appClient.senhaPortal !== undefined) map.senha_portal = appClient.senhaPortal;
            if (appClient.dataAtivacao !== undefined) map.data_ativacao = appClient.dataAtivacao;
            if (appClient.status !== undefined) map.status = appClient.status;
            return map;
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
                price: dbBooking.price ? dbBooking.price.toString() : "0",
                status: dbBooking.status,
                location: dbBooking.location,
                confirmed: dbBooking.confirmed,
                guideId: dbBooking.guide_id,
                guideName: dbBooking.guide_name,
                guideRevenue: dbBooking.guide_revenue ? dbBooking.guide_revenue.toString() : "0",
                observation: dbBooking.observation,
                paymentMethod: dbBooking.payment_method,
                createdAt: dbBooking.created_at,
                updatedAt: dbBooking.updated_at
            };
        },
        toDb(appBooking: Partial<Booking>): any {
            const map: any = {};
            if (appBooking.clientId !== undefined) map.client_id = appBooking.clientId;
            if (appBooking.client !== undefined) map.client_name = appBooking.client;
            if (appBooking.whatsapp !== undefined) map.whatsapp = appBooking.whatsapp;
            if (appBooking.tour !== undefined) map.tour_name = appBooking.tour;
            if (appBooking.date !== undefined) {
                // Converte DD/MM/AAAA para AAAA-MM-DD
                const parts = appBooking.date.split('/');
                map.booking_date = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : appBooking.date;
            }
            if (appBooking.pax !== undefined) {
                map.pax_adults = appBooking.pax.adl;
                map.pax_children = appBooking.pax.chd;
                map.pax_free = appBooking.pax.free;
            }
            if (appBooking.price !== undefined) {
                // Trata conversão de string formatada para number
                map.price = typeof appBooking.price === 'string'
                    ? parseFloat(appBooking.price.replace(/[^\d,]/g, '').replace(',', '.'))
                    : appBooking.price;
            }
            if (appBooking.status !== undefined) map.status = appBooking.status;
            if (appBooking.location !== undefined) map.location = appBooking.location;
            if (appBooking.confirmed !== undefined) map.confirmed = appBooking.confirmed;
            if (appBooking.guideId !== undefined) map.guide_id = appBooking.guideId;
            if (appBooking.guideName !== undefined) map.guide_name = appBooking.guideName;
            if (appBooking.observation !== undefined) map.observation = appBooking.observation;
            if (appBooking.paymentMethod !== undefined) map.payment_method = appBooking.paymentMethod;
            if (appBooking.guideRevenue !== undefined) {
                map.guide_revenue = typeof appBooking.guideRevenue === 'string'
                    ? parseFloat(appBooking.guideRevenue.replace(/[^\d,]/g, '').replace(',', '.'))
                    : appBooking.guideRevenue;
            }
            return map;
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
                    unitPrice: item.unit_price ? item.unit_price.toString() : "0",
                    total: item.total ? item.total.toString() : "0"
                })) : [],
                totalAmount: dbBudget.total_amount ? dbBudget.total_amount.toString() : "0",
                notes: dbBudget.notes,
                status: dbBudget.status,
                createdAt: dbBudget.created_at,
                updatedAt: dbBudget.updated_at
            };
        },
        toDb(appBudget: Partial<Budget>): any {
            const map: any = {};
            if (appBudget.budgetNumber !== undefined) map.budget_number = appBudget.budgetNumber;
            if (appBudget.clientName !== undefined) map.client_name = appBudget.clientName;
            if (appBudget.clientWhatsapp !== undefined) map.client_whatsapp = appBudget.clientWhatsapp;
            if (appBudget.date !== undefined) {
                // Converte DD/MM/AAAA para AAAA-MM-DD
                const parts = appBudget.date.split('/');
                map.budget_date = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : appBudget.date;
            }
            if (appBudget.validUntil !== undefined) {
                // Converte DD/MM/AAAA para AAAA-MM-DD
                const parts = appBudget.validUntil.split('/');
                map.valid_until = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : appBudget.validUntil;
            }
            if (appBudget.totalAmount !== undefined) {
                map.total_amount = typeof appBudget.totalAmount === 'string'
                    ? parseFloat(appBudget.totalAmount.replace(/[^\d,]/g, '').replace(',', '.'))
                    : appBudget.totalAmount;
            }
            if (appBudget.notes !== undefined) map.notes = appBudget.notes;
            if (appBudget.status !== undefined) map.status = appBudget.status;
            return map;
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
        },
        toDb(appTrans: Partial<Transaction>): any {
            const map: any = {};
            if (appTrans.description !== undefined) map.description = appTrans.description;
            if (appTrans.category !== undefined) map.category = appTrans.category;
            if (appTrans.amount !== undefined) map.amount = appTrans.amount;
            if (appTrans.type !== undefined) map.type = appTrans.type;
            if (appTrans.status !== undefined) map.status = appTrans.status;
            if (appTrans.date !== undefined) map.transaction_date = appTrans.date;
            if (appTrans.userName !== undefined) map.user_name = appTrans.userName;
            return map;
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
        },
        toDb(appTask: any): any {
            const map: any = {};
            if (appTask.title !== undefined) map.title = appTask.title;
            if (appTask.description !== undefined) map.description = appTask.description;
            if (appTask.assignedTo !== undefined) map.assigned_to = appTask.assignedTo;
            if (appTask.dueDate !== undefined) map.due_date = appTask.dueDate;
            if (appTask.priority !== undefined) map.priority = appTask.priority;
            if (appTask.status !== undefined) map.status = appTask.status;
            return map;
        }
    },

    tour: {
        toApp(dbTour: any): any {
            return {
                id: dbTour.id,
                title: dbTour.title,
                image: dbTour.image,
                price: dbTour.price ? dbTour.price.toString() : "0",
                duration: dbTour.duration,
                region: dbTour.region,
                rating: dbTour.rating ? dbTour.rating.toString() : "0",
                description: dbTour.description,
                active: dbTour.active
            };
        },
        toDb(appTour: any): any {
            const map: any = {};
            if (appTour.title !== undefined) map.title = appTour.title;
            if (appTour.image !== undefined) map.image = appTour.image;
            if (appTour.price !== undefined) {
                map.price = typeof appTour.price === 'string'
                    ? parseFloat(appTour.price.replace(/[^\d,]/g, '').replace(',', '.'))
                    : appTour.price;
            }
            if (appTour.duration !== undefined) map.duration = appTour.duration;
            if (appTour.region !== undefined) map.region = appTour.region;
            if (appTour.rating !== undefined) map.rating = parseFloat(String(appTour.rating));
            if (appTour.description !== undefined) map.description = appTour.description;
            if (appTour.active !== undefined) map.active = appTour.active;
            return map;
        }
    },

    bookingMedia: {
        toApp(dbMedia: any): any {
            return {
                id: dbMedia.id,
                bookingId: dbMedia.booking_id,
                folderName: dbMedia.folder_name,
                url: dbMedia.url,
                filename: dbMedia.filename,
                createdAt: dbMedia.created_at
            };
        },
        toDb(appMedia: any): any {
            const map: any = {};
            if (appMedia.bookingId !== undefined) map.booking_id = appMedia.bookingId;
            if (appMedia.folderName !== undefined) map.folder_name = appMedia.folderName;
            if (appMedia.url !== undefined) map.url = appMedia.url;
            if (appMedia.filename !== undefined) map.filename = appMedia.filename;
            return map;
        }
    }
};

