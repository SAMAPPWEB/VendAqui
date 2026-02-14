
import React, { useState, useMemo } from "react";
import { User, Booking, Client, Transaction, Tour } from "../types";
import { Users, WhatsappLogo, Calendar, Clock, ArrowRight, CheckCircle, Car, MapPin, CircleNotch, CurrencyDollar, ChartLineUp } from "phosphor-react";

interface DashboardViewProps {
  user: User;
  bookings: Booking[];
  clients: Client[];
  transactions: Transaction[];
  tours: Tour[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ user, bookings, clients, transactions, tours: catalogTours }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const fullDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const capitalizedDate = fullDate.charAt(0).toUpperCase() + fullDate.slice(1);
  const todayISO = new Date().toISOString().split('T')[0];

  // Filtra agendamentos de hoje
  const todayBookings = useMemo(() => {
    return bookings.filter(b => b.date === todayISO);
  }, [bookings, todayISO]);

  // Passageiros hoje (Soma de PAX de hoje)
  const totalPassengers = useMemo(() => {
    return todayBookings.reduce((acc, curr) => acc + (curr.pax.adl + curr.pax.chd + curr.pax.free), 0);
  }, [todayBookings]);

  // Clientes ativos
  const activeClientsCount = useMemo(() => {
    return clients.filter(c => c.status === 'ATIVO').length;
  }, [clients]);

