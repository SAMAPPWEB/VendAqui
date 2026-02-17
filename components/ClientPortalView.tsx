import React from "react";
import { DownloadSimple, FilePdf, Image as ImageIcon, MapPin, Calendar, Star, Info, WarningCircle, SignOut, Folder } from "phosphor-react";
import { mediaService } from "../services/mediaService";
import { BookingMedia } from "../types";

interface ClientPortalProps {
  clientName: string;
  clientId?: string;
  onLogout: () => void;
}

const ClientPortalView: React.FC<ClientPortalProps> = ({ clientName, clientId, onLogout }) => {
  const [media, setMedia] = React.useState<BookingMedia[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (clientId) {
      loadMedia();
    }
  }, [clientId]);

  const loadMedia = async () => {
    if (!clientId) return;
    setIsLoading(true);
    try {
      const data = await mediaService.getMediaByClient(clientId);
      setMedia(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const groupedMedia = React.useMemo(() => {
    const groups: { [key: string]: BookingMedia[] } = {};
    media.forEach(m => {
      if (!groups[m.folderName]) groups[m.folderName] = [];
      groups[m.folderName].push(m);
    });
    return groups;
  }, [media]);

  return (
    <div className="px-6 space-y-6 animate-slide pb-10">
      <div className="bg-orange-500 rounded-[32px] p-8 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Bem-vindo(a) ao seu portal</p>
          <h2 className="text-3xl font-black tracking-tighter leading-tight uppercase">{clientName}</h2>
          <div className="flex items-center gap-2 mt-4">
            <span className="px-3 py-1 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">Acesso Premium</span>
          </div>
        </div>
        <Star size={120} weight="fill" className="absolute -bottom-10 -right-10 text-white/10" />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="agenda-card bg-amber-50 border-amber-100 flex items-center gap-4 p-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <WarningCircle size={24} weight="fill" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Aviso de Segurança</p>
            <p className="text-[9px] text-amber-600 font-bold uppercase leading-tight mt-0.5">Sua senha de acesso expira em breve. Entre em contato com seu agente para renovação se necessário.</p>
          </div>
        </div>

        <section className="space-y-3">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Seus Vouchers</h3>
          <div className="agenda-card space-y-3 border-gray-100">
            <VoucherItem tour="Recife de Fora VIP" date="26/10/2024" />
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Suas Recordações</h3>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[32px] border border-gray-100">
              <ImageIcon size={48} weight="thin" className="text-orange-200 mb-4 animate-[bounce_2s_infinite]" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Carregando mídias...</p>
            </div>
          ) : Object.keys(groupedMedia).length === 0 ? (
            <div className="p-12 text-center bg-white rounded-[32px] border border-gray-100 shadow-sm">
              <ImageIcon size={48} weight="thin" className="mx-auto text-gray-200 mb-4" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nenhuma foto disponível</p>
              <p className="text-[8px] text-gray-300 font-bold uppercase mt-2">Peça ao seu guia para enviar as fotos do seu passeio!</p>
            </div>
          ) : (
            Object.entries(groupedMedia).map(([folderName, photos]) => (
              <div key={folderName} className="space-y-4">
                <div className="flex items-center gap-3 ml-2">
                  <Folder size={16} weight="bold" className="text-orange-500" />
                  <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{folderName}</h4>
                  <span className="text-[9px] font-bold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded-full">{photos.length} Itens</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((photo) => (
                    <PhotoItem key={photo.id} url={photo.url} filename={photo.filename} />
                  ))}
                </div>
              </div>
            ))
          )}
          <p className="text-[8px] text-gray-400 font-black text-center uppercase tracking-widest pt-4">Arquivos originais em alta resolução</p>
        </section>
      </div>

      <div className="agenda-card bg-white border-orange-100 p-6 flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
          <Info size={28} weight="duotone" />
        </div>
        <div>
          <h4 className="text-xs font-black text-gray-900 uppercase">Suporte 24h</h4>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 leading-relaxed">Teve algum problema com seus arquivos? Chame nosso suporte técnico direto no WhatsApp.</p>
        </div>
        <button className="w-full py-4 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all">Falar com Agente</button>
      </div>

      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-3 py-5 rounded-[24px] bg-red-50 text-[10px] font-black uppercase text-red-500 border border-red-100 active:scale-95 transition-all hover:bg-red-100"
      >
        <SignOut size={20} weight="bold" /> Sair da Minha Conta
      </button>
    </div>
  );
};

const VoucherItem = ({ tour, date }: any) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group transition-all hover:border-orange-200">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-orange-500 shadow-sm">
        <FilePdf size={24} weight="duotone" />
      </div>
      <div>
        <p className="text-xs font-black text-gray-900 uppercase">{tour}</p>
        <p className="text-[9px] text-gray-400 font-bold uppercase">{date}</p>
      </div>
    </div>
    <button className="p-3 bg-white rounded-xl text-orange-500 border border-gray-100 shadow-sm active:scale-90 transition-transform">
      <DownloadSimple size={20} weight="bold" />
    </button>
  </div>
);

const PhotoItem = ({ url, filename }: { url: string; filename?: string }) => {
  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'foto.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error downloading:', err);
      window.open(url, '_blank');
    }
  };

  return (
    <div className="relative group rounded-2xl overflow-hidden aspect-square shadow-sm border border-gray-100 bg-gray-50">
      <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-110" loading="lazy" />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button
          onClick={handleDownload}
          className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/20 active:scale-90 transition-transform hover:bg-white/40"
        >
          <DownloadSimple size={24} weight="bold" />
        </button>
      </div>
    </div>
  );
};

export default ClientPortalView;