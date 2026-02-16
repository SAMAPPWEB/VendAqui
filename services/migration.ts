import { supabase } from './supabase';
import {
    userService,
    clientService,
    bookingService,
    budgetService,
    transactionService,
    tourService,
    taskService,
    configService
} from './databaseService';

export const migrateLocalStorageToSupabase = async () => {
    console.log('🚀 Iniciando migração para Supabase...');

    const report = {
        users: { success: 0, failed: 0 },
        clients: { success: 0, failed: 0 },
        bookings: { success: 0, failed: 0 },
        budgets: { success: 0, failed: 0 },
        transactions: { success: 0, failed: 0 },
        tours: { success: 0, failed: 0 },
        tasks: { success: 0, failed: 0 },
        config: { success: 0, failed: 0 },
        errors: [] as string[]
    };

    try {
        // 1. Config
        try {
            const configStr = localStorage.getItem('aq_config');
            if (configStr) {
                const config = JSON.parse(configStr);

                await configService.update({
                    instanceName: config.instanceName || config.instance_name || 'AGENDAQUI',
                    primaryColor: config.primaryColor || config.primary_color || '#F97316',
                    logo: config.logo,
                    cnpj: config.cnpj,
                    cadastur: config.cadastur,
                    address: config.address,
                    phone: config.phone,
                    instagram: config.instagram,
                    site: config.site,
                    pixKey: config.pixKey || config.pix_key
                });
                report.config.success++;
                console.log('✅ Configuração migrada');
            }
        } catch (e: any) {
            report.config.failed++;
            report.errors.push(`Config Error: ${e.message}`);
        }

        // 2. Users
        try {
            const usersStr = localStorage.getItem('aq_users');
            if (usersStr) {
                const users = JSON.parse(usersStr);
                for (const user of users) {
                    // Verificar se já existe
                    const existing = await userService.getByEmail(user.email);
                    if (!existing) {
                        await userService.create({
                            nome: user.nome,
                            email: user.email,
                            role: user.role,
                            status: user.status,
                            avatar: user.avatar,
                            senha: user.senha // Pode ser undefined, ok
                        });
                        report.users.success++;
                    }
                }
                console.log(`✅ Usuários migrados: ${report.users.success}`);
            }
        } catch (e: any) {
            report.users.failed++;
            report.errors.push(`Users Error: ${e.message}`);
        }

        // 3. Clients
        try {
            const clientsStr = localStorage.getItem('aq_clients');
            if (clientsStr) {
                const clients = JSON.parse(clientsStr);
                for (const client of clients) {
                    try {
                        const newClient = await clientService.create({
                            nome: client.nome,
                            whatsapp: client.whatsapp,
                            email: client.email,
                            endereco: client.endereco,
                            senhaPortal: client.senhaPortal,
                            dataAtivacao: client.dataAtivacao,
                            status: client.status
                        });
                        report.clients.success++;

                        // Migrar histórico do cliente se houver
                        if (client.historico && client.historico.length > 0) {
                            for (const hist of client.historico) {
                                await clientService.addHistory(newClient.id, {
                                    passeio: hist.passeio,
                                    data: hist.data,
                                    valor: hist.valor
                                });
                            }
                        }
                    } catch (err) {
                        console.error('Erro ao migrar cliente:', client.nome, err);
                        report.clients.failed++;
                    }
                }
                console.log(`✅ Clientes migrados: ${report.clients.success}`);
            }
        } catch (e: any) {
            report.clients.failed++;
            report.errors.push(`Clients Error: ${e.message}`);
        }

        // 4. Tours
        try {
            const toursStr = localStorage.getItem('aq_tours');
            if (toursStr) {
                const tours = JSON.parse(toursStr);
                for (const tour of tours) {
                    try {
                        await tourService.create({
                            title: tour.title,
                            image: tour.image,
                            price: tour.price,
                            duration: tour.duration,
                            region: tour.region,
                            rating: tour.rating,
                            description: tour.description || '',
                            active: true
                        });
                        report.tours.success++;
                    } catch (err) {
                        report.tours.failed++;
                    }
                }
                console.log(`✅ Passeios migrados: ${report.tours.success}`);
            }
        } catch (e: any) {
            report.tours.failed++;
            report.errors.push(`Tours Error: ${e.message}`);
        }

        // 5. Bookings
        // Precisaria mapear IDs de clientes e passeios, mas por enquanto vamos migrar como dados brutos onde possível
        // O service de create já trata client_id como string (que viria do localStorage).
        // Se os IDs do localStorage não forem UUIDs validos, o Supabase vai reclamar se tiver FK.
        // O schema define FK uuid. IDs do localStorage podem ser '1', '2'.
        // SOLUÇÃO: Gerar novos UUIDs e fazer match pelo nome/email/whatsapp seria o ideal, mas complexo.
        // Para simplificar: Se o ID não for UUID, o insert falhará na FK.
        // Estratégia: Tentar encontrar o cliente recém criado pelo whatsapp/nome.
        try {
            const bookingsStr = localStorage.getItem('aq_bookings');
            if (bookingsStr) {
                const bookings = JSON.parse(bookingsStr);
                const dbClients = await clientService.getAll(); // Busca todos clientes já migrados

                for (const booking of bookings) {
                    try {
                        // Tentar achar cliente correspondente
                        const clientMatch = dbClients?.find(c =>
                            c.whatsapp === booking.whatsapp ||
                            c.nome === booking.client ||
                            (c.email && c.email === booking.email)
                        );

                        if (clientMatch) {
                            await bookingService.create({
                                ...booking,
                                clientId: clientMatch.id // Usa o UUID novo do banco
                            });
                            report.bookings.success++;
                        } else {
                            // Cliente não encontrado, talvez criar um 'Cliente Desconhecido'?
                            // Ou pular. Para evitar erros, vamos pular e logar.
                            console.warn(`Booking ignorado: Cliente não encontrado para ${booking.client}`);
                            report.bookings.failed++;
                        }
                    } catch (err) {
                        report.bookings.failed++;
                    }
                }
                console.log(`✅ Reservas migradas: ${report.bookings.success}`);
            }
        } catch (e: any) {
            report.bookings.failed++;
            report.errors.push(`Bookings Error: ${e.message}`);
        }

        // 6. Budgets
        try {
            const budgetsStr = localStorage.getItem('aq_budgets');
            if (budgetsStr) {
                const budgets = JSON.parse(budgetsStr);
                for (const budget of budgets) {
                    try {
                        await budgetService.create(budget);
                        report.budgets.success++;
                    } catch (err) {
                        report.budgets.failed++;
                    }
                }
                console.log(`✅ Orçamentos migrados: ${report.budgets.success}`);
            }
        } catch (e: any) {
            report.budgets.failed++;
            report.errors.push(`Budgets Error: ${e.message}`);
        }

        // 7. Transactions
        try {
            const transStr = localStorage.getItem('aq_finances');
            if (transStr) {
                const transactions = JSON.parse(transStr);
                for (const trans of transactions) {
                    try {
                        await transactionService.create(trans);
                        report.transactions.success++;
                    } catch (err) {
                        report.transactions.failed++;
                    }
                }
                console.log(`✅ Transações migradas: ${report.transactions.success}`);
            }
        } catch (e: any) {
            report.transactions.failed++;
            report.errors.push(`Transactions Error: ${e.message}`);
        }

        // 8. Tasks
        try {
            const tasksStr = localStorage.getItem('aq_tasks');
            if (tasksStr) {
                const tasks = JSON.parse(tasksStr);
                for (const task of tasks) {
                    try {
                        // Tentar achar usuário atribuído
                        // Se assignedTo for ID numérico, pode falhar se não acharmos o user UUID.
                        // O ideal seria buscar usuário pelo nome se possível, ou deixar null.
                        await taskService.create({
                            title: task.title,
                            description: task.description,
                            assignedTo: null, // Resetar assignment para evitar erro de FK
                            dueDate: task.dueDate,
                            priority: task.priority,
                            status: task.status
                        });
                        report.tasks.success++;
                    } catch (err) {
                        report.tasks.failed++;
                    }
                }
                console.log(`✅ Tarefas migradas: ${report.tasks.success}`);
            }
        } catch (e: any) {
            report.tasks.failed++;
            report.errors.push(`Tasks Error: ${e.message}`);
        }

    } catch (error: any) {
        console.error('❌ Erro fatal na migração:', error);
        report.errors.push(`Fatal: ${error.message}`);
    }

    console.log('🏁 Migração concluída!', report);
    return report;
};