  // Faturamento (Soma de transações de ENTRADA confirmadas/PAGAS ou baseada em Bookings confirmados)
  // Vamos usar as transações para faturamento real
  const totalRevenue = useMemo(() => {
    return transactions
      .filter(t => t.type === 'ENTRADA' && t.status === 'PAGO')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [transactions]);

  // Veículos em rota (Lógica simplificada baseada em agendamentos ativos)
  const vehiclesInRoute = todayBookings.length > 0 ? todayBookings.length : 0;

  // Passeio mais buscado (Top Tour do catálogo baseado em Bookings totais)
  const topTourName = useMemo(() => {
    if (bookings.length === 0) return "Nenhum agendamento";
    const counts: Record<string, number> = {};
    bookings.forEach(b => {
      counts[b.tour] = (counts[b.tour] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }, [bookings]);

  const confirmedCount = todayBookings.filter(b => !b.confirmed).length;

  const handleConfirmAction = async () => {
    if (confirmedCount > 0) {
      setIsProcessing(true);
      // Aqui deveria haver um loop para atualizar no Supabase, mas manteremos o feedback visual por enquanto
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsProcessing(false);
      alert("Para confirmar em massa, utilize o painel de Agenda.");
    }
  };

  const totalAgendados = todayBookings.length.toString().padStart(2, '0');

  return (
    <div className="px-6 space-y-8 animate-slide">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-orange-500"></div>
          <p className="text-[8px] text-gray-400 font-black uppercase tracking-[0.2em]">{capitalizedDate}</p>
        </div>
        <h2 className="text-xl font-black tracking-tight text-gray-900 leading-tight mt-1">
          Olá, Sr. {user.nome}!
        </h2>
        <p className="text-orange-500 text-[9px] font-black uppercase tracking-widest mt-0.5 opacity-80">Painel de Controle • Operação Ativa</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="agenda-card bg-white border-gray-100 flex flex-col justify-between h-28 cursor-default shadow-sm group">
          <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
            <Users size={18} className="text-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 leading-none">{totalPassengers.toString().padStart(2, '0')}</p>
            <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mt-2">Passageiros Hoje</p>
          </div>
        </div>

        <div className="agenda-card bg-white border-gray-100 flex flex-col justify-between h-28 cursor-default shadow-sm group">
          <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
            <Car size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 leading-none">{vehiclesInRoute.toString().padStart(2, '0')}</p>
            <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mt-2">Agendamentos Hoje</p>
          </div>
        </div>

        <div className="agenda-card bg-white border-gray-100 flex flex-col justify-between h-28 cursor-default shadow-sm group">
          <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
            <Users size={18} className="text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 leading-none">{activeClientsCount.toString().padStart(2, '0')}</p>
            <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mt-2">Clientes Ativos</p>
          </div>
        </div>

        <div className="agenda-card bg-white border-gray-100 flex flex-col justify-between h-28 cursor-default shadow-sm group">
          <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
            <CurrencyDollar size={18} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900 leading-none">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mt-2">Receita Confirmada</p>
          </div>
        </div>

        <div className="agenda-card bg-white border-gray-100 flex flex-col justify-between h-28 cursor-default shadow-sm group col-span-1 md:col-span-2">
          <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
            <ChartLineUp size={18} className="text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-black text-gray-900 leading-none uppercase truncate">{topTourName}</p>
            <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mt-2">Serviço mais Reservado</p>
          </div>
        </div>
      </div>

      <div
        onClick={!isProcessing && confirmedCount > 0 ? handleConfirmAction : undefined}
        className={`rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer group border ${confirmedCount > 0 ? 'bg-orange-500 border-orange-400 shadow-md active:scale-[0.98]' : 'bg-gray-100 border-gray-200 grayscale cursor-default'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${confirmedCount > 0 ? 'bg-white/20' : 'bg-gray-200'}`}>
            {isProcessing ? <CircleNotch size={20} className="animate-spin text-white" /> : <WhatsappLogo size={20} color={confirmedCount > 0 ? "#FFFFFF" : "#9CA3AF"} weight="fill" />}
          </div>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${confirmedCount > 0 ? 'text-white' : 'text-gray-400'}`}>
              Confirmar Saídas
            </p>
            <p className={`text-[8px] px-1.5 py-0.5 rounded font-black mt-0.5 inline-block ${confirmedCount > 0 ? 'text-orange-600 bg-white' : 'text-gray-400 bg-gray-200'}`}>
              {confirmedCount > 0 ? `${confirmedCount} PENDENTES` : "Sincronizado"}
            </p>
          </div>
        </div>
        {confirmedCount > 0 && !isProcessing && <ArrowRight size={16} color="#FFFFFF" weight="bold" />}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Controle de Saída</h3>
          <span className="text-[8px] font-black text-orange-600 uppercase px-2 py-0.5 bg-orange-50 rounded-md border border-orange-100">{totalAgendados} Agendados</span>
        </div>

        <div className="space-y-3">
          {todayBookings.length > 0 ? todayBookings.map(booking => (
            <TourItem key={booking.id} {...booking} />
          )) : (
            <div className="py-10 text-center opacity-40">
              <Calendar size={40} className="mx-auto mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma saída para hoje</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TourItem = ({ title, time, pax, client, location, confirmed: initialConfirmed }: any) => {
  const [confirmed, setConfirmed] = useState(initialConfirmed);
  return (
    <div
      onClick={() => setConfirmed(!confirmed)}
      className="agenda-card flex justify-between items-center py-3 bg-white border-gray-100 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex flex-col items-center justify-center border border-gray-100">
          <Clock size={14} className="text-gray-400" />
          <span className="text-[9px] font-black text-gray-900 mt-0.5">{time}</span>
        </div>
        <div>
          <h4 className="text-[12px] font-black text-gray-900 uppercase leading-none">{title}</h4>
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin size={10} className="text-gray-300" />
            <p className="text-[9px] text-gray-400 font-bold uppercase truncate max-w-[120px]">{location}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-[9px] font-black text-gray-400 px-1.5 py-0.5 bg-gray-50 rounded border border-gray-100">{pax} PAX</span>
        {confirmed ? (
          <CheckCircle size={18} className="text-orange-500" weight="fill" />
        ) : (
          <div className="w-4 h-4 rounded-full border border-dashed border-gray-300"></div>
        )}
      </div>
    </div>
  );
};

export default DashboardView;
