import React, { useState, useMemo } from "react";
import { Plus, MagnifyingGlass, FilePdf, X, CheckCircle, Receipt, TrashSimple, PencilSimple, Trash, CaretDown, UserPlus, WhatsappLogo } from "phosphor-react";
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

  // Initial State for Items with Pax Object
  const [items, setItems] = useState<BudgetItem[]>([
    { id: '1', description: '', pax: { adl: 1, chd: 0, free: 0 }, unitPrice: '', total: '' }
  ]);

  const [budgetStatus, setBudgetStatus] = useState<'PENDENTE' | 'ENVIADO' | 'APROVADO' | 'CANCELADO'>('PENDENTE');

  const formatCurrency = (value: string) => {
    const clean = value.replace(/\D/g, "");
    if (!clean) return "";
    const amount = (parseInt(clean) / 100).toFixed(2);
    return amount.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseCurrency = (value: string) => {
    if (!value) return 0;
    // Check if the value is a number-like string with a dot as decimal separator (e.g. "1234.56")
    // and DOES NOT look like a BR format (e.g. "1.234,56")
    // Simple heuristic: if it has a dot but no comma, treat dot as decimal? 
    // Or just trust the app uses BR format exclusively (dot = thousands).
    // Given the context of the app (BR), we stick to BR: dot removed, comma -> dot.
    return parseFloat(value.toString().replace(/\./g, "").replace(",", ".")) || 0;
  };

  const handlePriceChange = (id: string, value: string) => {
    const formatted = formatCurrency(value);
    updateItem(id, { unitPrice: formatted });
  };

  const updateItem = (id: string, updates: Partial<BudgetItem>) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newItem = { ...item, ...updates };
        // User request: Pax is irrelevant for price. Total is just the Unit Price.
        // "valerá o valor registrado no cadastro de Catálogo"
        const price = newItem.unitPrice;
        return { ...newItem, total: price };
      }
      return item;
    }));
  };

  // Helper to update specific pax field
  const updatePax = (id: string, field: 'adl' | 'chd' | 'free', value: string) => {
    const numVal = parseInt(value) || 0;
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newPax = { ...item.pax, [field]: numVal };
        // Ensure total always matches unitPrice (Price per Tour, not per Pax)
        return { ...item, pax: newPax, total: item.unitPrice };
      }
      return item;
    }));
  };

  const addNewItem = () => {
    const lastItem = items[items.length - 1];
    const initialPax = lastItem ? { ...lastItem.pax } : { adl: 1, chd: 0, free: 0 };
    setItems([...items, { id: Math.random().toString(36).substr(2, 9), description: '', pax: initialPax, unitPrice: '', total: '' }]);
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

    let finalClientId = selectedClientId;

    // Quick Add Client
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
        finalClientId = newClient.id;
      } catch (err) {
        alert("Erro ao criar cliente rápido. Tente novamente.");
        return;
      }
    }

    try {
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
        status: budgetStatus
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
      alert("Erro ao salvar orçamento.");
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
    setItems([{ id: '1', description: '', pax: { adl: 1, chd: 0, free: 0 }, unitPrice: '', total: '' }]);
    setHotelSearch("");
    setBudgetStatus('PENDENTE');
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
    // Ensure legacy items have pax object structure if needed, or handle in render
    // For now assuming all data maps correctly, or we fix on load
    const mappedItems = b.items.map(i => ({
      ...i,
      pax: typeof i.pax === 'number' ? { adl: i.pax, chd: 0, free: 0 } : i.pax,
      // Fix: ensure total matches unitPrice immediately on open to fix multiplied totals
      total: i.unitPrice
    }));
    setItems(mappedItems);
    setBudgetStatus(b.status as any || 'PENDENTE');
    setShowModal(true);
  };

  const handleGeneratePDF = (b: Budget) => {
    // ... (Keep existing PDF logic, but update Pax rendering)
    // For brevity, using the previous logic but adapting item.pax
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [215, 110]
    });

    const primaryColor = config.primaryColor || "#F97316";
    const width = 215;
    const height = 110;
    const bodyFontSize = 10;

    // ... (Headers/Structure same as before)
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, width, height, "F");
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, width, 25, "F");
    doc.setFillColor(primaryColor);
    doc.rect(0, 24, width, 1, "F");
    if (config.logo) { try { doc.addImage(config.logo, 'PNG', 10, 4, 16, 16); } catch (e) { } }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("PROPOSTA DE SERVIÇO / PASSEIO", 32, 16);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Nº PROPOSTA: #${b.budgetNumber} | DATA: ${b.date}`, width - 10, 15, { align: "right" });

    // ... (Company & Client Info same) ...
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
    doc.text(`CNPJ: ${config.cnpj || "N/A"} | CADASTUR: ${config.cadastur || "N/A"}`, 10, yPos);
    yPos += 4.5;
    const address = doc.splitTextToSize(`ENDEREÇO: ${config.address || "N/A"}`, 90);
    doc.text(address, 10, yPos);

    const rightColX = 110;
    yPos = 35;
    doc.setFontSize(bodyFontSize);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENTE & OPERAÇÃO", rightColX, yPos);
    doc.setFont("helvetica", "normal");
    yPos += 5;
    doc.text(`NOME: ${b.clientName}`, rightColX, yPos);
    yPos += 4.5;
    doc.text(`WHATSAPP: ${b.clientWhatsapp}`, rightColX, yPos);
    yPos += 4.5;
    doc.text(`OPERADOR: ${user.nome}`, rightColX, yPos);

    // ITENS with split Pax
    yPos = 65;
    doc.setFillColor(243, 244, 246);
    doc.rect(10, yPos, width - 20, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(bodyFontSize - 1);
    doc.text("DESCRIÇÃO DO SERVIÇO", 15, yPos + 5);
    // Removed separate Pax column header to merge with description or keep distinct? 
    // User asked: "Ex.: Caraíva 04ADL | 01 CHD | 0 FREE Valor R$ 1.300,00."
    // This implies creating a string like "Description   Pax Info"
    doc.text("TOTAL", width - 15, yPos + 5, { align: "right" });

    yPos += 11;
    doc.setFont("helvetica", "normal");
    b.items.forEach((item) => {
      const paxDetails = typeof item.pax === 'object'
        ? `${item.pax.adl} ADL | ${item.pax.chd} CHD | ${item.pax.free} FREE`
        : `${item.pax}`;

      doc.text(`${item.description || "PASSEIO"}`, 15, yPos);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(paxDetails, 15, yPos + 4); // Print Pax details below description
      doc.setFontSize(bodyFontSize);
      doc.setTextColor(31, 41, 55);

      doc.text(`R$ ${item.total}`, width - 15, yPos, { align: "right" });
      yPos += 10; // More space for double line
    });

    if (config.pixKey) {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(config.pixKey)}`;
      try { doc.addImage(qrUrl, 'PNG', 10, height - 32, 25, 25); } catch (e) { } // Increased size to 25x25
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("PAGAMENTO VIA PIX:", 38, height - 20); // Adjusted X
      doc.setFont("helvetica", "normal");
      doc.text(`CHAVE: ${config.pixKey}`, 38, height - 16);
    }

    yPos = height - 15;
    doc.setFillColor(31, 41, 55);
    doc.rect(width - 70, yPos, 60, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("TOTAL DA PROPOSTA:", width - 65, yPos + 6.5);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`R$ ${b.totalAmount}`, width - 15, yPos + 6.5, { align: "right" });

    // Page 2 - Condições Gerais
    doc.addPage([215, 110], "landscape");
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, width, 15, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("CONDIÇÕES GERAIS E POLITICA DE CANCELAMENTO", 10, 10);

    doc.setTextColor(31, 41, 55);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const conditions = [
      "1. RESERVAS E PAGAMENTO:",
      "   - A reserva só é garantida mediante comprovante de pagamento.",
      "   - Pagamento via Pix, transferência ou cartão conforme combinado.",
      "",
      "2. CANCELAMENTO E REEMBOLSO:",
      "   - Cancelamento com até 24h de antecedência: Reembolso integral.",
      "   - Cancelamento com menos de 24h: Sem reembolso (No-Show).",
      "   - Em caso de condições climáticas adversas que impeçam o passeio, será agendada nova data ou feito reembolso.",
      "",
      "3. RESPONSABILIDADES:",
      "   - A empresa não se responsabiliza por objetos deixados nos veículos.",
      "   - Horários de saída devem ser rigorosamente respeitados."
    ];

    let condY = 25;
    conditions.forEach(line => {
      doc.text(line, 10, condY);
      condY += 5;
    });

    doc.save(`Proposta_${b.budgetNumber}.pdf`);
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
            <Plus size={28} color="#FFFFFF" weight="bold" />
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

        {/* GRID LAYOUT (Replacing List) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBudgets.map(b => {
            // Calculate Summary Data
            const totalPax = b.items.reduce((acc, item) => {
              const p = item.pax;
              if (typeof p === 'number') return acc + p;
              return acc + (Number(p.adl) || 0) + (Number(p.chd) || 0) + (Number(p.free) || 0);
            }, 0);
            const tourNames = b.items.map(i => i.description || "Item sem nome").join(", ");

            return (
              <div key={b.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                <div className="pl-3">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-gray-900 uppercase text-sm leading-tight truncate pr-2">{b.clientName}</h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 whitespace-nowrap">
                      Nº {b.budgetNumber}
                    </span>
                  </div>

                  <div className="mb-4 space-y-2">
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Resumo do Pacote</p>
                      <p className="text-[10px] font-bold text-gray-700 uppercase line-clamp-2">{tourNames || "Sem itens"}</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">{totalPax} Pax (Total)</p>
                    </div>

                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Valor Total</p>
                      <p className="text-lg font-black text-gray-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseCurrency(b.totalAmount))}
                      </p>
                    </div>

                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${b.status === 'APROVADO' ? 'bg-green-100 text-green-600' :
                      b.status === 'CANCELADO' ? 'bg-red-100 text-red-600' :
                        b.status === 'ENVIADO' ? 'bg-blue-100 text-blue-600' :
                          'bg-yellow-100 text-yellow-600'
                      }`}>
                      {b.status}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <button onClick={() => handleGeneratePDF(b)} className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-2 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95">
                      <FilePdf size={16} weight="bold" />
                      <span className="text-[10px] font-black uppercase tracking-widest">PDF</span>
                    </button>
                    <button onClick={() => openEdit(b)} className="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-gray-100 hover:text-orange-500 transition-colors">
                      <PencilSimple size={18} weight="bold" />
                    </button>
                    <button onClick={async () => {
                      if (confirm("Excluir orçamento?")) {
                        await budgetService.delete(b.id);
                        setBudgets(budgets.filter(x => x.id !== b.id));
                      }
                    }} className="w-10 h-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors">
                      <Trash size={18} weight="bold" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-end sm:items-center justify-center">
          <div className="w-full max-w-lg bg-white rounded-t-[40px] sm:rounded-[40px] flex flex-col max-h-[92vh] animate-slide shadow-2xl overflow-hidden relative border-t-8 border-orange-500">
            {/* ... (Header same, Form updated) ... */}
            <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-gray-100 flex-shrink-0">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                {editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}
              </h3>
              <div className="flex gap-2">
                <button onClick={() => setShowModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} /></button>
              </div>
            </div>

            <form id="budgetForm" onSubmit={handleSave} className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
              {/* Client Section (Same) */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</label>
                  {isQuickAdd ? (
                    <div className="space-y-2">
                      <input value={clientName} onChange={e => setClientName(e.target.value.toUpperCase())} placeholder="NOME" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold uppercase outline-none" />
                      <input value={clientWhatsapp} onChange={e => setClientWhatsapp(e.target.value.toUpperCase())} placeholder="WHATSAPP" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold uppercase outline-none" />
                    </div>
                  ) : (
                    <select value={selectedClientId} onChange={e => handleClientSelect(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold uppercase outline-none">
                      <option value="">SELECIONAR CLIENTE</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  )}
                  <button type="button" onClick={() => setIsQuickAdd(!isQuickAdd)} className="text-[9px] font-black text-orange-600 uppercase mt-1">
                    {isQuickAdd ? "Selecionar Existente" : "+ Novo Cliente Rápido"}
                  </button>
                </div>
              </div>

              {/* Items Section (Updated) */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-black text-orange-600 uppercase tracking-widest">Itens da Proposta</span>
                  <div className="flex gap-2">
                    <select value={budgetStatus} onChange={e => setBudgetStatus(e.target.value as any)} className="bg-gray-100 text-[10px] font-bold rounded-lg px-2 py-1 outline-none">
                      <option value="PENDENTE">PENDENTE</option>
                      <option value="ENVIADO">ENVIADO</option>
                      <option value="APROVADO">APROVADO</option>
                      <option value="CANCELADO">CANCELADO</option>
                    </select>
                    <button type="button" onClick={addNewItem} className="bg-gray-900 text-white px-3 py-1 rounded-lg text-[10px] font-bold">Add Item</button>
                  </div>
                </div>

                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={item.id} className="bg-gray-50 p-5 rounded-2xl border border-gray-100 relative">
                      <button type="button" onClick={() => removeItem(item.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-500"><TrashSimple size={16} /></button>

                      {/* Single Tour Dropdown */}
                      <div className="mb-3">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Serviço</label>
                        <select
                          value={item.description} // Using description to store Tour Title temporarily, or ideally ID. Code maps Title. 
                          onChange={(e) => {
                            const t = tours.find(x => x.title === e.target.value);
                            if (t) {
                              updateItem(item.id, {
                                description: t.title,
                                unitPrice: formatCurrency(t.price.replace(/\D/g, ""))
                              });
                            } else {
                              updateItem(item.id, { description: e.target.value });
                            }
                          }}
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-bold uppercase outline-none"
                        >
                          <option value="">Selecione um passeio...</option>
                          {tours.map(t => <option key={t.id} value={t.title}>{t.title} - {t.price}</option>)}
                        </select>
                      </div>

                      {/* Pax Breakdown & Price */}
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-[8px] font-black text-gray-400 uppercase block mb-1">ADL</label>
                          <input type="number" min="0" value={item.pax.adl} onChange={e => updatePax(item.id, 'adl', e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 text-center font-bold text-xs outline-none" />
                        </div>
                        <div>
                          <label className="text-[8px] font-black text-gray-400 uppercase block mb-1">CHD</label>
                          <input type="number" min="0" value={item.pax.chd} onChange={e => updatePax(item.id, 'chd', e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 text-center font-bold text-xs outline-none" />
                        </div>
                        <div>
                          <label className="text-[8px] font-black text-gray-400 uppercase block mb-1">FREE</label>
                          <input type="number" min="0" value={item.pax.free} onChange={e => updatePax(item.id, 'free', e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 text-center font-bold text-xs outline-none" />
                        </div>

                        <div>
                          <label className="text-[8px] font-black text-gray-400 uppercase block mb-1">Valor Unit.</label>
                          <input value={item.unitPrice} onChange={e => handlePriceChange(item.id, e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 text-center font-bold text-xs text-orange-600 outline-none" />
                        </div>
                      </div>
                      <div className="text-right mt-2">
                        <span className="text-[10px] font-black text-gray-400">Total Item: </span>
                        <span className="text-sm font-black text-gray-900">
                          {/* Ensure item.total is formatted if it's a raw number string */}
                          R$ {item.total.includes(',') ? item.total : parseFloat(item.total || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Total */}
              <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-black uppercase text-gray-500">Total Geral</span>
                  <span className="text-2xl font-black text-gray-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseCurrency(totalAmount))}
                  </span>
                </div>
                <button type="submit" className="w-full bg-orange-500 text-white py-4 rounded-xl font-black uppercase shadow-lg shadow-orange-500/30 active:scale-95 transition-transform">
                  Salvar Orçamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetsView;
