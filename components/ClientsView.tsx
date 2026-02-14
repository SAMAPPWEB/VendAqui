
import React, { useState, useMemo } from "react";
import { Plus, MagnifyingGlass, UserCircle, X, Key, Calendar, MapPin, WhatsappLogo, CheckCircle, Warning, Clock, Trash, PencilSimple, EnvelopeSimple, IdentificationCard, House, ToggleLeft, ToggleRight, ShieldCheck } from "phosphor-react";
import { Client } from "../types";
import { clientService } from "../services/databaseService";

interface ClientsViewProps {
  clients: Client[];
  onUpdateClients: (clients: Client[]) => void;
}

const ClientsView: React.FC<ClientsViewProps> = ({ clients, onUpdateClients }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredClients = useMemo(() => {
    return clients.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase()));
  }, [clients, search]);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const fd = new FormData(e.currentTarget as HTMLFormElement);

    const tempClient: Omit<Client, 'id' | 'historico'> = {
      nome: fd.get('nome')?.toString().toUpperCase() || "",
      email: fd.get('email')?.toString().toLowerCase() || "",
      whatsapp: fd.get('whatsapp')?.toString().toUpperCase() || "",
      endereco: fd.get('endereco')?.toString().toUpperCase() || "",
      senhaPortal: fd.get('senha') as string,
      dataAtivacao: new Date().toISOString(),
      status: 'ATIVO'
    };

    try {
      const created = await clientService.create(tempClient);
      onUpdateClients([created, ...clients]);
      setShowAdd(false);
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
      alert("Erro ao cadastrar cliente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    setIsProcessing(true);
    const fd = new FormData(e.currentTarget as HTMLFormElement);

    const updates: Partial<Client> = {
      nome: fd.get('nome')?.toString().toUpperCase() || "",
      whatsapp: fd.get('whatsapp')?.toString().toUpperCase() || "",
      endereco: fd.get('endereco')?.toString().toUpperCase() || "",
      senhaPortal: fd.get('senha') as string,
    };

    try {
      await clientService.update(editingClient.id, updates);
      onUpdateClients(clients.map(c => c.id === editingClient.id ? { ...c, ...updates } : c));
      setShowEdit(false);
      setEditingClient(null);
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      alert("Erro ao atualizar dados do cliente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover cliente da base permanentemente?")) return;
    try {
      await clientService.delete(id);
      onUpdateClients(clients.filter(c => c.id !== id));
    } catch (error) {
      console.error("Erro ao deletar:", error);
      alert("Erro ao remover cliente.");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: 'ATIVO' | 'INATIVO') => {
    const nextStatus = currentStatus === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    try {
      await clientService.update(id, { status: nextStatus });
      onUpdateClients(clients.map(c => c.id === id ? { ...c, status: nextStatus } : c));
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao alterar status do cliente.");
    }
  };

  return (
    <div className="px-6 pb-20">
      <div className="space-y-6 animate-slide">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 uppercase leading-none">Clientes</h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Base Central de Dados</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="w-14 h-14 bg-orange-500 rounded-3xl flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer text-white">
            <Plus size={28} weight="bold" />
          </button>
        </div>

        <div className="relative">
          <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value.toUpperCase())}
            placeholder="Buscar cliente..."
            className="w-full bg-white border border-gray-200 rounded-[20px] py-4 pl-12 pr-4 text-sm focus:border-orange-500 outline-none shadow-sm font-bold uppercase"
          />
        </div>

        <div className="space-y-4">
          {filteredClients.map(client => (
            <div key={client.id} className="agenda-card bg-white border-gray-100 p-5 flex flex-col gap-4 shadow-sm group">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-orange-500 border border-gray-100 shadow-inner">
                    <UserCircle size={28} weight="fill" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-gray-900 uppercase leading-none">{client.nome}</h4>
                    <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest mt-1 inline-block">ID: {client.id.substring(0, 8)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingClient(client);
                      setShowEdit(true);
                    }}
                    className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:text-orange-500 transition-colors cursor-pointer"
                    title="Alterar Cliente"
                  >
                    <PencilSimple size={20} weight="bold" />
                  </button>
                  <button onClick={() => handleDelete(client.id)} className="p-2.5 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all cursor-pointer">
                    <Trash size={20} weight="bold" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <WhatsappLogo size={16} className="text-emerald-500" />
                  <span className="text-[11px] font-bold text-gray-600">{client.whatsapp}</span>
                </div>

                <button
                  onClick={() => handleToggleStatus(client.id, client.status)}
                  className={`flex items-center gap-1.5 text-[9px] font-black uppercase transition-colors cursor-pointer ${client.status === 'ATIVO' ? 'text-orange-600' : 'text-red-400'}`}
                >
                  {client.status === 'ATIVO' ? <ToggleRight size={24} weight="fill" /> : <ToggleLeft size={24} weight="fill" />}
                  {client.status}
                </button>
              </div>
            </div>
          ))}

          {filteredClients.length === 0 && (
            <div className="py-20 text-center opacity-30 flex flex-col items-center">
              <IdentificationCard size={48} className="mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest">Nenhum cliente localizado</p>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-end sm:items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-t-[40px] sm:rounded-[40px] flex flex-col max-h-[92vh] animate-slide shadow-2xl overflow-hidden relative border-t-8 border-orange-500">
            <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-gray-100 flex-shrink-0">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">Novo Cliente</h3>
              <div className="flex gap-2">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-100 rounded-full text-[9px] font-black text-gray-500 uppercase tracking-widest hover:bg-gray-200 transition-colors cursor-pointer">
                  Retornar
                </button>
                <button onClick={() => !isProcessing && setShowAdd(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors cursor-pointer">
                  <X size={24} weight="bold" />
                </button>
              </div>
            </div>

            <form id="clientForm" onSubmit={handleAddClient} className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input name="nome" placeholder="Ex: MARIA OLIVEIRA" required className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-orange-500 transition-all uppercase" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp / Telefone</label>
                <div className="relative">
                  <WhatsappLogo size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                  <input name="whatsapp" placeholder="+55 (00) 00000-0000" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-orange-500 transition-all uppercase" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">HOTEL / AP</label>
                <div className="relative">
                  <House size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input name="endereco" placeholder="Nome do Hotel ou Prédio e Apto" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-orange-500 transition-all uppercase" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha do Portal (Exclusivo)</label>
                <div className="relative">
                  <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" />
                  <input name="senha" placeholder="Crie uma senha de acesso" required className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-orange-500 transition-all" />
                </div>
              </div>
              <div className="h-10"></div>
            </form>

            <div className="px-8 py-6 bg-white border-t border-gray-100 flex-shrink-0">
              <button type="submit" disabled={isProcessing} form="clientForm" className="w-full bg-orange-500 text-white rounded-3xl py-6 text-[11px] font-black uppercase shadow-xl shadow-orange-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50">
                {isProcessing ? 'SALVANDO...' : 'CADASTRAR E ATIVAR CLIENTE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEdit && editingClient && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-end sm:items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-t-[40px] sm:rounded-[40px] flex flex-col max-h-[92vh] animate-slide shadow-2xl overflow-hidden relative border-t-8 border-orange-500">
            <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-gray-100 flex-shrink-0">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">Alterar Cliente</h3>
              <div className="flex gap-2">
                <button onClick={() => setShowEdit(false)} className="px-4 py-2 bg-gray-100 rounded-full text-[9px] font-black text-gray-500 uppercase tracking-widest hover:bg-gray-200 transition-colors cursor-pointer">
                  Retornar
                </button>
                <button onClick={() => !isProcessing && setShowEdit(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors cursor-pointer">
                  <X size={24} weight="bold" />
                </button>
              </div>
            </div>

            <form id="editClientForm" onSubmit={handleEditClient} className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input name="nome" defaultValue={editingClient.nome} placeholder="Ex: MARIA OLIVEIRA" required className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-orange-500 transition-all uppercase" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp / Telefone</label>
                <div className="relative">
                  <WhatsappLogo size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                  <input name="whatsapp" defaultValue={editingClient.whatsapp} placeholder="+55 (00) 00000-0000" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-orange-500 transition-all uppercase" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">HOTEL / AP</label>
                <div className="relative">
                  <House size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input name="endereco" defaultValue={editingClient.endereco} placeholder="Nome do Hotel ou Prédio e Apto" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-orange-500 transition-all uppercase" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha do Portal (Exclusivo)</label>
                <div className="relative">
                  <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" />
                  <input name="senha" defaultValue={editingClient.senhaPortal} placeholder="Alterar senha de acesso" required className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-orange-500 transition-all" />
                </div>
              </div>
              <div className="h-10"></div>
            </form>

            <div className="px-8 py-6 bg-white border-t border-gray-100 flex-shrink-0">
              <button type="submit" disabled={isProcessing} form="editClientForm" className="w-full bg-orange-500 text-white rounded-3xl py-6 text-[11px] font-black uppercase shadow-xl shadow-orange-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50">
                {isProcessing ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsView;
