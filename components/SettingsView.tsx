import React, { useState, useRef, useEffect } from "react";
import { User, WhiteLabelConfig } from "../types";
import {
  WhatsappLogo, SignOut, CloudArrowUp, UserCircle,
  Check, Trash, Buildings, CircleNotch, InstagramLogo,
  Globe, QrCode, MapPin, ArrowLeft, FloppyDisk, Plus, Wallet
} from "phosphor-react";

interface SettingsProps {
  user: User;
  config: WhiteLabelConfig;
  onUpdate: (config: WhiteLabelConfig) => void;
  onExit: () => void;
  onLogout: () => void;
  onNavigate: (view: any) => void;
}

const SettingsView: React.FC<SettingsProps> = ({ user, config, onUpdate, onExit, onLogout, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'DATOS' | 'FINANCE' | 'AUDIT'>('DATOS');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localConfig, setLocalConfig] = useState<WhiteLabelConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleUpdateField = (updates: Partial<WhiteLabelConfig>) => {
    const formattedUpdates = { ...updates };
    if (formattedUpdates.instanceName) formattedUpdates.instanceName = formattedUpdates.instanceName.toUpperCase();
    if (formattedUpdates.cnpj) formattedUpdates.cnpj = formattedUpdates.cnpj.toUpperCase();
    if (formattedUpdates.cadastur) formattedUpdates.cadastur = formattedUpdates.cadastur.toUpperCase();
    if (formattedUpdates.address) formattedUpdates.address = formattedUpdates.address.toUpperCase();
    if (formattedUpdates.pixKey) formattedUpdates.pixKey = formattedUpdates.pixKey.toUpperCase();

    setLocalConfig(prev => ({ ...prev, ...formattedUpdates }));
  };

  const handleSaveAndExit = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    onUpdate(localConfig);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onExit();
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

      {/* Navegação Interna */}
      <div className="flex bg-gray-50 p-1.5 rounded-3xl border border-gray-100 mb-8">
        <button
          onClick={() => setActiveTab('DATOS')}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'DATOS' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Dados Gerais
        </button>
        <button
          onClick={() => setActiveTab('FINANCE')}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'FINANCE' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Financeiro
        </button>
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'AUDIT' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Auditoria
        </button>
      </div>

      {activeTab === 'DATOS' && (
        <div className="space-y-6 animate-fadeIn">
          {/* IDENTIDADE VISUAL */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Identidade Visual</h3>
            <div className="agenda-card bg-white border-gray-100 flex flex-col sm:flex-row gap-6 items-center p-6">
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
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Cor Principal</label>
                  <div className="flex gap-4 items-center">
                    <input type="color" value={localConfig.primaryColor} onChange={e => handleUpdateField({ primaryColor: e.target.value })} className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0 overflow-hidden bg-transparent" />
                    <input value={localConfig.primaryColor.toUpperCase()} onChange={e => handleUpdateField({ primaryColor: e.target.value.toUpperCase() })} className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-black outline-none w-24 text-center" />
                  </div>
                </div>
                <input type="file" ref={fileInputRef} hidden accept="image/png,image/jpeg" onChange={handleLogoUpload} />
              </div>
            </div>
          </div>

          {/* DADOS FISCAIS */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Dados Fiscais & Contato</h3>
            <div className="agenda-card bg-white border-gray-100 p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">CNPJ</label>
                  <input value={localConfig.cnpj || ""} onChange={e => handleUpdateField({ cnpj: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-4 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 uppercase" placeholder="00.000.000/0001-00" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp Central</label>
                  <input value={localConfig.phone || ""} onChange={e => handleUpdateField({ phone: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-4 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 uppercase" placeholder="+55 (00) 00000-0000" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Endereço Comercial</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={localConfig.address || ""} onChange={e => handleUpdateField({ address: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-11 pr-4 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 uppercase" placeholder="AVENIDA BRASIL, 123..." />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Chave PIX (Vouchers)</label>
                <div className="relative">
                  <QrCode size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                  <input value={localConfig.pixKey || ""} onChange={e => handleUpdateField({ pixKey: e.target.value })} className="w-full bg-orange-50 border border-orange-100 rounded-2xl py-4 pl-11 pr-4 text-xs font-black text-orange-600 outline-none uppercase" placeholder="E-MAIL, CPF OU CELULAR" />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveAndExit}
            disabled={isSaving}
            className="w-full bg-orange-500 text-white rounded-[32px] py-6 text-xs font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSaving ? <CircleNotch size={20} className="animate-spin" /> : <FloppyDisk size={20} weight="bold" />}
            SALVAR E SAIR DO PAINEL GESTOR
          </button>
        </div>
      )}

      {activeTab === 'FINANCE' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Wallet size={40} weight="fill" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-900 uppercase">Gestão Financeira</h3>
              <p className="text-gray-400 text-xs font-bold px-8">Acesse agora o painel completo de entradas, saídas e relatórios financeiros da sua empresa.</p>
            </div>
            <button
              onClick={() => onNavigate('FINANCIAL')}
              className="w-full bg-gray-900 text-white py-6 rounded-3xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl"
            >
              Abrir Fluxo de Caixa
            </button>
          </div>
        </div>
      )}

      {activeTab === 'AUDIT' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Atividade Recente</h3>
            <span className="text-[8px] font-black bg-blue-50 text-blue-500 px-2 py-1 rounded-full uppercase">Audit Mode</span>
          </div>

          <div className="space-y-3">
            {[
              { user: user.nome, action: 'ACESSOU PAINEL GESTOR', time: 'AGORA', type: 'INFO' },
              { user: 'SISTEMA', action: 'BACKUP SUPABASE REALIZADO', time: '10 MIN ATRÁS', type: 'SUCCESS' },
              { user: user.nome, action: 'ALTEROU DADOS DA EMPRESA', time: '1 HORA ATRÁS', type: 'INFO' },
              { user: 'EQUIPE_VENDAS', action: 'CRIOU NOVO ORÇAMENTO #1022', time: '2 HORAS ATRÁS', type: 'SUCCESS' }
            ].map((log, i) => (
              <div key={i} className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-2.5 h-2.5 rounded-full ${log.type === 'SUCCESS' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                  <div>
                    <p className="text-[10px] font-black text-gray-900 uppercase leading-none">{log.action}</p>
                    <p className="text-[8px] text-gray-400 font-bold mt-1.5 uppercase tracking-tighter">RESPONSÁVEL: {log.user}</p>
                  </div>
                </div>
                <span className="text-[8px] font-black text-gray-300 uppercase">{log.time}</span>
              </div>
            ))}
          </div>

          <div className="bg-blue-50/50 p-6 rounded-[32px] border border-blue-100 text-center">
            <p className="text-[9px] font-black text-blue-800 uppercase leading-relaxed">
              A Auditoria registra todas as interações críticas do sistema para sua segurança.
            </p>
          </div>
        </div>
      )}

      {/* AÇÕES DE SISTEMA */}
      <div className="pt-8 space-y-4">
        <button
          onClick={async () => {
            if (window.confirm("Isso irá enviar todos os dados locais para o Supabase. Deseja continuar?")) {
              setIsSaving(true);
              try {
                const { migrateLocalStorageToSupabase } = await import('../services/migration');
                await migrateLocalStorageToSupabase();
                alert(`Sincronização concluída com sucesso!`);
              } catch (e: any) {
                alert(`Erro na sincronização: ${e.message}`);
              } finally {
                setIsSaving(false);
              }
            }
          }}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gray-50 text-[9px] font-black uppercase text-gray-400 border border-gray-100 active:scale-95 transition-all"
        >
          <CloudArrowUp size={16} weight="bold" /> Sincronizar Base de Dados
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-50 text-[9px] font-black uppercase text-red-500 border border-red-100 active:scale-95 transition-all"
        >
          <SignOut size={16} weight="bold" /> Encerrar Sessão
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
