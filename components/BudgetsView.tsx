
import React, { useState, useMemo } from "react";
import { Plus, MagnifyingGlass, FilePdf, X, CheckCircle, Receipt, TrashSimple, PencilSimple, Trash, CaretDown, UserPlus } from "phosphor-react";
import { jsPDF } from "jspdf";
import { WhiteLabelConfig, Budget, BudgetItem, User, Client, Tour } from "../types";
import { budgetService, clientService } from "../services/databaseService";

interface BudgetsViewProps {
  config: WhiteLabelConfig;
  budgets: Budget[];
  setBudgets: (budgets: Budget[]) => void;
  user: User;
  clients: Client[];
  onUpdateClients: (clients: Client[]) => void;
  tours: Tour[];
}

const BudgetsView: React.FC<BudgetsViewProps> = ({ config, budgets, setBudgets, user, clients, onUpdateClients, tours }) => {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientWhatsapp, setClientWhatsapp] = useState("");
  const [hotelSearch, setHotelSearch] = useState("");
  const [isQuickAdd, setIsQuickAdd] = useState(false);

  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<BudgetItem[]>([
    { id: '1', description: '', pax: 1, unitPrice: '', total: '' }
  ]);

  const formatCurrency = (value: string) => {
    const clean = value.replace(/\D/g, "");
    if (!clean) return "";
    const amount = (parseInt(clean) / 100).toFixed(2);
    return amount.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseCurrency = (value: string) => {
    return parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;
  };

  const handlePriceChange = (id: string, value: string) => {
    const formatted = formatCurrency(value);
    updateItem(id, { unitPrice: formatted });
  };

  const updateItem = (id: string, updates: Partial<BudgetItem>) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newItem = { ...item, ...updates };
        const price = parseCurrency(newItem.unitPrice);
        const total = (price * newItem.pax).toFixed(2).replace(".", ",");
        return { ...newItem, total: formatCurrency(total.replace(",", "")) };
      }
      return item;
    }));
  };

  const handleDescriptionChange = (id: string, value: string) => {
    const upperValue = value.toUpperCase();
    const matchedTour = tours.find(t => t.title.toUpperCase() === upperValue);

    if (matchedTour) {
      // Se encontrou o passeio, atualiza descrição e preço
      updateItem(id, {
        description: upperValue,
        unitPrice: formatCurrency(matchedTour.price.replace(/[^\d]/g, ""))
      });
    } else {
      // Caso contrário apenas a descrição
      updateItem(id, { description: upperValue });
    }
  };

  const addNewItem = () => {
    setItems([...items, { id: Math.random().toString(36).substr(2, 9), description: '', pax: 1, unitPrice: '', total: '' }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const totalAmount = useMemo(() => {
    const total = items.reduce((acc, curr) => acc + parseCurrency(curr.total), 0);
    return total.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }, [items]);

  const handleClientSelect = (id: string) => {
    setSelectedClientId(id);
    const client = clients.find(c => c.id === id);
    if (client) {
      setClientName(client.nome.toUpperCase());
      setClientWhatsapp(client.whatsapp.toUpperCase());
      setIsQuickAdd(false);
    } else {
      setClientName("");
      setClientWhatsapp("");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert("Informe o nome do cliente.");
      return;
    }

    const upperName = clientName.trim().toUpperCase();
    const upperWhatsapp = clientWhatsapp.trim().toUpperCase();


    // Persistência: Cliente (se novo)
    let finalClientId = selectedClientId;

    // Se for client rápido (QuickAdd), cria no banco
    if (isQuickAdd && !clients.find(c => c.nome.toUpperCase() === upperName)) {
      try {
        const newClient = await clientService.create({
          nome: upperName,
          whatsapp: upperWhatsapp,
          email: "",
          endereco: hotelSearch.toUpperCase(),
          senhaPortal: "123456",
          dataAtivacao: new Date().toISOString(),
          status: 'ATIVO'
        });
        onUpdateClients([newClient, ...clients]);
        finalClientId = newClient.id; // Usa o ID gerado pelo banco
      } catch (err) {
        alert("Erro ao criar cliente rápido. Tente novamente.");
        return;
      }
    }

    try {
      // Objeto base para envio.
      const today = new Date();
      const formattedToday = today.toLocaleDateString('pt-BR');

      let formattedValidUntil = validUntil;
      if (!formattedValidUntil) {
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        formattedValidUntil = nextWeek.toLocaleDateString('pt-BR');
      }

      const budgetPayload = {
        budgetNumber: editingBudget?.budgetNumber || (budgets.length + 1).toString().padStart(4, '0'),
        clientName: upperName,
        clientWhatsapp: upperWhatsapp,
        date: editingBudget?.date || formattedToday,
        validUntil: formattedValidUntil,
        items: items,
        totalAmount: totalAmount,
        notes: notes,
        status: editingBudget?.status || 'PENDENTE'
      };

      if (editingBudget) {
        const updated = await budgetService.update(editingBudget.id, budgetPayload);
        setBudgets(budgets.map(b => b.id === editingBudget.id ? updated : b));
      } else {
        const created = await budgetService.create(budgetPayload);
        setBudgets([created, ...budgets]);
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error);
      alert("Erro ao salvar orçamento. Verifique o console.");
    }
  };

  const resetForm = () => {
    setEditingBudget(null);
    setSelectedClientId("");
    setClientName("");
    setClientWhatsapp("");
    setIsQuickAdd(false);
    setValidUntil("");
    setNotes("");
    setItems([{ id: '1', description: '', pax: 1, unitPrice: '', total: '' }]);
    setHotelSearch("");
  };

  const openEdit = (b: Budget) => {
    setEditingBudget(b);
    setClientName(b.clientName.toUpperCase());
    setClientWhatsapp(b.clientWhatsapp.toUpperCase());
    const existingClient = clients.find(c => c.nome.toUpperCase() === b.clientName.toUpperCase());
    if (existingClient) {
      setSelectedClientId(existingClient.id);
      setIsQuickAdd(false);
    } else {
      setIsQuickAdd(true);
    }
    setValidUntil(b.validUntil);
    setNotes(b.notes);
    setItems(b.items);
    setShowModal(true);
  };

  const handleGeneratePDF = (b: Budget) => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [215, 110]
    });

    const primaryColor = config.primaryColor || "#F97316";
    const width = 215;
    const height = 110;
    const bodyFontSize = 10;

    // --- PÁGINA 1: CABEÇALHO E ITENS ---
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
    doc.text(`CÓDIGO: #${b.budgetNumber} | EMISSÃO: ${b.date}`, width - 10, 15, { align: "right" });

    let yPos = 35;
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(bodyFontSize);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DA EMPRESA", 10, yPos);
    doc.setFont("helvetica", "normal");
    yPos += 5;
    doc.text(`${config.instanceName}`, 10, yPos);
    yPos += 4.5;
    doc.text(`CNPJ: ${config.cnpj || "N/A"} | CADASTUR: ${config.cadastur || "N/A"}`, 10, yPos);
    yPos += 4.5;
    doc.text(`ENDEREÇO: ${config.address || "N/A"}`, 10, yPos);

    yPos = 35;
    doc.setFontSize(bodyFontSize);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENTE & OPERAÇÃO", width / 2 + 10, yPos);
    doc.setFont("helvetica", "normal");
    yPos += 5;
    doc.text(`NOME: ${b.clientName}`, width / 2 + 10, yPos);
    yPos += 4.5;
    doc.text(`WHATSAPP: ${b.clientWhatsapp}`, width / 2 + 10, yPos);
    yPos += 4.5;
    doc.text(`OPERADOR: ${user.nome}`, width / 2 + 10, yPos);

    yPos = 65;
    doc.setFillColor(243, 244, 246);
    doc.rect(10, yPos, width - 20, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(bodyFontSize - 1);
    doc.text("DESCRIÇÃO DO SERVIÇO", 15, yPos + 5);
    doc.text("PAX", width - 70, yPos + 5, { align: "center" });
    doc.text("TOTAL", width - 15, yPos + 5, { align: "right" });

    yPos += 11;
    doc.setFont("helvetica", "normal");
    b.items.forEach((item) => {
      doc.text(item.description || "PASSEIO", 15, yPos);
      doc.text(item.pax.toString(), width - 70, yPos, { align: "center" });
      doc.text(`R$ ${item.total}`, width - 15, yPos, { align: "right" });
      yPos += 6;
    });

    // --- RODAPÉ PÁGINA 1: PIX COM QR CODE DINÂMICO ---
    if (config.pixKey) {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(config.pixKey)}`;
      doc.addImage(qrUrl, 'PNG', 10, height - 28, 18, 18);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("PAGAMENTO VIA PIX:", 30, height - 20);
      doc.setFont("helvetica", "normal");
      doc.text(`CHAVE: ${config.pixKey}`, 30, height - 16);
    }

    yPos = height - 15;
    doc.setFillColor(31, 41, 55);
    doc.rect(width - 70, yPos, 60, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("TOTAL:", width - 65, yPos + 6.5);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`R$ ${b.totalAmount}`, width - 15, yPos + 6.5, { align: "right" });

    // --- PÁGINA 2: POLÍTICA E REDES SOCIAIS DINÂMICAS ---
    doc.addPage([215, 110], "landscape");
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, width, height, "F");
    doc.setFillColor(primaryColor);
    doc.rect(10, 10, 3, 10, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("POLÍTICA DE CANCELAMENTO", 18, 17.5);

    let termsY = 30;
    doc.setFontSize(bodyFontSize);
    const terms = [
      { t: "RESSARCIMENTO:", b: "Cancelamento em até 48h antes do passeio garante ressarcimento de 50%. Em período inferior a 48h não haverá ressarcimento." },
      { t: "CONDIÇÕES CLIMÁTICAS:", b: "A Empresa reserva-se o direito de adiar ou cancelar o passeio em situações de mau tempo extremo visando a segurança." },
      { t: "PONTUALIDADE:", b: "Atrasos superiores a 15 minutos do horário agendado podem ser considerados No-Show." }
    ];

    terms.forEach(term => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryColor);
      doc.text(term.t, 15, termsY);
      termsY += 4.5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 200);
      const splitText = doc.splitTextToSize(term.b, width - 30);
      doc.text(splitText, 15, termsY);
      termsY += (splitText.length * 4.5) + 5;
    });

    // --- RODAPÉ PÁGINA 2: BARRA SOCIAL ---
    doc.setFillColor(primaryColor);
    doc.rect(0, height - 10, width, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");

    const footerParts = [];
    if (config.instagram) footerParts.push(`INSTAGRAM: ${config.instagram}`);
    if (config.site) footerParts.push(`SITE: ${config.site}`);
    if (config.phone) footerParts.push(`WHATSAPP: ${config.phone}`);

    if (footerParts.length > 0) {
      doc.text(footerParts.join("  |  "), width / 2, height - 4, { align: "center" });
    }

    doc.save(`Voucher_${b.budgetNumber}.pdf`);
  };

  const filteredBudgets = budgets.filter(b => b.clientName.toLowerCase().includes(search.toLowerCase()) || b.budgetNumber.includes(search));

  return (
    <div className="px-6 pb-20">
      <div className="space-y-6 animate-slide">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 uppercase leading-none">Orçamentos</h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Vendas & Propostas</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="w-14 h-14 bg-orange-500 rounded-3xl flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer"
          >
            <Receipt size={28} color="#FFFFFF" weight="bold" />
          </button>
        </div>

        <div className="relative">
          <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value.toUpperCase())}
            placeholder="Pesquisar..."
            className="w-full bg-white border border-gray-200 rounded-[20px] py-4 pl-12 pr-4 text-sm focus:border-orange-500 outline-none shadow-sm font-bold uppercase"
          />
        </div>

        <div className="space-y-4">
          {filteredBudgets.map(b => (
            <div key={b.id} className="agenda-card bg-white border-l-8 border-orange-500 p-5 space-y-4 shadow-sm group">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[8px] font-black bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase font-mono mb-1 inline-block">Nº {b.budgetNumber}</span>
                  <h4 className="font-black text-sm text-gray-900 uppercase leading-tight">{b.clientName}</h4>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-gray-900">R$ {b.totalAmount}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleGeneratePDF(b)} className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 active:scale-95 cursor-pointer hover:bg-black transition-colors">
                  <FilePdf size={16} weight="bold" /> Gerar Voucher
                </button>
                <button onClick={() => openEdit(b)} className="w-12 bg-gray-50 text-gray-400 rounded-xl hover:text-orange-500 hover:bg-orange-50 transition-colors cursor-pointer flex items-center justify-center active:scale-95">
                  <PencilSimple size={20} weight="bold" />
                </button>
                <button onClick={async () => {
                  if (confirm("Excluir orçamento?")) {
                    try {
                      await budgetService.delete(b.id);
                      setBudgets(budgets.filter(x => x.id !== b.id));
                    } catch (err) {
                      alert("Erro ao excluir orçamento.");
                    }
                  }
                }} className="w-12 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 active:scale-95 cursor-pointer flex items-center justify-center transition-colors">
                  <Trash size={20} weight="bold" />
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
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                {editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}
              </h3>
              <div className="flex gap-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 rounded-full text-[9px] font-black text-gray-500 uppercase tracking-widest hover:bg-gray-200 transition-colors">
                  Retornar
                </button>
                <button onClick={() => setShowModal(false)} className="p-3 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors">
                  <X size={24} weight="bold" />
                </button>
              </div>
            </div>

            <form id="budgetForm" onSubmit={handleSave} className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</label>
                    <button
                      type="button"
                      onClick={() => setIsQuickAdd(!isQuickAdd)}
                      className={`text-[9px] font-black uppercase flex items-center gap-1 transition-colors ${isQuickAdd ? 'text-red-500' : 'text-orange-600'}`}
                    >
                      {isQuickAdd ? <><X size={12} weight="bold" /> Cancelar</> : <><UserPlus size={12} weight="bold" /> Add Rápido</>}
                    </button>
                  </div>

                  {isQuickAdd ? (
                    <div className="space-y-3 animate-fadeIn">
                      <input value={clientName} onChange={e => setClientName(e.target.value.toUpperCase())} required placeholder="NOME DO NOVO CLIENTE" className="w-full bg-gray-50 border border-orange-200 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-orange-500 uppercase" />
                      <input value={clientWhatsapp} onChange={e => setClientWhatsapp(e.target.value.toUpperCase())} placeholder="WHATSAPP +55..." className="w-full bg-gray-50 border border-orange-200 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-orange-500 uppercase" />
                      <input value={hotelSearch} onChange={e => setHotelSearch(e.target.value.toUpperCase())} placeholder="HOTEL / POUSADA" className="w-full bg-gray-50 border border-orange-200 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-orange-500 uppercase" />
                    </div>
                  ) : (
                    <div className="relative">
                      <select value={selectedClientId} onChange={e => handleClientSelect(e.target.value)} required={!isQuickAdd} className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-orange-500 appearance-none uppercase">
                        <option value="">BUSCAR CLIENTE NA BASE...</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.nome.toUpperCase()} ({c.whatsapp})</option>)}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 flex items-center gap-2">
                        <MagnifyingGlass size={16} />
                        <CaretDown size={14} weight="bold" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-black text-orange-600 uppercase tracking-widest">Itens da Proposta</span>
                  <button type="button" onClick={addNewItem} className="flex items-center gap-1 text-[10px] font-black text-white bg-gray-900 px-4 py-2 rounded-xl active:scale-95 transition-all">
                    Adicionar Item
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="bg-gray-50 p-6 rounded-[28px] border border-gray-100 space-y-4 relative">
                      <button type="button" onClick={() => removeItem(item.id)} className="absolute top-4 right-4 text-red-400 p-2 hover:bg-red-50 rounded-full">
                        <TrashSimple size={20} />
                      </button>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Serviço / Descrição</label>
                          <label className="text-[9px] font-black text-orange-600 uppercase tracking-widest">
                            <span className="hidden sm:inline">Preencher com </span>Passeio Cadastrado
                          </label>
                        </div>

                        <div className="relative mb-3 group">
                          <select
                            onChange={(e) => {
                              const selectedTour = tours.find(t => t.id === e.target.value);
                              if (selectedTour) {
                                // Atualiza descrição e preço com base no passeio selecionado
                                let priceString = selectedTour.price.toString();
                                let rawDigits = priceString.replace(/\D/g, "");

                                if (!priceString.includes('.') && !priceString.includes(',')) {
                                  rawDigits += "00";
                                }

                                updateItem(item.id, {
                                  description: selectedTour.title.toUpperCase(),
                                  unitPrice: formatCurrency(rawDigits)
                                });
                                // Resetar o select para permitir nova seleção e feedback visual
                                e.target.value = "";
                              }
                            }}
                            className="w-full bg-orange-50 border border-orange-100 rounded-xl py-3 px-4 text-[11px] font-black text-orange-600 focus:border-orange-500 outline-none uppercase cursor-pointer appearance-none hover:bg-orange-100 transition-colors"
                          >
                            <option value="">📂 Selecionar Passeio da Lista...</option>
                            {tours.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.title.toUpperCase()} - {t.price}
                              </option>
                            ))}
                          </select>
                          <CaretDown size={14} weight="bold" className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-400 pointer-events-none group-hover:text-orange-600" />
                        </div>

                        <input
                          value={item.description}
                          onChange={e => handleDescriptionChange(item.id, e.target.value)}
                          list="tours-list"
                          className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-xs font-bold text-gray-900 focus:border-orange-500 outline-none uppercase"
                          placeholder="EX: PASSEIO RECIFE DE FORA"
                        />
                        <datalist id="tours-list">
                          {tours.map(t => (
                            <option key={t.id} value={t.title.toUpperCase()}>
                              R$ {t.price}
                            </option>
                          ))}
                        </datalist>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">PAX</label>
                          <input type="number" value={item.pax} onChange={e => updateItem(item.id, { pax: parseInt(e.target.value) || 1 })} className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-xs font-black text-center" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Valor R$</label>
                          <input value={item.unitPrice} onChange={e => handlePriceChange(item.id, e.target.value)} placeholder="0,00" className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-xs font-black text-orange-600" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900 rounded-[28px] p-6 text-white flex justify-between items-center shadow-xl mb-6">
                <div>
                  <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Total da Proposta</p>
                  <p className="text-2xl font-black">R$ {totalAmount}</p>
                </div>
                <Receipt size={32} className="text-orange-500 opacity-50" />
              </div>
            </form>

            <div className="px-8 py-6 bg-white border-t border-gray-100 flex-shrink-0">
              <button type="submit" form="budgetForm" className="w-full bg-orange-500 text-white rounded-3xl py-6 text-[11px] font-black uppercase shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                <CheckCircle size={20} weight="bold" /> {editingBudget ? 'Atualizar Proposta' : 'Gerar Orçamento PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetsView;
