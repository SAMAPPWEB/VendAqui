import React, { useState, useEffect, useMemo, useRef } from "react";
import { User, WhiteLabelConfig, Booking, Budget, Client, Transaction, Tour } from "./types";
import AuthView from "./components/AuthView";
import DashboardView from "./components/DashboardView";
import BookingsView from "./components/BookingsView";
import ToursView from "./components/ToursView";
import SettingsView from "./components/SettingsView";
import TasksView from "./components/TasksView";
import ClientsView from "./components/ClientsView";
import UsersView from "./components/UsersView";
import BudgetsView from "./components/BudgetsView";
import ClientPortalView from "./components/ClientPortalView";
import FinancialView from "./components/FinancialView";
import TideWidget from "./components/TideWidget";
import GuidesView from "./components/GuidesView";
import {
  Plus, CalendarCheck, Receipt, Wallet, IdentificationBadge, MapTrifold, House,
  ArrowLeft, SignOut, User as UserIcon, Users as UsersIcon, Bell, X, Warning, CircleNotch, UserCircle, Gear, IdentificationCard
} from "phosphor-react";

// Import Services
import { configService, userService, bookingService, clientService, budgetService, transactionService, tourService, taskService } from "./services/databaseService";
import { authService } from "./services/authService";

export type AppView = 'DASHBOARD' | 'BOOKINGS' | 'TOURS' | 'SETTINGS' | 'TASKS' | 'CLIENTS' | 'USERS' | 'PORTAL' | 'BUDGETS' | 'FINANCIAL' | 'GUIDES';

