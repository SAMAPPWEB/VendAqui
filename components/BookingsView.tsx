import React, { useState, useMemo } from "react";
import { Plus, MagnifyingGlass, WhatsappLogo, X, CheckCircle, Trash, FilePdf, QrCode, CreditCard, Bank, CircleNotch } from "phosphor-react";
import { jsPDF } from "jspdf";
import { bookingService, clientService } from "../services/databaseService";
import { User, Booking, Client, WhiteLabelConfig } from "../types";

interface CartItem {
  id: string;
  tour: string;
  date: string;
  pax: { adl: number, chd: number, free: number };
  price: string;
  observation: string;
}

interface BookingsViewProps {
  config: WhiteLabelConfig;
  bookings: Booking[];
  setBookings: (bookings: Booking[]) => void;
  clients: Client[];
  onUpdateClients: (clients: Client[]) => void;
}

const BookingsView: React.FC<BookingsViewProps> = ({ config, bookings, setBookings, clients, onUpdateClients }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<'FORM' | 'CHECKOUT' | 'SUCCESS'>('FORM');
  const [search, setSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("PIX");

  const [whatsappValue, setWhatsappValue] = useState("");
  const [clientName, setClientName] = useState("");
  const [hotelSearch, setHotelSearch] = useState("");

  const [tourValue, setTourValue] = useState("");
  const [dateValue, setDateValue] = useState("");
  const [priceValue, setPriceValue] = useState("");

  const [showClientAdd, setShowClientAdd] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

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

  const handlePriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPriceValue(formatCurrency(e.target.value));
  };

  const addToCart = () => {
    if (!tourValue || !dateValue || !priceValue) {
      alert("Preencha o passeio, data e preço.");
      return;
    }
    const newItem: CartItem = {
      id: Date.now().toString(),
      tour: tourValue.toUpperCase(),
      date: dateValue,
      pax: { adl: 1, chd: 0, free: 0 },
      price: priceValue,
      observation: ""
    };
    setCart(prev => [...prev, newItem]);
    setTourValue(""); setDateValue(""); setPriceValue("");
  };

  const confirmAndPay = async () => {
    if (cart.length === 0 || !clientName) return;
    setIsProcessing(true);
    try {
      const createdBookings: Booking[] = [];
      const finalClientId = selectedClient?.id || "TEMP-" + Date.now();

      if (editingBooking) {
        // Handle single edit (simplified for now as only 1 item in edit mode)
        const item = cart[0];
        const updated = await bookingService.update(editingBooking.id, {
          clientId: finalClientId,
          client: clientName.toUpperCase(),
          whatsapp: whatsappValue.toUpperCase(),
          tour: item.tour.toUpperCase(),
          date: item.date,
          pax: item.pax,
          price: item.price,
          status: editingBooking.status,
          location: hotelSearch.toUpperCase(),
          confirmed: editingBooking.confirmed,
          observation: item.observation,
          paymentMethod: paymentMethod
        });
        setBookings(bookings.map(b => b.id === editingBooking.id ? updated : b));
        setModalStep('SUCCESS');
        return;
      }

      for (const item of cart) {
        const newBooking = await bookingService.create({
          clientId: finalClientId,
          client: clientName.toUpperCase(),
          whatsapp: whatsappValue.toUpperCase(),
          tour: item.tour.toUpperCase(),
          date: item.date,
          pax: item.pax,
          price: item.price,
          status: "PENDENTE",
          location: hotelSearch.toUpperCase(),
          confirmed: false,
          observation: item.observation,
          paymentMethod: paymentMethod
        });
        createdBookings.push(newBooking);
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

    setCart([{
      id: b.id,
      tour: b.tour,
      date: b.date,
      pax: b.pax,
      price: b.price,
      observation: b.observation || ""
    }]);

    setPaymentMethod(b.paymentMethod || "PIX");
    setModalStep('FORM');
    setShowModal(true);
  };

  const handleQuickClientCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    try {
      const newClient = await clientService.create({
        nome: fd.get('nome')?.toString().toUpperCase() || "",
        whatsapp: fd.get('whatsapp')?.toString().toUpperCase() || "",
        email: fd.get('email')?.toString().toLowerCase() || "",
        endereco: fd.get('endereco')?.toString().toUpperCase() || "",
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
    } catch (err) {
      alert("Erro ao criar cliente rápido.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir reserva permanentemente?")) return;
    try {
      await bookingService.delete(id);
      setBookings(bookings.filter(b => b.id !== id));
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Erro ao excluir reserva.");
    }
  };

  const handleWhatsAppShare = (booking: Booking) => {
    const cleanNumber = booking.whatsapp.replace(/\D/g, "");
    const text = `*VOUCHER ${config.instanceName}*\n\nOlá *${booking.client}*!\nConfirmamos seu agendamento:\n\n📍 *Passeio:* ${booking.tour}\n📅 *Data:* ${booking.date}\n💰 *Valor:* R$ ${booking.price}`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleGeneratePDF = async (b: Booking) => {
    const doc = new jsPDF();
    doc.text(config.instanceName, 105, 20, { align: 'center' });
    doc.text(`Cliente: ${b.client}`, 20, 40);
    doc.text(`Passeio: ${b.tour}`, 20, 50);
    doc.save(`Voucher_${b.client}.pdf`);
  };

  const filteredBookings = bookings.filter(b => b.client.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="px-6 pb-20">
      <div className="space-y-6 animate-slide">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 uppercase leading-none">Agenda</h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Controle de Saídas</p>
          </div>
          <button onClick={() => {
            setEditingBooking(null);
            setCart([]); setModalStep('FORM'); setShowModal(true);
            setClientName(""); setWhatsappValue(""); setHotelSearch("");
          }} className="w-14 h-14 bg-orange-500 rounded-3xl flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer">
            <Plus size={28} color="#FFFFFF" weight="bold" />
          </button>
        </div>

        <div className="relative">
          <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value.toUpperCase())} placeholder="PESQUISAR NA AGENDA..." className="w-full bg-white border border-gray-200 rounded-[20px] py-4 pl-12 pr-4 text-sm font-bold focus:border-orange-500 outline-none shadow-sm uppercase" />
        </div>

        <div className="space-y-4">
          {filteredBookings.map(b => (
            <div key={b.id} className="agenda-card bg-white border-gray-100 p-4 space-y-3 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-black text-sm text-gray-900 uppercase leading-none">{b.client}</h4>
                  <p className="text-[10px] text-orange-600 font-bold mt-1 uppercase tracking-tight">{b.tour}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase">{b.date}</p>
                  <p className="text-sm font-black text-gray-900">R$ {b.price}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleWhatsAppShare(b)} className="flex-1 bg-[#25D366] text-white py-3 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <WhatsappLogo size={16} weight="fill" /> WhatsApp
                </button>
                <button onClick={() => handleGeneratePDF(b)} className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <FilePdf size={16} weight="fill" /> Voucher
                </button>
                <button onClick={() => openEdit(b)} className="p-3 bg-gray-100 text-gray-500 rounded-xl active:scale-95 transition-all">
                  <Plus size={20} className="rotate-45 hidden" /> {/* Placeholder fallback */}
                  <span className="text-[8px] font-black">EDITAR</span>
                </button>
                <button onClick={() => handleDelete(b.id)} className="p-3 bg-red-50 text-red-500 rounded-xl active:scale-95 transition-all">
                  <Trash size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

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
                        <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          value={selectedClient ? selectedClient.nome : clientSearch}
                          onChange={e => {
                            setClientSearch(e.target.value.toUpperCase());
                            if (selectedClient) {
                              setSelectedClient(null);
                              setClientName("");
                              setWhatsappValue("");
                              setHotelSearch("");
                            }
                          }}
                          placeholder="DIGITE NOME OU CELULAR..."
                          className={`w-full bg-gray-50 border ${selectedClient ? 'border-orange-500 bg-orange-50' : 'border-gray-100'} rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none uppercase transition-all`}
                        />
                        {selectedClient && (
                          <button onClick={() => { setSelectedClient(null); setClientSearch(""); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                            <X size={16} weight="bold" />
                          </button>
                        )}

                        {!selectedClient && filteredClientsSearch.length > 0 && (
                          <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-2xl mt-1 shadow-2xl z-[100] max-h-[200px] overflow-y-auto no-scrollbar">
                            {filteredClientsSearch.map(c => (
                              <button
                                key={c.id}
                                onClick={() => {
                                  setSelectedClient(c);
                                  setClientName(c.nome);
                                  setWhatsappValue(c.whatsapp);
                                  setHotelSearch(c.endereco);
                                  setClientSearch("");
                                }}
                                className="w-full text-left p-4 hover:bg-orange-50 flex flex-col border-b border-gray-50 last:border-0"
                              >
                                <span className="text-[11px] font-black uppercase text-gray-900">{c.nome}</span>
                                <span className="text-[9px] text-gray-400 font-bold uppercase">{c.whatsapp}</span>
                              </button>
                            ))}
                          </div>
                        )}
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

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Local / Hotel</label>
                      <input value={hotelSearch} onChange={e => setHotelSearch(e.target.value.toUpperCase())} placeholder="ONDE ESTÁ HOSPEDADO?" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-orange-500 uppercase" />
                    </div>
                  </div>

                  <div className="bg-orange-50 p-6 rounded-[28px] border border-orange-100 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-orange-800 uppercase ml-1">Passeio</label>
                      <select value={tourValue} onChange={e => setTourValue(e.target.value)} className="w-full bg-white border border-orange-200 rounded-xl p-4 text-xs font-bold text-gray-900 uppercase">
                        <option value="">SELECIONE UM ROTEIRO...</option>
                        <option value="RECIFE DE FORA PRIVATIVO">RECIFE DE FORA PRIVATIVO</option>
                        <option value="TRANCOSO & ESPELHO VIP">TRANCOSO & ESPELHO VIP</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-orange-800 uppercase ml-1">Data</label>
                        <input type="date" value={dateValue} onChange={e => setDateValue(e.target.value)} className="w-full bg-white border border-orange-200 rounded-xl p-4 text-xs font-bold" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-orange-800 uppercase ml-1">Preço (R$)</label>
                        <input value={priceValue} onChange={handlePriceInput} placeholder="0,00" className="w-full bg-white border border-orange-200 rounded-xl p-4 text-xs font-black text-orange-600" />
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
                        <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <div>
                            <p className="text-[11px] font-black text-gray-900 uppercase leading-none">{item.tour}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">{item.date}</p>
                          </div>
                          <span className="text-[11px] font-black text-orange-600">R$ {item.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {modalStep === 'CHECKOUT' && (
                <div className="space-y-8 py-4">
                  <div className="bg-gray-50 p-8 rounded-[32px] text-center border border-gray-100 shadow-inner">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Valor Total</p>
                    <span className="text-4xl font-black text-gray-900">R$ {cart.reduce((a, c) => a + parseFloat(c.price.replace(",", ".")), 0).toFixed(2).replace(".", ",")}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => setPaymentMethod('PIX')} className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${paymentMethod === 'PIX' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                      <QrCode size={28} /> <span className="text-[8px] font-black uppercase tracking-widest">PIX</span>
                    </button>
                    <button onClick={() => setPaymentMethod('CARTÃO')} className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${paymentMethod === 'CARTÃO' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                      <CreditCard size={28} /> <span className="text-[8px] font-black uppercase tracking-widest">Card</span>
                    </button>
                    <button onClick={() => setPaymentMethod('DINHEIRO')} className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${paymentMethod === 'DINHEIRO' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                      <Bank size={28} /> <span className="text-[8px] font-black uppercase tracking-widest">Cash</span>
                    </button>
                  </div>
                </div>
              )}

              {modalStep === 'SUCCESS' && (
                <div className="text-center space-y-6 py-10">
                  <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={56} weight="fill" className="text-orange-500" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase">Reserva Confirmada!</h3>
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
                    {isProcessing ? 'PROCESSANDO...' : 'FINALIZAR AGENDAMENTO'}
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
