
import React, { useState, useRef } from "react";
// Fixed import source for WhiteLabelConfig
import { WhiteLabelConfig } from "../types";
import { 
  HardDrives, Warning, CurrencyCircleDollar, 
  Gear, CheckCircle, Clock, X, Globe, Key, ShieldCheck, 
  CloudArrowUp, Trash, CircleNotch
} from "phosphor-react";

interface AdminViewProps {
  currentConfig: WhiteLabelConfig;
  onUpdateConfig: (config: WhiteLabelConfig) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ currentConfig, onUpdateConfig }) => {
  const [projects, setProjects] = useState([
    { id: '1', name: "App Turismo Porto Seguro", progress: 75, deadline: "15/Nov", status: "EM_DIA" },
    { id: '2', name: "Sistema ERP Delivery", progress: 40, deadline: "02/Dez", status: "ATRASADO" },
    { id: '3', name: "App Gestão Imobiliária", progress: 95, deadline: "25/Out", status: "CONCLUIDO" },
  ]);

  const [showWhiteLabel, setShowWhiteLabel] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estado local para rascunho das configurações
  const [draftConfig, setDraftConfig] = useState<WhiteLabelConfig>({ ...currentConfig });
  const logoInputRef = useRef<HTMLInputElement>(null);

  const boostProject = (id: string) => {
    setProjects(prev => prev.map(p => {
      if(p.id === id && p.progress < 100) {
        return { ...p, progress: Math.min(p.progress + 5, 100), status: p.progress + 5 >= 100 ? 'CONCLUIDO' : p.status };
      }
      return p;
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDraftConfig(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftConfig(prev => ({ ...prev, logo: null }));
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simula salvamento no banco de dados da instância
    await new Promise(resolve => setTimeout(resolve, 1000));
    onUpdateConfig(draftConfig);
    setIsSaving(false);
    setShowWhiteLabel(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Modal WhiteLabel */}
      {showWhiteLabel && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/95 backdrop-blur-xl animate-fadeIn overflow-y-auto">
          <div className="sam-card w-full max-w-4xl bg-[#121212] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] my-auto relative overflow-hidden">
            
            <div className="flex justify-between items-center mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                  <Gear size={28} className="text-white animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">WhiteLabel Engine</h3>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Personalização da Instância SaaS</p>
                </div>
              </div>
              <button 
                onClick={() => setShowWhiteLabel(false)} 
                className="text-gray-500 hover:text-white p-2 transition-colors hover:bg-white/5 rounded-full"
              >
                <X size={28} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
              {/* Sidebar Configurações Visuais */}
              <div className="lg:col-span-4 space-y-4">
                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-6">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Marca e Cores</h4>
                  
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase flex justify-between">
                      Identidade Visual (PNG)
                      {draftConfig.logo && (
                        <button onClick={removeLogo} className="text-red-500 hover:underline flex items-center gap-1">
                           <Trash size={10} /> REMOVER
                        </button>
                      )}
                    </label>
                    
                    <input 
                      type="file" 
                      hidden 
                      ref={logoInputRef} 
                      accept="image/png,image/svg+xml,image/jpeg"
                      onChange={handleLogoUpload}
                    />

                    <div 
                      onClick={() => logoInputRef.current?.click()}
                      className={`h-32 rounded-xl border-2 border-dashed transition-all cursor-pointer bg-black/20 flex flex-col items-center justify-center gap-2 overflow-hidden relative group ${
                        draftConfig.logo ? 'border-white/30' : 'border-[#333] hover:border-white/50'
                      }`}
                    >
                      {draftConfig.logo ? (
                        <>
                          <img src={draftConfig.logo} alt="Preview" className="w-full h-full object-contain p-4" />
                          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Alterar Logo</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-3 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors">
                            <CloudArrowUp size={24} className="text-gray-500 group-hover:text-white" />
                          </div>
                          <p className="text-[9px] font-black text-gray-500 uppercase group-hover:text-white">Upload Logo PNG</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-gray-500 uppercase">Cor Primária do Sistema</label>
                    <div className="flex flex-wrap gap-2">
                      {['#40A8FC', '#E11D48', '#10B981', '#F59E0B', '#8B5CF6'].map(color => (
                        <div 
                          key={color}
                          onClick={() => setDraftConfig(prev => ({ ...prev, primaryColor: color }))}
                          className={`w-8 h-8 rounded-lg cursor-pointer transition-all border-2 ${draftConfig.primaryColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2 mb-2 text-gray-400">
                    <ShieldCheck size={18} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Modo Estrutural</span>
                  </div>
                  <p className="text-[9px] text-gray-500 font-bold leading-relaxed">
                    Alterações visuais são propagadas via CSS Variables para todos os módulos conectados.
                  </p>
                </div>
              </div>

              {/* Conteúdo de Integrações */}
              <div className="lg:col-span-8 space-y-6">
                <div className="sam-card bg-black/20 border-white/5">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Key size={16} /> API Integration Keys
                  </h4>
                  
                  <div className="space-y-4">
                    <ApiKeyInput label="Google Maps API" value="AIzaSyB_k8...90xZ2" status="Ativo" />
                    <ApiKeyInput label="Gemini AI Gateway" value="sk-gemini-v2...Xy91" status="Ativo" />
                    <ApiKeyInput label="WhatsApp API Business" value="EAAO...9z2" status="Pendente" />
                  </div>
                </div>

                <div className="sam-card bg-black/20 border-white/5">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Globe size={16} /> Domínios Customizados
                  </h4>
                  <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                    <div>
                      <p className="text-xs font-bold">cliente.samapp.com.br</p>
                      <p className="text-[9px] text-emerald-500 font-black uppercase">CNAME Propagado</p>
                    </div>
                    <button className="text-[9px] font-black text-gray-500 border border-white/10 px-3 py-1 rounded-lg hover:bg-white/5">Configurar</button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    disabled={isSaving}
                    onClick={() => setShowWhiteLabel(false)} 
                    className="flex-1 py-4 bg-transparent border border-white/10 rounded-xl text-[10px] font-black uppercase hover:bg-white/5 transition-all disabled:opacity-50"
                  >
                    Descartar
                  </button>
                  <button 
                    disabled={isSaving}
                    onClick={handleSave}
                    className="flex-1 py-4 text-[10px] font-black uppercase flex items-center justify-center gap-2 rounded-xl text-white transition-all active:scale-95 disabled:opacity-50"
                    style={{ backgroundColor: draftConfig.primaryColor }}
                  >
                    {isSaving ? <CircleNotch size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                    {isSaving ? 'SALVANDO...' : 'SALVAR INSTÂNCIA'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Principal do Admin */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Gestão Operacional SaaS</h2>
          <p className="text-gray-400 text-sm font-bold">Controle de builds e entregas mobile.</p>
        </div>
        <button className="sam-btn-primary bg-amber-600 hover:bg-amber-500 flex items-center gap-2 active:scale-95 shadow-lg shadow-amber-900/20">
          <Warning size={18} weight="bold" /> ALERTAS CRÍTICOS
        </button>
      </div>

      <div className="sam-card border-t-4" style={{ borderTopColor: currentConfig.primaryColor }}>
        <h3 className="text-xs font-black uppercase text-gray-400 mb-6 flex items-center gap-2 tracking-widest">
          <HardDrives size={16} style={{ color: currentConfig.primaryColor }} /> Sprints Ativas (Builds v2.4)
        </h3>
        <div className="space-y-8">
          {projects.map(proj => (
            <ProjectItem 
              key={proj.id} 
              {...proj} 
              activeColor={currentConfig.primaryColor}
              onBoost={() => boostProject(proj.id)} 
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="sam-card bg-[#121212] border border-[#333]">
          <h3 className="text-[10px] font-black uppercase text-gray-500 mb-4 flex items-center gap-2">
            <CurrencyCircleDollar size={18} /> Financeiro SaaS
          </h3>
          <div className="space-y-3">
             <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl">
               <span className="text-xs font-bold text-gray-400">Receita Recurrente (MRR)</span>
               <span className="text-sm font-black text-emerald-400">R$ 18.500</span>
             </div>
             <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl">
               <span className="text-xs font-bold text-gray-400">Inadimplência</span>
               <span className="text-sm font-black text-red-400">R$ 420</span>
             </div>
          </div>
        </div>

        <div className="sam-card bg-gradient-to-br from-[#121212] to-[#2D2D2D] border border-[#333] flex flex-col justify-center items-center text-center p-6 group hover:border-white/20 transition-all duration-300">
           <div className="p-4 bg-black/40 rounded-2xl mb-4 shadow-inner group-hover:scale-110 transition-transform">
             <Gear size={32} style={{ color: currentConfig.primaryColor }} className="animate-spin-slow" />
           </div>
           <p className="text-xs font-black uppercase tracking-widest mb-1">Configurações WhiteLabel</p>
           <p className="text-[10px] text-gray-500 font-bold max-w-[200px] mx-auto leading-tight">Personalize cores, logos e chaves de API desta instância.</p>
           <button 
            onClick={() => {
              setDraftConfig({ ...currentConfig });
              setShowWhiteLabel(true);
            }}
            className="mt-4 text-[10px] font-black text-white px-6 py-2.5 rounded-lg transition-all shadow-xl active:scale-95"
            style={{ backgroundColor: currentConfig.primaryColor }}
           >
             ACESSAR PAINEL
           </button>
        </div>
      </div>
    </div>
  );
};

const ApiKeyInput: React.FC<{label: string, value: string, status: string}> = ({ label, value, status }) => (
  <div className="space-y-1">
    <div className="flex justify-between">
      <label className="text-[9px] font-black text-gray-500 uppercase">{label}</label>
      <span className={`text-[8px] font-black uppercase px-1.5 rounded ${status === 'Ativo' ? 'text-emerald-500 bg-emerald-500/10' : 'text-amber-500 bg-amber-500/10'}`}>{status}</span>
    </div>
    <div className="relative group">
      <input 
        type="password" 
        value={value} 
        readOnly 
        className="sam-input py-2.5 text-xs bg-black/60 border-[#333] pr-20"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
        <button className="text-[9px] font-black text-gray-400 p-1.5 hover:text-white uppercase">Copiar</button>
      </div>
    </div>
  </div>
);

const ProjectItem: React.FC<{name: string, progress: number, deadline: string, status: string, activeColor: string, onBoost: () => void}> = ({ name, progress, deadline, status, activeColor, onBoost }) => (
  <div className="group cursor-pointer" onClick={onBoost}>
    <div className="flex justify-between items-end mb-2">
      <div>
        <p className="text-sm font-black transition-colors" style={{ color: progress > 0 ? undefined : activeColor }}>{name}</p>
        <div className="flex items-center gap-2 mt-1">
          <Clock size={12} className="text-gray-500" />
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Entrega estimada: {deadline}</p>
        </div>
      </div>
      <div className="text-right">
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
          status === 'ATRASADO' ? 'bg-red-900/30 text-red-500 border border-red-500/20' : 
          status === 'CONCLUIDO' ? 'bg-emerald-900/30 text-emerald-500 border border-emerald-500/20' :
          'bg-gray-800 text-gray-400'
        }`}>
          {status.replace('_', ' ')}
        </span>
        <p className="text-[10px] font-black mt-1 text-gray-400">{progress}%</p>
      </div>
    </div>
    <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-white/5 shadow-inner">
      <div 
        className={`h-full transition-all duration-500 ease-out shadow-lg`} 
        style={{ 
          width: `${progress}%`,
          backgroundColor: status === 'ATRASADO' ? '#ef4444' : (status === 'CONCLUIDO' ? '#10b981' : activeColor)
        }}
      ></div>
    </div>
  </div>
);

export default AdminView;