const DEFAULT_CONFIG: WhiteLabelConfig = {
  logo: null,
  primaryColor: '#F97316',
  instanceName: 'AGENDAQUI',
  cnpj: '',
  cadastur: '',
  address: '',
  phone: '',
  instagram: '',
  site: '',
  pixKey: ''
};

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('DASHBOARD');
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationSound = useRef<HTMLAudioElement | null>(null);
  const prevNotificationCount = useRef(0);

  // Data State
  const [whiteLabel, setWhiteLabel] = useState<WhiteLabelConfig>(DEFAULT_CONFIG);
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Initial Load
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      try {
        const dbConfig = await configService.get();
        if (dbConfig) setWhiteLabel(dbConfig);

        // Auto-login via URL (Magic Link logic)
        const url = new URL(window.location.href);
        const urlUser = url.searchParams.get('u');
        const urlKey = url.searchParams.get('k');

        if (urlUser && urlKey) {
          console.log('🔍 Detectado Link Mágico para:', urlUser);
          const user = await authService.login(urlUser, urlKey);
          if (user) {
            console.log('✅ Login Mágico realizado com sucesso!');
            await handleLogin(user);
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
          } else {
            console.warn('❌ Falha no login mágico.');
          }
        }

        const storedUserId = localStorage.getItem('agendaqui_user_id');
        if (storedUserId) {
          const user = await userService.getById(storedUserId);
          if (user && user.status === 'ATIVO') {
            setCurrentUser(user);
            const [dbUsers, dbClients, dbBookings, dbBudgets, dbTrans, dbTours, dbTasks] = await Promise.all([
              userService.getAll(),
              clientService.getAll(),
              bookingService.getAll(),
              budgetService.getAll(),
              transactionService.getAll(),
              tourService.getAll(),
              taskService.getAll()
            ]);

            setUsers(dbUsers);
            setClients(dbClients);
            setBookings(dbBookings);
            setBudgets(dbBudgets);
            setTransactions(dbTrans);
            setTours(dbTours);
            setTasks(dbTasks);
          } else {
            localStorage.removeItem('agendaqui_user_id');
          }
        }
      } catch (error) {
        console.error("Erro na inicialização:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);


  const handleLogin = async (user: User) => {
    if (!user.id) return;
    try {
      localStorage.setItem('agendaqui_user_id', user.id);
      setCurrentUser(user);

      setIsLoading(true);
      const [dbUsers, dbClients, dbBookings, dbBudgets, dbTrans, dbTours, dbTasks] = await Promise.all([
        userService.getAll(),
        clientService.getAll(),
        bookingService.getAll(),
        budgetService.getAll(),
        transactionService.getAll(),
        tourService.getAll(),
        taskService.getAll()
      ]);

      setUsers(dbUsers);
      setClients(dbClients);
      setBookings(dbBookings);
      setBudgets(dbBudgets);
      setTransactions(dbTrans);
      setTours(dbTours);
      setTasks(dbTasks);

      setCurrentView(user.role === 'CLIENTE' ? 'PORTAL' : 'DASHBOARD');
    } catch (e) {
      console.error("Erro ao carregar dados pós-login:", e);
      alert("Erro ao carregar dados do sistema.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Deseja sair do sistema?")) {
      localStorage.removeItem('agendaqui_user_id');
      setCurrentUser(null);
      setCurrentView('DASHBOARD');
      setBookings([]);
      setClients([]);
    }
  };

  const handleConfigUpdate = async (newConfig: WhiteLabelConfig) => {
    try {
      await configService.update(newConfig);
      setWhiteLabel(newConfig);
    } catch (e) {
      alert("Erro ao salvar configurações.");
      console.error(e);
    }
  };

  const renderView = () => {
    if (currentUser?.role === 'CLIENTE') return <ClientPortalView clientName={currentUser.nome} clientId={currentUser.id} onLogout={handleLogout} />;
    switch (currentView) {
      case 'DASHBOARD': return <DashboardView user={currentUser!} bookings={bookings} clients={clients} transactions={transactions} tours={tours} />;
      case 'BOOKINGS': return <BookingsView config={whiteLabel} bookings={bookings} setBookings={setBookings} clients={clients} onUpdateClients={setClients} tours={tours} users={users} />;
      case 'BUDGETS': return <BudgetsView config={whiteLabel} budgets={budgets} setBudgets={setBudgets} user={currentUser!} clients={clients} onUpdateClients={setClients} tours={tours} users={users} />;
      case 'FINANCIAL': return <FinancialView transactions={transactions} onUpdateTransactions={setTransactions} currentUser={currentUser!} />;
      case 'TOURS': return <ToursView tours={tours} onUpdateTours={setTours} />;
      case 'TASKS': return <TasksView tasks={tasks} onUpdateTasks={setTasks} />;
      case 'CLIENTS': return <ClientsView clients={clients} onUpdateClients={setClients} />;
      case 'USERS': return <UsersView users={users} onUpdateUsers={setUsers} />;
      case 'GUIDES': return <GuidesView currentUser={currentUser!} users={users} onUpdateUsers={setUsers} bookings={bookings} config={whiteLabel} tasks={tasks} onUpdateTasks={setTasks} transactions={transactions} />;
      case 'SETTINGS': return <SettingsView user={currentUser!} config={whiteLabel} onUpdate={handleConfigUpdate} onExit={() => setCurrentView('DASHBOARD')} onLogout={handleLogout} onNavigate={setCurrentView} />;
      default: return <DashboardView user={currentUser!} bookings={bookings} clients={clients} transactions={transactions} tours={tours} />;
    }
  };

  const notifications = useMemo(() => {
    const list: any[] = [];
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const formatTime = (d: string | Date) => {
      const date = new Date(d);
      // Format: Segunda-feira, 31/12/2024 14:30:45
      const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });
      const fullDate = date.toLocaleDateString('pt-BR');
      const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return `${weekday}, ${fullDate} ${time}`;
    };

    bookings.forEach(b => {
      const bDate = new Date(b.date);
      if (bDate >= now && bDate <= next24h) {
        list.push({
          id: `service-${b.id}`,
          title: "Serviço Próximo",
          description: `${b.tour} - ${b.client}`,
          type: 'SERVICE',
          date: b.date,
          time: formatTime(b.date),
          userName: 'SISTEMA'
        });
      }
    });

    bookings.forEach(b => {
      if (b.createdAt && new Date(b.createdAt) >= last24h) {
        list.push({
          id: `new-booking-${b.id}`,
          title: "Novo Agendamento",
          description: `${b.client} reservou ${b.tour}`,
          type: 'NEW',
          date: b.createdAt,
          time: formatTime(b.createdAt),
          userName: 'EQUIPE'
        });
      }
    });

    budgets.forEach(b => {
      if (b.createdAt && new Date(b.createdAt) >= last24h) {
        list.push({
          id: `new-budget-${b.id}`,
          title: "Novo Orçamento",
          description: `Para ${b.clientName}`,
          type: 'NEW',
          date: b.createdAt,
          time: formatTime(b.createdAt),
          userName: 'EQUIPE'
        });
      }
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bookings, budgets]);

  // Notificação com Som (Sinalizador)
  useEffect(() => {
    if (notifications.length > prevNotificationCount.current) {
      if (!notificationSound.current) {
        // Sinalizador mais robusto
        notificationSound.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-bright-software-button-interaction-1135.mp3');
        notificationSound.current.volume = 0.6;
      }
      notificationSound.current.play().catch(e => console.log('Som bloqueado pelo navegador:', e));
    }
    prevNotificationCount.current = notifications.length;
  }, [notifications]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-400 gap-4">
        <CircleNotch size={48} className="animate-spin text-orange-500" />
        <div className="text-center">
          <h2 className="text-sm font-black uppercase tracking-widest">Carregando Sistema</h2>
          <p className="text-[10px] uppercase mt-1">Conectando ao banco de dados...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <AuthView onLogin={handleLogin} />;
  const isClient = currentUser.role === 'CLIENTE';
  const isAdmin = currentUser.role === 'ADMIN';
  const isDeveloper = currentUser?.role === 'DESENVOLVEDOR';

  return (
    <div className="flex flex-col min-h-screen bg-[#F3F4F6] text-[#111827]">
      <header className="px-6 py-6 flex justify-between items-center sticky top-0 bg-[#F3F4F6]/80 backdrop-blur-xl z-[60] border-b border-gray-200/20">
        <div className="flex items-center gap-3">
          {whiteLabel.logo && (
            <img src={whiteLabel.logo} alt="Logo" className="h-10 w-auto object-contain" />
          )}
          <div className={`flex flex-col ${whiteLabel.logo ? 'border-l border-gray-300 pl-3' : ''}`}>
            <h1 className={`${whiteLabel.logo ? 'text-xs' : 'text-xl'} font-black tracking-tighter text-gray-900 uppercase leading-none`}>
              {whiteLabel.instanceName}
            </h1>
            <span className={`${whiteLabel.logo ? 'text-[7px]' : 'text-[9px]'} font-black text-orange-600 uppercase tracking-[0.2em] mt-0.5`}>
              CRM Operacional
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TideWidget />
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 relative active:scale-95 transition-all shadow-sm"
          >
            <Bell size={20} weight={notifications.length > 0 ? "fill" : "regular"} className={notifications.length > 0 ? "text-orange-500" : ""} />
            {notifications.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
          </button>

          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-black text-xs border border-orange-200 shadow-sm overflow-hidden">
            {currentUser.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover" /> : currentUser.nome.charAt(0).toUpperCase()}
          </div>

          <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 active:scale-95 transition-all shadow-sm">
            <SignOut size={20} />
          </button>
        </div>

        {showNotifications && (
          <div className="absolute top-24 right-6 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 z-[999] overflow-hidden animate-slide">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Notificações Recentes</h4>
              <button onClick={() => setShowNotifications(false)} className="text-gray-400"><X size={16} /></button>
            </div>
            <div className="max-h-[400px] overflow-y-auto no-scrollbar">
              {notifications.length > 0 ? notifications.map(n => (
                <div key={n.id} className="p-4 border-b border-gray-50 flex gap-3 hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.type === 'SERVICE' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}>
                    {n.type === 'SERVICE' ? <CalendarCheck size={16} weight="fill" /> : <Plus size={16} weight="bold" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-gray-900 uppercase leading-none">{n.title}</p>
                    <p className="text-[10px] text-gray-400 mt-1 font-medium">{n.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[8px] font-black bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                        🕒 {n.time}
                      </span>
                      <span className="text-[8px] font-black bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                        👤 {n.userName}
                      </span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-10 text-center opacity-30">
                  <Bell size={32} className="mx-auto mb-2" />
                  <p className="text-[9px] font-black uppercase tracking-widest">Tudo em dia!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {!isClient && (
          <aside className="hidden lg:flex w-64 flex-col bg-[#191919] border-r border-white/5 p-6 space-y-8">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Menu Principal</p>
              <nav className="flex flex-col gap-1">
                <DesktopNavBtn active={currentView === 'DASHBOARD'} onClick={() => setCurrentView('DASHBOARD')} icon={<House size={20} />} label="Início" color={whiteLabel.primaryColor} />
                <DesktopNavBtn active={currentView === 'BOOKINGS'} onClick={() => setCurrentView('BOOKINGS')} icon={<CalendarCheck size={20} />} label="Agendamentos" color={whiteLabel.primaryColor} />
                <DesktopNavBtn active={currentView === 'BUDGETS'} onClick={() => setCurrentView('BUDGETS')} icon={<Receipt size={20} />} label="Orçamentos" color={whiteLabel.primaryColor} />
                <DesktopNavBtn
                  active={currentView === 'FINANCIAL'}
                  onClick={() => {
                    if (currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'DESENVOLVEDOR')) {
                      setCurrentView('SETTINGS'); // Redireciona para Gestão
                    } else {
                      alert("Acesso Restrito: Área exclusiva para administradores.");
                    }
                  }}
                  icon={<Wallet size={20} />}
                  label="Finanças"
                  color={whiteLabel.primaryColor}
                />
                <DesktopNavBtn active={currentView === 'CLIENTS'} onClick={() => setCurrentView('CLIENTS')} icon={<UsersIcon size={20} />} label="Clientes" color={whiteLabel.primaryColor} />
                <DesktopNavBtn active={currentView === 'GUIDES'} onClick={() => setCurrentView('GUIDES')} icon={<IdentificationCard size={20} />} label="Painel de Guias" color={whiteLabel.primaryColor} />
                <DesktopNavBtn active={currentView === 'TOURS'} onClick={() => setCurrentView('TOURS')} icon={<MapTrifold size={20} />} label="Passeios" color={whiteLabel.primaryColor} />
                <DesktopNavBtn active={currentView === 'TASKS'} onClick={() => setCurrentView('TASKS')} icon={<IdentificationBadge size={20} />} label="Tarefas" color={whiteLabel.primaryColor} />
                <DesktopNavBtn active={currentView === 'USERS'} onClick={() => setCurrentView('USERS')} icon={<UsersIcon size={20} />} label="Gestão de Equipe" color={whiteLabel.primaryColor} />
                <DesktopNavBtn active={currentView === 'SETTINGS'} onClick={() => setCurrentView('SETTINGS')} icon={<Gear size={20} />} label="Configurações" color={whiteLabel.primaryColor} />
              </nav>
            </div>
          </aside>
        )}

        <main className="flex-1 overflow-y-auto pb-32 lg:pb-8">
          {renderView()}
        </main>
      </div>

      {!isClient && (
        <div className="fixed bottom-8 left-0 right-0 px-6 z-[80] pointer-events-none lg:hidden">
          <nav className="glass-nav h-16 rounded-none flex justify-around items-center px-4 shadow-2xl pointer-events-auto max-w-[600px] mx-auto border border-white/10 bg-[#191919] overflow-x-auto no-scrollbar">
            <NavBtn active={currentView === 'DASHBOARD'} onClick={() => setCurrentView('DASHBOARD')} icon={<House size={20} />} label="Início" color={whiteLabel.primaryColor} />
            <NavBtn active={currentView === 'BOOKINGS'} onClick={() => setCurrentView('BOOKINGS')} icon={<CalendarCheck size={20} />} label="Agendamentos" color={whiteLabel.primaryColor} />
            <NavBtn active={currentView === 'BUDGETS'} onClick={() => setCurrentView('BUDGETS')} icon={<Receipt size={20} />} label="Orçamentos" color={whiteLabel.primaryColor} />
            <NavBtn
              active={currentView === 'FINANCIAL'}
              onClick={() => {
                if (currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'DESENVOLVEDOR')) {
                  setCurrentView('SETTINGS');
                } else {
                  alert("Acesso Restrito: Área exclusiva para administradores.");
                }
              }}
              icon={<Wallet size={20} />}
              label="Finanças"
              color={whiteLabel.primaryColor}
            />
            <NavBtn active={currentView === 'CLIENTS'} onClick={() => setCurrentView('CLIENTS')} icon={<UsersIcon size={20} />} label="Clientes" color={whiteLabel.primaryColor} />
            <NavBtn active={currentView === 'TOURS'} onClick={() => setCurrentView('TOURS')} icon={<MapTrifold size={20} />} label="Passeios" color={whiteLabel.primaryColor} />
            <NavBtn active={currentView === 'TASKS'} onClick={() => setCurrentView('TASKS')} icon={<IdentificationBadge size={20} />} label="Tarefas" color={whiteLabel.primaryColor} />
            <NavBtn active={currentView === 'SETTINGS'} onClick={() => setCurrentView('SETTINGS')} icon={<Gear size={20} />} label="Gestão" color={whiteLabel.primaryColor} />
          </nav>
        </div>
      )}
    </div>
  );
};

const NavBtn = ({ active, onClick, icon, label, color }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center transition-all duration-300 outline-none relative min-w-[55px] h-full ${active ? 'scale-110' : 'opacity-40'}`} style={{ color: active ? '#F97316' : '#FFFFFF' }}>
    <div className={`p-1.5 rounded-none ${active ? 'bg-orange-500/10 shadow-inner' : ''}`}>
      {React.cloneElement(icon, { weight: active ? "fill" : "regular" })}
    </div>
    {active && <span className="text-[6px] font-black uppercase tracking-widest absolute bottom-1 whitespace-nowrap text-orange-500">{label}</span>}
  </button>
);

const DesktopNavBtn = ({ active, onClick, icon, label, color }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-none text-xs font-black uppercase tracking-widest transition-all ${active ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
  >
    {React.cloneElement(icon as React.ReactElement, { weight: active ? "bold" : "regular" } as any)}
    {label}
  </button>
);

export default App;
