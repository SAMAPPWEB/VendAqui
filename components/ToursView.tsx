
import React, { useState, useRef } from "react";
import { Timer, Plus, X, Trash, PencilSimple, Camera } from "phosphor-react";
import { tourService } from "../services/databaseService";
import { Tour } from "../types";

interface ToursViewProps {
  tours: Tour[];
  onUpdateTours: (tours: Tour[]) => void;
}

const ToursView: React.FC<ToursViewProps> = ({ tours, onUpdateTours }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setTempImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTour = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);

    const tourPayload = {
      image: tempImage || editingTour?.image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600",
      title: formData.get('title')?.toString().toUpperCase() || "",
      price: formData.get('price')?.toString() || "0,00",
      duration: formData.get('duration')?.toString().toUpperCase() || "",
      region: formData.get('region')?.toString().toUpperCase() || "",
      rating: "5.0",
      description: ""
    };

    try {
      if (editingTour) {
        const updated = await tourService.update(editingTour.id, tourPayload);
        onUpdateTours(tours.map(t => t.id === editingTour.id ? updated : t));
      } else {
        const created = await tourService.create(tourPayload);
        onUpdateTours([created, ...tours]);
      }
      setShowForm(false);
      setEditingTour(null);
      setTempImage(null);
    } catch (error) {
      console.error("Erro ao salvar passeio:", error);
      alert("Erro ao salvar passeio.");
    } finally {
      setIsLoading(false);
    }
  };

  const removeTour = async (id: string) => {
    if (!confirm("Excluir passeio?")) return;
    try {
      await tourService.delete(id);
      onUpdateTours(tours.filter(t => t.id !== id));
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  };

  return (
    <div className="px-6 pb-20">
      <div className="space-y-6 animate-slide">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 uppercase leading-none">Catálogo</h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Roteiros e Experiências</p>
          </div>
          <button
            onClick={() => { setEditingTour(null); setTempImage(null); setShowForm(true); }}
            className="w-14 h-14 rounded-3xl bg-orange-500 flex items-center justify-center text-white shadow-lg active:scale-90 transition-all cursor-pointer"
          >
            <Plus size={28} weight="bold" />
          </button>
        </div>

        <div className="space-y-6">
          {tours.map(tour => (
            <div key={tour.id} className="agenda-card p-0 overflow-hidden bg-white border-gray-100 shadow-sm relative">
              <div className="relative h-48">
                <img src={tour.image} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-lg font-black text-white uppercase leading-none">{tour.title}</h3>
                  <span className="text-[9px] font-black uppercase text-orange-400 mt-1 inline-block">{tour.region}</span>
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={() => { setEditingTour(tour); setTempImage(tour.image); setShowForm(true); }} className="w-10 h-10 bg-white/40 backdrop-blur-md rounded-xl flex items-center justify-center text-white cursor-pointer hover:bg-orange-500 transition-colors"><PencilSimple size={20} /></button>
                  <button onClick={() => removeTour(tour.id)} className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white cursor-pointer hover:bg-red-600 transition-colors"><Trash size={20} /></button>
                </div>
              </div>
              <div className="p-5 flex justify-between items-center">
                <p className="text-xl font-black text-gray-900">R$ {tour.price}</p>
                <p className="text-xs font-black text-gray-600 flex items-center gap-1 uppercase"><Timer size={14} /> {tour.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-end sm:items-center justify-center">
          <div className="w-full max-w-lg bg-white rounded-t-[40px] sm:rounded-[40px] flex flex-col max-h-[92vh] animate-slide shadow-2xl overflow-hidden relative border-t-8 border-orange-500">
            <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-gray-100 flex-shrink-0">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">
                {editingTour ? "Configurar Destino" : "Novo Passeio"}
              </h3>
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 rounded-full text-[9px] font-black text-gray-500 uppercase tracking-widest hover:bg-gray-200 transition-colors cursor-pointer">
                  Retornar
                </button>
                <button onClick={() => setShowForm(false)} className="p-3 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors cursor-pointer">
                  <X size={24} weight="bold" />
                </button>
              </div>
            </div>

            <form id="tourForm" onSubmit={handleSaveTour} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Foto Principal</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-44 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 overflow-hidden cursor-pointer relative"
                >
                  {tempImage ? <img src={tempImage} className="w-full h-full object-cover" /> : <Camera size={40} />}
                  <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleFileSelect} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Título do Passeio</label>
                <input name="title" defaultValue={editingTour?.title} required placeholder="EX: TOUR PRIVATIVO TRANCOSO" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-orange-500 uppercase transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Preço (R$)</label>
                  <input name="price" defaultValue={editingTour?.price} required placeholder="0,00" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold text-orange-600 outline-none uppercase transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Duração</label>
                  <input name="duration" defaultValue={editingTour?.duration} required placeholder="EX: 06:00H" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-orange-500 uppercase transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Região</label>
                <input name="region" defaultValue={editingTour?.region} required placeholder="EX: ARRAIAL D'AJUDA" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-orange-500 uppercase transition-all" />
              </div>
              <div className="h-10"></div>
            </form>

            <div className="px-8 py-6 bg-white border-t border-gray-100 flex-shrink-0">
              <button
                type="submit"
                form="tourForm"
                disabled={isLoading}
                className="w-full bg-orange-500 text-white rounded-3xl py-6 text-[11px] font-black uppercase shadow-xl active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? "Salvando..." : "Salvar Roteiro"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToursView;
