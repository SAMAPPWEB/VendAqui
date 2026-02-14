
import React, { useState, useRef, useEffect } from "react";
import { User, WhiteLabelConfig } from "../types";
import {
  WhatsappLogo, SignOut, CloudArrowUp, UserCircle,
  Check, Trash, Buildings, CircleNotch, InstagramLogo,
  Globe, QrCode, MapPin, ArrowLeft, FloppyDisk
} from "phosphor-react";

interface SettingsProps {
  user: User;
  config: WhiteLabelConfig;
  onUpdate: (config: WhiteLabelConfig) => void;
  onExit: () => void;
  onLogout: () => void;
}

const SettingsView: React.FC<SettingsProps> = ({ user, config, onUpdate, onExit, onLogout }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localConfig, setLocalConfig] = useState<WhiteLabelConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleUpdateField = (updates: Partial<WhiteLabelConfig>) => {
    const formattedUpdates = { ...updates };
    // Forçar uppercase para manter o padrão visual do sistema
    if (formattedUpdates.instanceName) formattedUpdates.instanceName = formattedUpdates.instanceName.toUpperCase();
    if (formattedUpdates.cnpj) formattedUpdates.cnpj = formattedUpdates.cnpj.toUpperCase();
    if (formattedUpdates.cadastur) formattedUpdates.cadastur = formattedUpdates.cadastur.toUpperCase();
    if (formattedUpdates.address) formattedUpdates.address = formattedUpdates.address.toUpperCase();
    if (formattedUpdates.pixKey) formattedUpdates.pixKey = formattedUpdates.pixKey.toUpperCase();

    const newConfig = { ...localConfig, ...formattedUpdates };
    setLocalConfig(newConfig);
  };

  const handleSaveAndExit = async () => {
    setIsSaving(true);
    // Simulando tempo de processamento para feedback visual
    await new Promise(resolve => setTimeout(resolve, 1000));
    onUpdate(localConfig);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onExit(); // Retorna ao Dashboard
    }, 500);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsSaving(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const scale = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png', 0.7);
          handleUpdateField({ logo: dataUrl });
          setIsSaving(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="px-6 space-y-6 animate-slide pb-24 relative z-10">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-300 shadow-sm overflow-hidden">
            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserCircle size={32} weight="duotone" />}
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter leading-none">{user.nome}</h2>
            <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest mt-1">Gestor da Unidade</p>
          </div>
        </div>
        <button onClick={onExit} className="p-3 bg-gray-100 rounded-2xl text-gray-500 active:scale-90 transition-all">
          <ArrowLeft size={20} weight="bold" />
        </button>
      </div>

      <div className="space-y-6">
        {/* IDENTIDADE VISUAL */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Identidade Visual</h3>
          <div className="agenda-card bg-white border-gray-100 flex flex-col sm:flex-row gap-6 items-center">
            <div
              onClick={() => !isSaving && fileInputRef.current?.click()}
              className={`w-32 h-32 rounded-3xl bg-gray-50 border-2 border-dashed flex flex-col items-center justify-center text-gray-400 cursor-pointer overflow-hidden group relative transition-all ${isSaving ? 'opacity-50' : 'hover:border-orange-500'}`}
            >
              {localConfig.logo ? (
                <>
                  <img src={localConfig.logo} className="w-full h-full object-contain p-2" alt="Logo" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Trash size={24} color="white" onClick={(e) => { e.stopPropagation(); handleUpdateField({ logo: null }); }} />
                  </div>
                </>
              ) : (
                <>
                  {isSaving ? <CircleNotch size={24} className="animate-spin text-orange-500" /> : <CloudArrowUp size={32} />}
                  <span className="text-[8px] font-black uppercase mt-2">Logomarca</span>
                </>
              )}
            </div>
            <div className="flex-1 w-full space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome da Agência</label>
                <div className="relative">
                  <Buildings size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    value={localConfig.instanceName}
                    onChange={(e) => handleUpdateField({ instanceName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-11 pr-4 text-xs font-black uppercase text-gray-900 outline-none focus:border-orange-500 transition-all"
                    placeholder="NOME DA EMPRESA"
                  />
                </div>
              </div>
              <input type="file" ref={fileInputRef} hidden accept="image/png,image/jpeg" onChange={handleLogoUpload} />
            </div>
          </div>
        </div>

        {/* DADOS FISCAIS */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Dados Fiscais & Endereço</h3>
          <div className="agenda-card bg-white border-gray-100 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">CNPJ</label>
                <input
                  value={localConfig.cnpj || ""}
                  onChange={(e) => handleUpdateField({ cnpj: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-4 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 uppercase"
                  placeholder="00.000.000/0001-00"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">CADASTUR</label>
                <input
                  value={localConfig.cadastur || ""}
                  onChange={(e) => handleUpdateField({ cadastur: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-4 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 uppercase"
                  placeholder="00.000000.00-0"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Endereço Comercial</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  value={localConfig.address || ""}
                  onChange={(e) => handleUpdateField({ address: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-11 pr-4 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 uppercase"
                  placeholder="CIDADE, ESTADO, ENDEREÇO COMPLETO"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CANAIS DE COMUNICAÇÃO E PAGAMENTO */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Presença Digital & Financeiro</h3>
          <div className="agenda-card bg-white border-gray-100 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Instagram</label>
                <div className="relative">
                  <InstagramLogo size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500" />
                  <input
                    value={localConfig.instagram || ""}
                    onChange={(e) => handleUpdateField({ instagram: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-11 pr-4 text-xs font-bold text-gray-900 outline-none focus:border-orange-500"
                    placeholder="@seuagencia"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Site Oficial</label>
                <div className="relative">
                  <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                  <input
                    value={localConfig.site || ""}
                    onChange={(e) => handleUpdateField({ site: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-11 pr-4 text-xs font-bold text-gray-900 outline-none focus:border-orange-500"
                    placeholder="www.seusite.com.br"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp Central</label>
                <div className="relative">
                  <WhatsappLogo size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                  <input
                    value={localConfig.phone || ""}
                    onChange={(e) => handleUpdateField({ phone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-11 pr-4 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 uppercase"
                    placeholder="+55 (00) 00000-0000"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Chave PIX (Para Voucher)</label>
                <div className="relative">
                  <QrCode size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                  <input
                    value={localConfig.pixKey || ""}
                    onChange={(e) => handleUpdateField({ pixKey: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-11 pr-4 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 uppercase"
                    placeholder="CNPJ, E-MAIL OU TELEFONE"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AÇÕES FINAIS */}
        <div className="pt-4 space-y-4">
          <button
            onClick={handleSaveAndExit}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-3 py-6 rounded-[24px] bg-orange-500 text-[11px] font-black uppercase text-white shadow-xl shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? <CircleNotch size={20} className="animate-spin" /> : <FloppyDisk size={20} weight="bold" />}
            SALVAR E SAIR DO PAINEL GESTOR
          </button>

          <button
            onClick={async () => {
              if (window.confirm("Isso irá enviar todos os dados locais para o Supabase. Deseja continuar?")) {
                setIsSaving(true);
                try {
                  const { migrateLocalStorageToSupabase } = await import('../services/migration');
                  const report = await migrateLocalStorageToSupabase();
                  alert(`Migração concluída!\nSucesso: ${JSON.stringify(report, null, 2)}`);
                } catch (e: any) {
                  alert(`Erro na migração: ${e.message}`);
                } finally {
                  setIsSaving(false);
                }
              }
            }}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-[24px] bg-blue-50 text-[9px] font-black uppercase text-blue-600 border border-blue-100 active:scale-95 transition-all"
          >
            <CloudArrowUp size={16} weight="bold" /> MIGRAR DADOS PARA CLOUD (SUPABASE)
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-[24px] bg-red-50 text-[9px] font-black uppercase text-red-500 border border-red-100 active:scale-95 transition-all"
          >
            <SignOut size={16} weight="bold" /> ENCERRAR SESSÃO NO DISPOSITIVO
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
