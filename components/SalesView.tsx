
import React, { useState, useMemo, useRef } from "react";
import { User } from "../types";
import { 
  WhatsappLogo, Plus, MapPin, MagnifyingGlass, CheckCircle, 
  Warning, PencilSimple, Trash, CircleNotch, X, FloppyDisk, 
  Camera, TextAlignLeft, Coin 
} from "phosphor-react";

interface Tour {
  id: string;
  name: string;
  region: string;
  price: number;
  description: string;
  image?: string;
}

interface SalesViewProps {
  user: User;
}

const SalesView: React.FC<SalesViewProps> = ({ user }) => {
  const [activeRegion, setActiveRegion] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookedIds, setBookedIds] = useState<string[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'info' | 'warning'} | null>(null);
  
  // State for Modal (Create/Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<Tour>({
    id: '',
    name: '',
    region: 'Porto Seguro',
    price: 0,
    description: '',
    image: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tours, setTours] = useState<Tour[]>([
    { id: '1', name: 'Recife de Fora', region: 'Porto Seguro', price: 180, description: 'Mergulho em piscinas naturais com vida marinha exuberante.', image: 'https://images.unsplash.com/photo-1544551763-47a0159c92b2?auto=format&fit=crop&q=80&w=400' },
    { id: '2', name: 'Praia do Espelho', region: 'Trancoso', price: 250, description: 'Uma das praias mais bonitas do Brasil, famosa por suas falésias.', image: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&q=80&w=400' },
    { id: '3', name: 'Coroa Alta', region: 'Santa Cruz Cabrália', price: 160, description: 'Passeio de escuna com parada em banco de areia e banho de lama.', image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&q=80&w=400' },
  ]);

  const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredTours = useMemo(() => {
    return tours.filter(tour => {
      const matchesRegion = activeRegion === "Todos" || tour.region === activeRegion;
      const matchesSearch = normalize(tour.name).includes(normalize(searchQuery)) || normalize(tour.description).includes(normalize(searchQuery));
      return matchesRegion && matchesSearch;
    });
  }, [activeRegion, searchQuery, tours]);

  const showToast = (msg: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      id: Date.now().toString(),
      name: '',
      region: 'Porto Seguro',
      price: 0,
      description: '',
      image: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tour: Tour) => {
    setModalMode('edit');
    setFormData({ ...tour });
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'create') {
      setTours(prev => [...prev, formData]);
      showToast("Novo passeio adicionado com sucesso!");
    } else {
      setTours(prev => prev.map(t => t.id === formData.id ? formData : t));
      showToast("Passeio atualizado!");
    }
    setIsModalOpen(false);
  };

  const toggleBooking = async (id: string) => {
    setProcessingId(id);
    await new Promise(resolve => setTimeout(resolve, 600));
    if (bookedIds.includes(id)) {
      setBookedIds(prev => prev.filter(i => i !== id));
      showToast("Reserva cancelada.", "info");
    } else {
      setBookedIds(prev => [...prev, id]);
      showToast("Passeio reservado!");
    }
    setProcessingId(null);
  };

  const deleteTour = (id: string) => {
    if (confirm("Deseja remover este passeio do catálogo?")) {
      setTours(prev => prev.filter(t => t.id !== id));
      showToast("Passeio removido.", "warning");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn relative pb-20">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-6 z-[120] p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-slideInRight ${
          toast.type === 'success' ? 'bg-emerald-900 border-emerald-500 text-white' : 
          toast.type === 'warning' ? 'bg-amber-900 border-amber-500 text-white' :
          'bg-blue-900 border-blue-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={20} weight="fill" /> : <Warning size={20} weight="fill" />}
          <span className="text-xs font-black uppercase tracking-widest">{toast.msg}</span>
        </div>
      )}

      {/* Modal de Formulário (Criação/Edição) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="sam-card w-full max-w-2xl bg-[#1E1E1E] border border-[#40A8FC]/30 shadow-2xl my-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                {modalMode === 'create' ? <Plus size={24} color="#40A8FC" /> : <PencilSimple size={24} color="#40A8FC" />}
                {modalMode === 'create' ? 'Novo Passeio' : 'Editar Passeio'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white p-2 transition-colors">
                <X size={28} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lado Esquerdo: Dados */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nome do Destino</label>
                    <input 
                      type="text" 
                      className="sam-input bg-black/40 border-[#333] focus:border-[#40A8FC]" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Ex: Praia da Pitinga"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Região</label>
                      <select 
                        className="sam-input bg-black/40 border-[#333] text-xs"
                        value={formData.region}
                        onChange={e => setFormData({...formData, region: e.target.value})}
                      >
                        <option>Porto Seguro</option>
                        <option>Arraial</option>
                        <option>Trancoso</option>
                        <option>Santa Cruz Cabrália</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                        <Coin size={12} /> Valor (R$)
                      </label>
                      <input 
                        type="number" 
                        className="sam-input bg-black/40 border-[#333]" 
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                      <TextAlignLeft size={12} /> Descritivo do Passeio
                    </label>
                    <textarea 
                      className="sam-input bg-black/40 border-[#333] min-h-[100px] resize-none text-sm" 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      placeholder="Descreva os detalhes do roteiro, o que está incluso e recomendações..."
                      required
                    />
                  </div>
                </div>

                {/* Lado Direito: Foto */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                    <Camera size={12} /> Foto de Capa
                  </label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video w-full rounded-2xl border-2 border-dashed border-[#333] hover:border-[#40A8FC] transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center bg-black/20 group relative"
                  >
                    {formData.image ? (
                      <>
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-[10px] font-black uppercase">Alterar Foto</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <Camera size={40} className="text-gray-600 group-hover:text-[#40A8FC] transition-colors mb-2" />
                        <p className="text-[10px] text-gray-500 font-black uppercase">Clique para Upload</p>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    hidden 
                    ref={fileInputRef} 
                    accept="image/*" 
                    onChange={handleFileChange}
                  />
                  <p className="text-[9px] text-gray-600 font-bold leading-tight">
                    * Use imagens horizontais para melhor visualização nos cards do catálogo.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-[#333] flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 text-[10px] font-black uppercase bg-transparent border border-[#333] hover:bg-white/5 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 sam-btn-primary flex items-center justify-center gap-2 py-4 text-[10px] uppercase shadow-2xl shadow-[#004FCC]/40 active:scale-95"
                >
                  <FloppyDisk size={20} /> {modalMode === 'create' ? 'Cadastrar Passeio' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cabeçalho da View */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Catálogo Operacional</h2>
          <p className="text-gray-400 text-sm font-bold">Gestão de Destinos - Bahia</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="sam-btn-primary flex items-center gap-2 active:scale-95 shadow-xl shadow-[#004FCC]/30"
        >
          <Plus size={20} weight="bold" /> NOVO PASSEIO
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="space-y-4">
        <div className="relative">
          <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="O que você está procurando? (nome ou descrição)" 
            className="sam-input pl-12 bg-[#121212] border-[#333] focus:border-[#40A8FC] shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['Todos', 'Porto Seguro', 'Arraial', 'Trancoso', 'Santa Cruz Cabrália'].map(r => (
            <button 
              key={r}
              onClick={() => setActiveRegion(r)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all active:scale-95 whitespace-nowrap ${activeRegion === r ? 'bg-[#40A8FC] border-[#40A8FC] text-white shadow-lg shadow-[#40A8FC]/30' : 'border-[#333] text-gray-500 hover:border-gray-400'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Listagem */}
      {filteredTours.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTours.map(tour => {
            const isBooked = bookedIds.includes(tour.id);
            const isProcessing = processingId === tour.id;
            return (
              <div key={tour.id} className={`sam-card p-0 overflow-hidden relative transition-all border-2 group flex flex-col ${isBooked ? 'border-emerald-500/50 bg-emerald-950/5' : 'border-white/5 hover:border-[#40A8FC]/50 shadow-xl'}`}>
                
                {/* Imagem de Capa do Card */}
                <div className="relative aspect-video bg-black/40 overflow-hidden">
                   {tour.image ? (
                     <img src={tour.image} alt={tour.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center opacity-20">
                       <MapPin size={48} weight="duotone" />
                     </div>
                   )}
                   <div className="absolute inset-0 bg-gradient-to-t from-[#1E1E1E] via-transparent to-transparent"></div>
                   
                   {/* Badge de Região na Imagem */}
                   <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase px-2 py-1 rounded-lg border border-white/10 tracking-widest">
                     {tour.region}
                   </span>

                   {/* Ações Administrativas Flutuantes */}
                   <div className="absolute top-3 right-3 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                      <button 
                        onClick={() => handleOpenEdit(tour)}
                        className="p-2 bg-black/80 backdrop-blur-md rounded-lg text-[#40A8FC] hover:bg-[#40A8FC] hover:text-white transition-all shadow-xl border border-white/5"
                        title="Editar"
                      >
                        <PencilSimple size={16} weight="bold" />
                      </button>
                      <button 
                        onClick={() => deleteTour(tour.id)}
                        className="p-2 bg-black/80 backdrop-blur-md rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-xl border border-white/5"
                        title="Excluir"
                      >
                        <Trash size={16} weight="bold" />
                      </button>
                   </div>
                </div>

                <div className="p-4 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-black text-sm uppercase leading-tight tracking-tight">{tour.name}</h4>
                    <span className={`text-sm font-black ${isBooked ? 'text-emerald-400' : 'text-[#40A8FC]'}`}>R$ {tour.price}</span>
                  </div>
                  
                  <p className="text-[11px] text-gray-500 font-bold mb-4 line-clamp-2 leading-relaxed h-[32px]">
                    {tour.description || "Nenhuma descrição detalhada disponível para este percurso."}
                  </p>

                  <div className="mt-auto flex gap-2">
                    <button 
                      onClick={() => window.open(`https://wa.me/?text=Olá, gostaria de saber mais sobre o passeio: ${tour.name}`, '_blank')}
                      className="flex-1 py-2.5 bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-emerald-600 hover:text-white transition-all active:scale-95 shadow-inner"
                    >
                      <WhatsappLogo size={14} weight="fill" /> Voucher
                    </button>
                    <button 
                      disabled={isProcessing}
                      onClick={() => toggleBooking(tour.id)}
                      className={`px-4 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all active:scale-95 border flex items-center justify-center gap-2 ${
                        isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                      } ${isBooked ? 'bg-red-900/20 border-red-500 text-red-500' : 'bg-white text-black hover:bg-[#40A8FC] hover:text-white hover:border-[#40A8FC]'}`}
                    >
                      {isProcessing ? <CircleNotch size={14} className="animate-spin" /> : null}
                      {isBooked ? 'CANCELAR' : 'RESERVAR'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="sam-card py-20 flex flex-col items-center justify-center text-center opacity-50 grayscale border-dashed border-2">
          <Warning size={48} className="mb-4 text-gray-600" />
          <p className="font-black uppercase tracking-widest text-sm">Nenhum percurso localizado</p>
          <button 
            onClick={() => {setActiveRegion('Todos'); setSearchQuery('');}}
            className="mt-4 text-[10px] font-black text-[#40A8FC] bg-[#40A8FC]/10 px-4 py-2 rounded-full uppercase transition-colors"
          >
            Limpar Busca
          </button>
        </div>
      )}
    </div>
  );
};

export default SalesView;
