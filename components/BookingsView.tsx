import React, { useState, useMemo } from "react";
import { Plus, MagnifyingGlass, WhatsappLogo, X, CheckCircle, Trash, FilePdf, QrCode, CreditCard, Bank, CircleNotch, CaretLeft, CaretRight, CalendarPlus, NotePencil, ClockCounterClockwise, PencilSimple } from "phosphor-react";
import { jsPDF } from "jspdf";
import { bookingService, clientService, transactionService } from "../services/databaseService";
import { User, Booking, Client, WhiteLabelConfig, Tour } from "../types";

const isNightTour = (desc: string) => {
  const d = desc.toUpperCase();
  return d.includes("BY NIGHT") || d.includes("PASSARELA DO") || d.includes("PASSARELA") || d.includes("NOTURNO");
};

interface CartItem {
  id: string;
  tour: string;
  date: string;
  pax: { adl: number, chd: number, free: number };
  price: string;
  observation: string;
  time?: string;
}

interface BookingsViewProps {
  config: WhiteLabelConfig;
  bookings: Booking[];
  setBookings: (bookings: Booking[]) => void;
  clients: Client[];
  onUpdateClients: (clients: Client[]) => void;
  tours: Tour[];
  users: User[];
}

const BookingsView: React.FC<BookingsViewProps> = ({ config, bookings, setBookings, clients, onUpdateClients, tours, users }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<'FORM' | 'CHECKOUT' | 'SUCCESS'>('FORM');
  const [search, setSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [filterDate, setFilterDate] = useState("");
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());
  const [showPackageHistory, setShowPackageHistory] = useState(false);
  const [historyClient, setHistoryClient] = useState<Client | null>(null);
  const [filterTour, setFilterTour] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterWhatsapp, setFilterWhatsapp] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [statusValue, setStatusValue] = useState("PENDENTE");

  const [whatsappValue, setWhatsappValue] = useState("");
  const [clientName, setClientName] = useState("");
  const [hotelSearch, setHotelSearch] = useState("");

  const [tourValue, setTourValue] = useState("");
  const [dateValue, setDateValue] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [priceValue, setPriceValue] = useState("");
  const [timeValue, setTimeValue] = useState("");
  const [paxInput, setPaxInput] = useState({ adl: 1, chd: 0, free: 0 });

  const [showClientAdd, setShowClientAdd] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [selectedGuideId, setSelectedGuideId] = useState("");
  const [selectedGuideName, setSelectedGuideName] = useState("");

  const guides = useMemo(() => {
    return users.filter(u =>
      u.role === 'GUIA' ||
      (u.role === 'ADMIN' && u.email === 'a_sergio@icloud.com')
    );
  }, [users]);

  const filteredClientsSearch = useMemo(() => {
    if (!clientSearch) return [];
    return clients.filter(c => c.nome.toUpperCase().includes(clientSearch.toUpperCase()) || c.whatsapp.includes(clientSearch));
  }, [clients, clientSearch]);

  const formatCurrency = (value: string) => {
    const clean = value.replace(/\D/g, "");
    if (!clean) return "";
    const amount = (parseInt(clean) / 100).toFixed(2);
    return amount.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const formatDateLong = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      // Handle YYYY-MM-DD
      const [year, month, day] = dateStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const handlePriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPriceValue(formatCurrency(e.target.value));
  };

  const addToCart = () => {
    if (!tourValue || !dateValue || !priceValue) {
      alert("Preencha o passeio, data e preço.");
      return;
    }

    // --- CHECK RETROACTIVE (No Past Dates) ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Create date from string yyyy-mm-dd to avoid timezone issues
    const [y, m, d] = dateValue.split('-').map(Number);
    const selectedDate = new Date(y, m - 1, d);

    if (selectedDate < today) {
      alert("ERRO: Não é permitido agendar para data retroativa.");
      return;
    }

    // --- CHECK CONFLICT (Global per Guide) ---
    if (!selectedGuideId) {
      alert("Por favor, selecione um guia para este serviço.");
      return;
    }

    // New Conflict Logic: Time-based or 'One Diurnal Tour' rule
    // If Time is provided, check for exact overlap
    // If NO Time provided, assume it takes the whole slot (Day or Night)

    const isNight = isNightTour(tourValue);

    // Check against existing bookings
    const guideConflict = bookings.find(b => {
      if (b.guideId !== selectedGuideId || b.status === 'CANCELADO' || b.date !== dateValue) return false;

      // If times are set on both, check for match
      if (timeValue && b.time) {
        return timeValue === b.time;
      }

      // Fallback to old "One Diurnal" rule if no times
      if (!isNight && !isNightTour(b.tour)) return true; // Two diurnal tours without time = Conflict? 
      // Let's refine: If user sets time, we trust them to manage overlap, BUT we warn if same time.
      // If NO time set, we stick to "One per period".

      return false;
    });

    if (guideConflict) {
      const msg = timeValue && guideConflict.time
        ? `CONFLITO: O guia já tem um agendamento às ${guideConflict.time}!`
        : "ALERTA: O guia já possui um serviço nesta data/período.";

      if (!confirm(`${msg}\nDeseja continuar mesmo assim?`)) return;
    }
    const newItem: CartItem = {
      id: Date.now().toString(),
      tour: tourValue.toUpperCase(),
      date: dateValue,
      time: timeValue,
      pax: { ...paxInput },
      price: priceValue,
      observation: ""
    };
    setCart(prev => [...prev, newItem]);
    setTourValue(""); setPriceValue(""); setTimeValue("");
    // Keep Pax values for next item as requested
    // setPaxInput({ adl: 1, chd: 0, free: 0 }); 
  };

  const editCartItem = (item: CartItem) => {
    setTourValue(item.tour);
    setDateValue(item.date);
    setTimeValue(item.time || "");
    setPriceValue(item.price);
    setPaxInput(item.pax);
    // Remove from cart to "re-add" or replace
    setCart(prev => prev.filter(c => c.id !== item.id));
  };

  const confirmAndPay = async () => {
    if (cart.length === 0 || !clientName) return;
    setIsProcessing(true);
    try {
      const createdBookings: Booking[] = [];
      const finalClientId = selectedClient?.id || null;

      // Calculate Total Amount and Description for Transaction
      const totalAmount = cart.reduce((acc, item) => {
        const val = parseFloat(item.price.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        return acc + val;
      }, 0);

      const tourDescription = cart.map(c => c.tour).join(' + ');
      const transactionDescription = `Recebimento Tour ${tourDescription} - ${clientName.toUpperCase()}`.substring(0, 250);

      // --- CONFLICT DETECTION & ID GENERATION PRE-CHECK ---
      for (const item of cart) {
        const isConflict = bookings.some(b =>
          b.date === item.date &&
          b.tour === item.tour &&
          b.status !== 'CANCELADO'
        );

        if (isConflict) {
          alert(`ALERTA DE CONFLITO:\nJá existe um agendamento para ${item.tour} em ${formatDateLong(item.date)}.\nVerifique antes de prosseguir.`);
          if (!confirm("Deseja prosseguir mesmo com o conflito?")) {
            setIsProcessing(false);
            return;
          }
        }
      }

      // Generate ID logic
      const lastId = bookings.length > 0 ? bookings.length : 0;
      let nextIdCount = lastId + 1;

      // Check if we need to create transactions (Status Changed to CONFIRMADO)
      const shouldCreateTransaction = statusValue === 'CONFIRMADO' && (!editingBooking || editingBooking.status !== 'CONFIRMADO');

      if (editingBooking) {
        // For editing, we delete the old siblings and create new ones with SAME bookingNumber
        // to ensure we capture all changes (additions, deletions, edits)
        if (editingBooking.bookingNumber) {
          const siblings = bookings.filter(b => b.bookingNumber === editingBooking.bookingNumber);
          for (const sb of siblings) {
            await bookingService.delete(String(sb.id));
          }
        } else {
          await bookingService.delete(String(editingBooking.id));
        }

        const bNumber = editingBooking.bookingNumber || `Agend.${String(nextIdCount).padStart(4, '0')}`;
        const updatedBookings: Booking[] = [];

        for (const item of cart) {
          const newB = await bookingService.create({
            bookingNumber: bNumber,
            clientId: finalClientId,
            client: clientName.toUpperCase(),
            whatsapp: whatsappValue.toUpperCase(),
            tour: item.tour.toUpperCase(),
            date: item.date,
            time: item.time,
            pax: item.pax,
            price: item.price,
            status: statusValue as any,
            location: hotelSearch.toUpperCase(),
            confirmed: statusValue === 'CONFIRMADO',
            guideId: selectedGuideId,
            guideName: selectedGuideName,
            guideRevenue: (() => {
              const guide = users.find(u => u.id === selectedGuideId);
              return guide?.dailyRate || "0";
            })(),
            observation: item.observation,
            paymentMethod: paymentMethod
          });
          updatedBookings.push(newB);
        }

        // Create Single Transaction if applicable
        if (shouldCreateTransaction && totalAmount > 0) {
          await transactionService.create({
            description: transactionDescription,
            category: 'VENDAS',
            amount: totalAmount,
            type: 'ENTRADA',
            status: 'PAGO',
            date: new Date().toISOString().split('T')[0],
            userName: 'SISTEMA'
          });
        }

        // Remove old siblings and add new ones to local state
        const otherBookings = bookings.filter(b => b.bookingNumber !== editingBooking.bookingNumber && b.id !== editingBooking.id);
        setBookings([...updatedBookings, ...otherBookings]);
        setModalStep('SUCCESS');
        return;
      }

      // NEW BOOKING LOGIC
      const agendId = `Agend.${String(nextIdCount).padStart(4, '0')}`;
      nextIdCount++;

      for (const item of cart) {
        const newBooking = await bookingService.create({
          bookingNumber: agendId,
          clientId: finalClientId,
          client: clientName.toUpperCase(),
          whatsapp: whatsappValue.toUpperCase(),
          tour: item.tour.toUpperCase(),
          date: item.date,
          time: item.time,
          pax: item.pax,
          price: item.price,
          status: statusValue as any,
          location: hotelSearch.toUpperCase(),
          confirmed: statusValue === 'CONFIRMADO',
          guideId: selectedGuideId,
          guideName: selectedGuideName,
          guideRevenue: (() => {
            const guide = users.find(u => u.id === selectedGuideId);
            return guide?.dailyRate || "0";
          })(),
          observation: item.observation,
          paymentMethod: paymentMethod
        });
        createdBookings.push(newBooking);
      }

      // Create Single Transaction if applicable
      if (shouldCreateTransaction && totalAmount > 0) {
        await transactionService.create({
          description: transactionDescription,
          category: 'VENDAS',
          amount: totalAmount,
          type: 'ENTRADA',
          status: 'PAGO',
          date: new Date().toISOString().split('T')[0],
          userName: 'SISTEMA'
        });
      }

      setBookings([...createdBookings, ...bookings]);
      setModalStep('SUCCESS');
    } catch (error) {
      console.error("Erro ao criar/editar reserva:", error);
      alert("Erro ao salvar reserva. Verifique a conexão.");
    } finally {
      setIsProcessing(false);
    }
  };

  const openEdit = (b: Booking) => {
    setEditingBooking(b);
    setClientName(b.client);
    setWhatsappValue(b.whatsapp);
    setHotelSearch(b.location || "");
    const existingClient = clients.find(c => c.id === b.clientId || c.nome.toUpperCase() === b.client.toUpperCase());
    setSelectedClient(existingClient || null);

    // Guide Info
    setSelectedGuideId(b.guideId || "");
    setSelectedGuideName(b.guideName || "");

    // Find siblings
    const siblings = (b.bookingNumber && b.bookingNumber.startsWith('Agend'))
      ? bookings.filter(bk => bk.bookingNumber === b.bookingNumber)
      : [b];

    const newCart = siblings.map(sb => ({
      id: sb.id.toString(),
      tour: sb.tour,
      date: sb.date,
      time: sb.time,
      pax: sb.pax,
      price: sb.price,
      observation: sb.observation || ""
    }));

    setCart(newCart);

    // Populate inputs with first item data for convenience
    // setPaxInput(b.pax || { adl: 1, chd: 0, free: 0 });
    // setTourValue(b.tour);
    // setDateValue(b.date);
    // setPriceValue(b.price);

    setPaymentMethod(b.paymentMethod || "PIX");
    setStatusValue(b.status || "PENDENTE");
    setModalStep('FORM');
    setShowModal(true);
  };

  const handleWhatsAppShare = (b: Booking) => {
    const text = `Olá ${b.client}, aqui está o seu voucher para ${b.tour} no dia ${formatDateLong(b.date)}. Valor: R$ ${b.price}. Status: ${b.status}`;
    const url = `https://wa.me/55${b.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleDelete = async (id: string | number) => {
    // Check if it's a group
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    if (confirm("Tem certeza que deseja excluir este agendamento?")) {
      try {
        if (booking.bookingNumber && booking.bookingNumber.startsWith('Agend')) {
          const siblings = bookings.filter(b => b.bookingNumber === booking.bookingNumber);
          for (const sb of siblings) {
            await bookingService.delete(String(sb.id));
          }
          setBookings(bookings.filter(b => b.bookingNumber !== booking.bookingNumber));
        } else {
          await bookingService.delete(String(id));
          setBookings(bookings.filter(b => b.id !== id));
        }
      } catch (error) {
        console.error("Erro ao excluir:", error);
        alert("Erro ao excluir agendamento.");
      }
    }
  };

  const handleQuickClientCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const nome = formData.get("nome") as string;
    const whatsapp = formData.get("whatsapp") as string;
    const endereco = formData.get("endereco") as string;

    if (!nome || !whatsapp) {
      alert("Preencha nome e whatsapp.");
      setIsProcessing(false);
      return;
    }

    try {
      const newClient = await clientService.create({
        nome: nome.toUpperCase(),
        whatsapp: whatsapp.toUpperCase(),
        email: "",
        endereco: endereco ? endereco.toUpperCase() : "",
        senhaPortal: "123456",
        dataAtivacao: new Date().toISOString(),
        status: 'ATIVO'
      });
      onUpdateClients([newClient, ...clients]);
      setSelectedClient(newClient);
      setClientName(newClient.nome);
      setWhatsappValue(newClient.whatsapp);
      setHotelSearch(newClient.endereco);
      setShowClientAdd(false);
      setClientSearch("");
    } catch (error) {
      console.error(error);
      alert("Erro ao cadastrar cliente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGeneratePDF = async (b: Booking) => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [215, 110]
    });

    // Find siblings if part of a group
    const relatedBookings = (b.bookingNumber && b.bookingNumber.startsWith('Agend'))
      ? bookings.filter(bk => bk.bookingNumber === b.bookingNumber)
      : [b];

    const primaryColor = config.primaryColor || "#F97316";
    const width = 215;
    const height = 110;
    const bodyFontSize = 10;

    // --- PÁGINA 1: CABEÇALHO ---
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, width, height, "F");
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, width, 25, "F");
    doc.setFillColor(primaryColor);
    doc.rect(0, 24, width, 1, "F");

    if (config.logo) {
      try { doc.addImage(config.logo, 'PNG', 10, 4, 16, 16); } catch (e) { }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("VOUCHER DE SERVIÇO", 32, 16);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    // Show ID
    const rawId = b.bookingNumber || String(b.id);
    let bookingIdDisplay = rawId;
    if (bookingIdDisplay.includes("-") && !bookingIdDisplay.includes("Agend")) {
      bookingIdDisplay = `#${bookingIdDisplay.slice(0, 8)}`;
    } else {
      bookingIdDisplay = bookingIdDisplay.replace("#", "");
      if (!bookingIdDisplay.startsWith("Agend")) {
        if (!isNaN(Number(bookingIdDisplay))) {
          bookingIdDisplay = `Agend.${bookingIdDisplay.padStart(4, '0')}`;
        }
      }
    }

    doc.text(`CÓDIGO: ${bookingIdDisplay} | EMISSÃO: ${new Date().toLocaleDateString('pt-BR')}`, width - 10, 15, { align: "right" });

    // --- DADOS DA EMPRESA (LEFT) ---
    let yPos = 35;
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(bodyFontSize);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DA EMPRESA", 10, yPos);
    doc.setFont("helvetica", "normal");
    yPos += 5;

    const companyName = doc.splitTextToSize(config.instanceName, 90);
    doc.text(companyName, 10, yPos);
    yPos += (companyName.length * 4.5);

    const docs = `CNPJ: ${config.cnpj || "N/A"} | CADASTUR: ${config.cadastur || "N/A"}`;
    doc.text(docs, 10, yPos);
    yPos += 4.5;

    const address = doc.splitTextToSize(`ENDEREÇO: ${config.address || "N/A"}`, 90);
    doc.text(address, 10, yPos);

    // --- CLIENTE & OPERAÇÃO (RIGHT) ---
    const rightColX = 110;
    yPos = 35;
    doc.setFontSize(bodyFontSize);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENTE & OPERAÇÃO", rightColX, yPos);
    doc.setFont("helvetica", "normal");
    yPos += 5;
    doc.text(`NOME: ${b.client}`, rightColX, yPos);
    yPos += 4.5;
    doc.text(`WHATSAPP: ${b.whatsapp}`, rightColX, yPos);
    yPos += 4.5;
    doc.text(`OPERADOR: SISTEMA`, rightColX, yPos);

    // --- STATUS ---
    yPos += 8;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 163, 74); // Green
    doc.text("STATUS: APROVADO", rightColX, yPos);
    doc.setTextColor(31, 41, 55); // Reset

    // --- SERVIÇO / ITENS ---
    yPos = 70;
    doc.setFillColor(243, 244, 246);
    doc.rect(10, yPos, width - 20, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(bodyFontSize - 1);
    doc.text("DESCRIÇÃO DO SERVIÇO", 15, yPos + 5);
    doc.text("DATA", 100, yPos + 5);
    doc.text("PAX", 155, yPos + 5, { align: "center" });
    doc.text("TOTAL", width - 15, yPos + 5, { align: "right" });

    yPos += 11;
    doc.setFont("helvetica", "normal");

    // Loop Items
    let totalVal = 0;
    relatedBookings.forEach(item => {
      // Safe Price Parse
      const val = parseFloat(item.price.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      totalVal += val;

      const tourTitle = doc.splitTextToSize(item.tour, 80);
      doc.text(tourTitle, 15, yPos);
      doc.text(formatDateLong(item.date), 100, yPos);

      const paxStr = typeof item.pax === 'object'
        ? `${item.pax.adl || 0} ADL | ${item.pax.chd || 0} CHD`
        : `${item.pax}`;
      doc.text(paxStr, 155, yPos, { align: "center" });

      const valFormatted = val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      doc.text(valFormatted, width - 15, yPos, { align: "right" });

      yPos += (tourTitle.length * 4) + 2; // Dynamic spacing
    });

    // Footer Total Box
    const totalFormatted = totalVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    yPos = height - 15;
    doc.setFillColor(31, 41, 55);
    doc.rect(width - 70, yPos, 60, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("VALOR TOTAL:", width - 65, yPos + 6.5);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(totalFormatted, width - 15, yPos + 6.5, { align: "right" });

    doc.save(`Voucher_${b.client}_${bookingIdDisplay}.pdf`);
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.client.toLowerCase().includes(search.toLowerCase()) ||
      (b.bookingNumber && b.bookingNumber.toLowerCase().includes(search.toLowerCase())) ||
      b.whatsapp.includes(search);

    const matchesDate = !filterDate || b.date === filterDate;
    const matchesTour = !filterTour || b.tour.toLowerCase().includes(filterTour.toLowerCase());
    const matchesClient = !filterClient || b.client.toLowerCase().includes(filterClient.toLowerCase());
    const matchesWhatsapp = !filterWhatsapp || b.whatsapp.includes(filterWhatsapp);
    const matchesStatus = !filterStatus || b.status === filterStatus;

    return matchesSearch && matchesDate && matchesTour && matchesClient && matchesWhatsapp && matchesStatus;
  }).sort((a, b) => {
    // Sort Descending by ID (Agend.XXXX)
    const getNum = (str?: string) => {
      if (!str) return 0;
      const num = parseInt(str.replace(/\D/g, ''));
      return isNaN(num) ? 0 : num;
    };

    const idA = getNum(a.bookingNumber) || parseInt(a.id as string) || 0;
    const idB = getNum(b.bookingNumber) || parseInt(b.id as string) || 0;

    return idB - idA;
  });

  const groupedBookings = useMemo(() => {
    const orderedGroups: Booking[][] = [];
    const processedIds = new Set<string>();

    for (const b of filteredBookings) {
      if (processedIds.has(String(b.id))) continue;

      if (b.bookingNumber && b.bookingNumber.startsWith('Agend')) {
        const siblings = filteredBookings.filter(sb => sb.bookingNumber === b.bookingNumber);
        orderedGroups.push(siblings);
        siblings.forEach(sb => processedIds.add(String(sb.id)));
      } else {
        orderedGroups.push([b]);
        processedIds.add(String(b.id));
      }
    }
    return orderedGroups;
  }, [filteredBookings]);

  return (
    <div className="px-6 pb-20">
      <div className="space-y-6 animate-slide">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 uppercase leading-none">Agendamentos</h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Controle de Saídas</p>
          </div>
          <button onClick={() => {
            setEditingBooking(null);
            setCart([]); setModalStep('FORM'); setShowModal(true);
            setClientName(""); setWhatsappValue(""); setHotelSearch("");
            setTourValue(""); setPriceValue(""); setTimeValue("");
            setSelectedGuideId(""); setSelectedGuideName("");
          }} className="w-14 h-14 bg-orange-500 rounded-3xl flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer">
            <Plus size={28} color="#FFFFFF" weight="bold" />
          </button>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" value={filterClient} onChange={(e) => setFilterClient(e.target.value.toUpperCase())} placeholder="CLIENTE..." className="w-full bg-gray-50 border border-transparent rounded-xl py-3 pl-12 pr-4 text-xs font-bold focus:bg-white focus:border-orange-500 outline-none transition-all uppercase" />
            </div>
            <div className="flex-1 min-w-[150px] relative">
              <WhatsappLogo className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" value={filterWhatsapp} onChange={(e) => setFilterWhatsapp(e.target.value)} placeholder="WHATSAPP..." className="w-full bg-gray-50 border border-transparent rounded-xl py-3 pl-12 pr-4 text-xs font-bold focus:bg-white focus:border-orange-500 outline-none transition-all" />
            </div>
            <div className="flex-1 min-w-[180px]">
              <input type="text" value={filterTour} onChange={(e) => setFilterTour(e.target.value.toUpperCase())} placeholder="PASSEIO..." className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-xs font-bold focus:bg-white focus:border-orange-500 outline-none transition-all uppercase" />
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[150px]">
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-xs font-bold focus:bg-white focus:border-orange-500 outline-none transition-all" />
            </div>
            <div className="flex-1 min-w-[150px]">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-xs font-bold focus:bg-white focus:border-orange-500 outline-none transition-all uppercase">
                <option value="">TODOS STATUS</option>
                <option value="AGENDADO">AGENDADO</option>
                <option value="APROVADO">APROVADO</option>
                <option value="EM EXECUÇÃO">EM EXECUÇÃO</option>
                <option value="CANCELADO">CANCELADO</option>
              </select>
            </div>
            <button
              onClick={() => { setFilterClient(""); setFilterWhatsapp(""); setFilterTour(""); setFilterDate(""); setFilterStatus(""); setSearch(""); }}
              className="px-6 py-3 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase hover:bg-gray-200 transition-all"
            >
              Limpar Filtros
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'LIST' ? 'CALENDAR' : 'LIST')}
              className={`px-6 py-3 rounded-xl border flex items-center gap-2 text-[10px] font-black uppercase transition-all ${viewMode === 'CALENDAR' ? 'bg-orange-500 text-white border-transparent' : 'bg-white text-gray-400 border-gray-100'}`}
            >
              {viewMode === 'LIST' ? 'Ver Calendário' : 'Ver Planilha'}
            </button>
          </div>
        </div>

        {viewMode === 'CALENDAR' && (
          <div className="agenda-card bg-white border-gray-100 p-6 shadow-sm animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">
                {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(selectedCalendarDate)}
              </h3>
              <div className="flex gap-2">
                <button onClick={() => setSelectedCalendarDate(new Date(selectedCalendarDate.getFullYear(), selectedCalendarDate.getMonth() - 1, 1))} className="p-2 bg-gray-50 rounded-xl">
                  <CaretLeft size={20} weight="bold" />
                </button>
                <button onClick={() => setSelectedCalendarDate(new Date(selectedCalendarDate.getFullYear(), selectedCalendarDate.getMonth() + 1, 1))} className="p-2 bg-gray-50 rounded-xl">
                  <CaretRight size={20} weight="bold" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                <span key={i} className="text-[8px] font-black text-gray-300 uppercase">{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: new Date(selectedCalendarDate.getFullYear(), selectedCalendarDate.getMonth() + 1, 0).getDate() }, (_, i) => {
                const day = i + 1;
                const dStr = `${selectedCalendarDate.getFullYear()}-${String(selectedCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasBooking = bookings.some(b => b.date === dStr);

                return (
                  <button
                    key={day}
                    onClick={() => {
                      const firstBookingOnDay = bookings.find(b => b.date === dStr);
                      if (firstBookingOnDay) {
                        const client = clients.find(c => c.id === firstBookingOnDay.clientId || c.nome.toUpperCase() === firstBookingOnDay.client.toUpperCase());
                        if (client) {
                          setHistoryClient(client);
                          setShowPackageHistory(true);
                        } else {
                          // Fallback for manual clients
                          setHistoryClient({ id: 'manual', nome: firstBookingOnDay.client, whatsapp: firstBookingOnDay.whatsapp, status: 'ATIVO' } as any);
                          setShowPackageHistory(true);
                        }
                      }
                    }}
                    className={`h-12 w-full rounded-2xl text-[10px] font-black flex flex-col items-center justify-center transition-all relative ${hasBooking ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                  >
                    {day}
                    {hasBooking && <div className="w-1 h-1 bg-orange-500 rounded-full mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'LIST' && (
          <div className="bg-white rounded-none overflow-hidden border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-orange-500 text-white">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-orange-400">Voucher</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-orange-400">Cliente / Whats</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-orange-400">Passeio</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-orange-400">Data</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-orange-400 text-center">Pax</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-orange-400 text-right">Valor</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-orange-400 text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredBookings.map(b => {
                  const statusColors = {
                    'AGENDADO': 'bg-orange-100 text-orange-600',
                    'PENDENTE': 'bg-orange-100 text-orange-600',
                    'APROVADO': 'bg-green-100 text-green-600',
                    'CONFIRMADO': 'bg-green-100 text-green-600',
                    'EM EXECUÇÃO': 'bg-blue-100 text-blue-600',
                    'CANCELADO': 'bg-red-100 text-red-600'
                  };
                  const currentStatus = (b.status || 'AGENDADO') as keyof typeof statusColors;

                  return (
                    <tr key={b.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {b.bookingNumber ? b.bookingNumber.replace("#", "") : `Agend.${String(b.id).slice(-4)}`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p onClick={() => {
                            const client = clients.find(c => c.id === b.clientId || c.nome.toUpperCase() === b.client.toUpperCase());
                            setHistoryClient(client || { id: 'manual', nome: b.client, whatsapp: b.whatsapp, status: 'ATIVO' } as any);
                            setShowPackageHistory(true);
                          }} className="text-xs font-black text-gray-900 uppercase leading-none hover:text-orange-500 cursor-pointer transition-colors">
                            {b.client}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold mt-1 flex items-center gap-1">
                            <WhatsappLogo size={12} weight="fill" className="text-green-500" /> {b.whatsapp}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[10px] font-bold text-gray-700 uppercase leading-tight">{b.tour}</p>
                        {b.location && <p className="text-[9px] text-gray-400 font-bold mt-0.5 truncate max-w-[150px] uppercase">@{b.location}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[10px] font-bold text-gray-600 uppercase">{formatDateLong(b.date)}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[10px] font-black text-gray-700">
                          {typeof b.pax === 'object' ? (b.pax.adl + b.pax.chd) : b.pax}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-[11px] font-black text-gray-900">R$ {b.price}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full whitespace-nowrap ${statusColors[currentStatus] || 'bg-gray-100 text-gray-500'}`}>
                          {b.status === 'PENDENTE' ? 'AGENDADO' : (b.status === 'CONFIRMADO' ? 'APROVADO' : b.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleWhatsAppShare(b)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors" title="WhatsApp">
                            <WhatsappLogo size={16} weight="bold" />
                          </button>
                          <button onClick={() => handleGeneratePDF(b)} className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" title="Voucher PDF">
                            <FilePdf size={16} weight="bold" />
                          </button>
                          <button onClick={() => openEdit(b)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Editar">
                            <PencilSimple size={16} weight="bold" />
                          </button>
                          <button onClick={() => handleDelete(b.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Excluir">
                            <Trash size={16} weight="bold" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredBookings.length === 0 && (
              <div className="py-20 text-center opacity-30 flex flex-col items-center">
                <CalendarPlus size={48} className="mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma reserva localizada</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showPackageHistory && historyClient && (
        <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-md flex items-end sm:items-center justify-center">
          <div className="w-full max-w-2xl bg-white rounded-t-[40px] sm:rounded-[40px] flex flex-col max-h-[92vh] animate-slide shadow-2xl overflow-hidden relative border-t-8 border-orange-500">
            <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                  <ClockCounterClockwise size={24} weight="bold" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter leading-none">Histórico do Pacote</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Cliente: {historyClient.nome}</p>
                </div>
              </div>
              <button onClick={() => setShowPackageHistory(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900">
                <X size={24} weight="bold" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-6">
              <div className="space-y-4">
                {bookings.filter(b => b.clientId === historyClient.id || b.client.toUpperCase() === historyClient.nome.toUpperCase()).map(b => (
                  <div key={b.id} className="agenda-card bg-gray-50 border-gray-100 p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-black text-gray-900 uppercase leading-none">{b.tour}</p>
                        <p className="text-[10px] text-orange-600 font-bold mt-1 uppercase">{formatDateLong(b.date)} {b.time ? `- ${b.time}` : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-gray-900">R$ {b.price}</p>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${b.confirmed ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          {b.confirmed ? 'Confirmado' : 'Pendente'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => { setShowPackageHistory(false); openEdit(b); }} className="flex-1 bg-white border border-gray-200 text-gray-600 py-3 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2">
                        <NotePencil size={14} /> Alterar
                      </button>
                      <button onClick={() => {
                        const newDate = prompt("Nova data (AAAA-MM-DD):", b.date);
                        if (newDate && newDate !== b.date) {
                          bookingService.update(String(b.id), { date: newDate }).then(updated => {
                            setBookings(bookings.map(book => book.id === b.id ? updated : book));
                          });
                        }
                      }} className="flex-1 bg-white border border-gray-200 text-gray-600 py-3 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2">
                        <ClockCounterClockwise size={14} /> Adiar
                      </button>
                      <button onClick={() => handleDelete(b.id)} className="p-3 bg-red-50 text-red-500 rounded-xl">
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-8 py-6 bg-white border-t border-gray-100 flex-shrink-0">
              <button onClick={() => {
                setShowPackageHistory(false);
                setEditingBooking(null);
                setClientName(historyClient.nome);
                setWhatsappValue(historyClient.whatsapp);
                setHotelSearch(historyClient.endereco || "");
                setSelectedClient(historyClient.id === 'manual' ? null : historyClient);
                setSelectedGuideId(""); setSelectedGuideName("");
                setCart([]);
                setTourValue(""); setPriceValue(""); setTimeValue("");
                setModalStep('FORM');
                setShowModal(true);
              }} className="w-full bg-gray-900 text-white rounded-3xl py-6 text-[11px] font-black uppercase shadow-xl flex items-center justify-center gap-2">
                <CalendarPlus size={20} weight="fill" /> Inclusão no Pacote
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-end sm:items-center justify-center">
          <div className="w-full max-w-lg bg-white rounded-t-[40px] sm:rounded-[40px] flex flex-col max-h-[92vh] animate-slide shadow-2xl overflow-hidden relative border-t-8 border-orange-500">

            <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-gray-100 flex-shrink-0">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">
                {modalStep === 'FORM' ? (editingBooking ? 'Editar Reserva' : 'Novo Agendamento') : (modalStep === 'CHECKOUT' ? 'Pagamento' : 'Sucesso!')}
              </h3>
              <div className="flex gap-2">
                {modalStep !== 'SUCCESS' && (
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 rounded-full text-[9px] font-black text-gray-500 uppercase tracking-widest hover:bg-gray-200 transition-colors">
                    Retornar
                  </button>
                )}
                <button onClick={() => !isProcessing && setShowModal(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors">
                  <X size={24} weight="bold" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-6">
              {modalStep === 'FORM' && (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Localizar Cliente</label>
                        <button
                          onClick={() => setShowClientAdd(true)}
                          className="text-[9px] font-black text-orange-600 uppercase flex items-center gap-1 hover:opacity-70 transition-all"
                        >
                          <Plus size={12} weight="bold" /> Novo Cliente+
                        </button>
                      </div>

                      <div className="relative">
                        <select
                          value={selectedClient?.id || ""}
                          onChange={(e) => {
                            const c = clients.find(x => x.id === e.target.value);
                            if (c) {
                              setSelectedClient(c);
                              setClientName(c.nome);
                              setWhatsappValue(c.whatsapp);
                              setHotelSearch(c.endereco || "");
                              setClientSearch(""); // Clear search just in case
                            } else {
                              setSelectedClient(null);
                              setClientName("");
                              setWhatsappValue("");
                              setHotelSearch("");
                            }
                          }}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-orange-500 uppercase appearance-none"
                        >
                          <option value="">SELECIONE UM CLIENTE...</option>
                          {clients.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.nome} - {c.whatsapp}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                          <CaretRight size={16} weight="bold" className="rotate-90" />
                        </div>
                      </div>
                    </div>

                    {!selectedClient && (
                      <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Manual</label>
                          <input value={clientName} onChange={e => setClientName(e.target.value.toUpperCase())} placeholder="NOME..." className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-orange-500 uppercase" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp</label>
                          <input value={whatsappValue} onChange={e => setWhatsappValue(e.target.value.toUpperCase())} placeholder="CELULAR..." className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-orange-500 uppercase" />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5 relative z-20">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Guia Responsável</label>
                      <div className="relative group">
                        <div className="relative">
                          <input
                            type="text"
                            value={selectedGuideName}
                            onChange={(e) => {
                              setSelectedGuideName(e.target.value.toUpperCase());
                              const match = guides.find(g => g.nome.toUpperCase() === e.target.value.toUpperCase());
                              if (match) setSelectedGuideId(match.id);
                              else setSelectedGuideId("");
                            }}
                            placeholder="BUSCAR GUIA..."
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-orange-500 uppercase pr-10"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <CaretRight size={16} weight="bold" className="rotate-90" />
                          </div>
                        </div>

                        {/* Dropdown List */}
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto hidden group-focus-within:block z-50">
                          {guides.filter(g => g.nome.toUpperCase().includes(selectedGuideName.toUpperCase())).length > 0 ? (
                            guides.filter(g => g.nome.toUpperCase().includes(selectedGuideName.toUpperCase())).map(g => (
                              <div
                                key={g.id}
                                onMouseDown={() => {
                                  setSelectedGuideName(g.nome);
                                  setSelectedGuideId(g.id);
                                }}
                                className="p-3 hover:bg-orange-50 cursor-pointer text-xs font-bold text-gray-700 uppercase border-b border-gray-50 last:border-0"
                              >
                                {g.nome}
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-[10px] uppercase text-gray-400 font-bold text-center">Nenhum guia encontrado</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Local / Hotel</label>
                      <input value={hotelSearch} onChange={e => setHotelSearch(e.target.value.toUpperCase())} placeholder="ONDE ESTÁ HOSPEDADO?" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-orange-500 uppercase" />
                    </div>
                  </div>

                  <div className="bg-orange-50 p-6 rounded-[28px] border border-orange-100 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-orange-800 uppercase ml-1">Passeio</label>
                      <select
                        value={tourValue}
                        onChange={e => {
                          const selectedId = e.target.value;
                          setTourValue(selectedId); // Armazena o ID ou Título? O original usava Título. Vamos manter Título baseada na lógica antiga
                          // Mas o original setava o TÍTULO no value. 
                          // Vamos ajustar para buscar pelo ID se virmos que é ID, ou buscar pelo Título.
                          // O ideal é buscar pelo ID.
                          const selectedTour = tours.find(t => t.title === selectedId || t.id === selectedId);

                          if (selectedTour) {
                            setTourValue(selectedTour.title); // Mantém o valor como Título para compatibilidade com o resto do código
                            // Auto-fill price
                            let p = selectedTour.price.toString();
                            let raw = p.replace(/\D/g, "");
                            if (!p.includes('.') && !p.includes(',')) raw += "00";
                            const formatted = formatCurrency(raw);
                            setPriceValue(formatted);
                          } else {
                            setTourValue(selectedId);
                          }
                        }}
                        className="w-full bg-white border border-orange-200 rounded-xl p-4 text-xs font-bold text-gray-900 uppercase"
                      >
                        <option value="">SELECIONE UM ROTEIRO...</option>
                        {tours.map(t => (
                          <option key={t.id} value={t.title}>{t.title} - {t.price}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-orange-800 uppercase ml-1">Data</label>
                        <input type="date" value={dateValue} onChange={e => setDateValue(e.target.value)} className="w-full bg-white border border-orange-200 rounded-xl p-4 text-xs font-bold" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-orange-800 uppercase ml-1">Horário</label>
                        <input type="time" value={timeValue} onChange={e => setTimeValue(e.target.value)} className="w-full bg-white border border-orange-200 rounded-xl p-4 text-xs font-bold text-center" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-orange-800 uppercase ml-1">Preço (R$)</label>
                      <input value={priceValue} onChange={handlePriceInput} placeholder="0,00" className="w-full bg-white border border-orange-200 rounded-xl p-4 text-xs font-black text-orange-600" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-orange-800 uppercase ml-1">ADL</label>
                        <input type="number" min="0" value={paxInput.adl} onChange={e => setPaxInput({ ...paxInput, adl: parseInt(e.target.value) || 0 })} className="w-full bg-white border border-orange-200 rounded-xl p-3 text-xs font-bold text-center" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-orange-800 uppercase ml-1">CHD</label>
                        <input type="number" min="0" value={paxInput.chd} onChange={e => setPaxInput({ ...paxInput, chd: parseInt(e.target.value) || 0 })} className="w-full bg-white border border-orange-200 rounded-xl p-3 text-xs font-bold text-center" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-orange-800 uppercase ml-1">FREE</label>
                        <input type="number" min="0" value={paxInput.free} onChange={e => setPaxInput({ ...paxInput, free: parseInt(e.target.value) || 0 })} className="w-full bg-white border border-orange-200 rounded-xl p-3 text-xs font-bold text-center" />
                      </div>
                    </div>

                    <button type="button" onClick={addToCart} className="w-full py-4 bg-orange-500 text-white rounded-2xl text-[11px] font-black uppercase shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
                      Incluir no Agendamento
                    </button>
                  </div>

                  {cart.length > 0 && (
                    <div className="space-y-3 pt-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Itens Inclusos</h4>
                      {cart.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group/item">
                          <div>
                            <p className="text-[11px] font-black text-gray-900 uppercase leading-none">{item.tour}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">{formatDateLong(item.date)} {item.time ? `às ${item.time}` : ''}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-orange-600 mr-2">R$ {item.price}</span>
                            <button onClick={() => editCartItem(item)} className="p-2 text-blue-400 hover:text-blue-600 transition-colors opacity-0 group-hover/item:opacity-100">
                              <PencilSimple size={16} weight="bold" />
                            </button>
                            <button onClick={() => {
                              const newCart = cart.filter(c => c.id !== item.id);
                              setCart(newCart);
                            }} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                              <Trash size={16} weight="bold" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {modalStep === 'CHECKOUT' && (
                <div className="space-y-6 py-4">
                  <div className="bg-gray-50 p-6 rounded-[24px] text-center border border-gray-100 shadow-inner">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Valor Total</p>
                    <span className="text-3xl font-black text-gray-900">
                      {cart.reduce((a, c) => {
                        const val = parseFloat(c.price.replace(/[^\d,]/g, "").replace(",", "."));
                        return a + (isNaN(val) ? 0 : val);
                      }, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Forma de Pagamento</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button onClick={() => setPaymentMethod('PIX')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'PIX' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                        <QrCode size={24} /> <span className="text-[8px] font-black uppercase tracking-widest">PIX</span>
                      </button>
                      <button onClick={() => setPaymentMethod('CARTÃO')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'CARTÃO' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                        <CreditCard size={24} /> <span className="text-[8px] font-black uppercase tracking-widest">Card</span>
                      </button>
                      <button onClick={() => setPaymentMethod('DINHEIRO')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'DINHEIRO' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                        <Bank size={24} /> <span className="text-[8px] font-black uppercase tracking-widest">Cash</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status da Reserva</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setStatusValue('PENDENTE')} className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${statusValue === 'PENDENTE' ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                        Pendente
                      </button>
                      <button onClick={() => setStatusValue('CONFIRMADO')} className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${statusValue === 'CONFIRMADO' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                        Aprovado (Pago)
                      </button>
                    </div>
                  </div>

                  {statusValue === 'CONFIRMADO' && (
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-3 animate-fadeIn">
                      <CheckCircle size={20} className="text-emerald-500" weight="fill" />
                      <p className="text-[9px] font-bold text-emerald-700 uppercase leading-tight">
                        O valor será lançado automaticamente no financeiro como "Recebimento Tour".
                      </p>
                    </div>
                  )}

                </div>
              )}

              {modalStep === 'SUCCESS' && (
                <div className="text-center space-y-6 py-10">
                  <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={56} weight="fill" className="text-orange-500" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase">Reserva {statusValue === 'CONFIRMADO' ? 'Aprovada' : 'Agendada'}!</h3>
                  <button onClick={() => setShowModal(false)} className="w-full bg-gray-900 text-white py-5 rounded-2xl text-[11px] font-black uppercase">Finalizar e Voltar</button>
                </div>
              )}
            </div>

            {modalStep !== 'SUCCESS' && (
              <div className="px-8 py-6 bg-white border-t border-gray-100 flex-shrink-0 flex gap-3">
                {modalStep === 'CHECKOUT' && (
                  <button onClick={() => setModalStep('FORM')} className="flex-1 bg-gray-100 text-gray-500 rounded-3xl py-6 text-[11px] font-black uppercase active:scale-95 transition-all">
                    Voltar Editar
                  </button>
                )}
                {modalStep === 'FORM' ? (
                  <button disabled={cart.length === 0} onClick={() => setModalStep('CHECKOUT')} className="flex-1 bg-orange-500 text-white rounded-3xl py-6 text-[11px] font-black uppercase shadow-xl disabled:opacity-50">
                    Prosseguir para Pagamento
                  </button>
                ) : (
                  <button disabled={isProcessing} onClick={confirmAndPay} className="flex-1 bg-orange-500 text-white rounded-3xl py-6 text-[11px] font-black uppercase shadow-xl flex items-center justify-center gap-2">
                    {isProcessing && <CircleNotch className="animate-spin" size={20} />}
                    {isProcessing ? 'PROCESSANDO...' : (statusValue === 'CONFIRMADO' ? 'CONFIRMAR PAGAMENTO' : 'FINALIZAR AGENDAMENTO')}
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      )}
      {showClientAdd && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden animate-slide">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h4 className="text-sm font-black uppercase text-gray-900">Cadastrar Novo Cliente</h4>
              <button onClick={() => setShowClientAdd(false)} className="text-gray-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleQuickClientCreate} className="p-8 space-y-4">
              <input name="nome" required placeholder="NOME COMPLETO" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-black uppercase outline-none focus:border-orange-500" />
              <input name="whatsapp" required placeholder="WHATSAPP / CELULAR" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-black uppercase outline-none focus:border-orange-500" />
              <input name="endereco" placeholder="HOTEL / POUSADA" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-black uppercase outline-none focus:border-orange-500" />
              <button type="submit" disabled={isProcessing} className="w-full bg-orange-500 text-white rounded-2xl py-4 text-[11px] font-black uppercase shadow-lg disabled:opacity-50">
                {isProcessing ? 'SALVANDO...' : 'CADASTRAR CLIENTE E SELECIONAR'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsView;
