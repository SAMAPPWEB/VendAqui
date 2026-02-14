
import React, { useState } from "react";
import { User } from "../types";
import { Eye, EyeSlash, Lock, User as UserIcon, Warning, CalendarCheck, ArrowLeft, WhatsappLogo, CheckCircle, CircleNotch, Users } from "phosphor-react";
import { authService } from "../services/authService";

interface AuthViewProps {
  onLogin: (user: User) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [loginMode, setLoginMode] = useState<'EQUIPE' | 'CLIENTE'>('EQUIPE');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (loginMode === 'EQUIPE') {
        const user = await authService.login(email, password);
        if (user) {
          onLogin(user);
        } else {
          setError("Credenciais inválidas ou acesso inativo.");
          setIsLoading(false);
        }
      } else {
        // Login Cliente
        const clientUser = await authService.clientLogin(email, password);
        if (clientUser) {
          onLogin(clientUser);
        } else {
          setError("Acesso não encontrado. Verifique seus dados.");
          setIsLoading(false);
        }
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Erro de conexão. Tente novamente.");
      setIsLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    setRecoverySent(true);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F3F4F6]">
      <div className="w-full max-sm bg-white p-8 rounded-[32px] shadow-xl border border-gray-200 animate-slide">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <CalendarCheck size={40} weight="fill" color="#FFFFFF" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">AGENDAQUI</h1>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">
            {isForgotPassword ? "Portal de Recuperação" : "Passeios privativos - CRM"}
          </p>
        </div>

        <div className="flex bg-gray-50 p-1 rounded-2xl mb-8 border border-gray-100">
          <button
            onClick={() => setLoginMode('EQUIPE')}
            className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${loginMode === 'EQUIPE' ? 'bg-white text-orange-600 shadow-sm border border-orange-100' : 'text-gray-400'}`}
          >
            Equipe
          </button>
          <button
            onClick={() => setLoginMode('CLIENTE')}
            className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${loginMode === 'CLIENTE' ? 'bg-white text-orange-600 shadow-sm border border-orange-100' : 'text-gray-400'}`}
          >
            Portal Cliente
          </button>
        </div>

        {!isForgotPassword ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                {loginMode === 'EQUIPE' ? 'Usuário' : 'Nome/E-mail'}
              </label>
              <div className="relative">
                {loginMode === 'EQUIPE' ? <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} /> : <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />}
                <input
                  type="text"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-orange-500 outline-none transition-all text-gray-900 placeholder-gray-400"
                  placeholder={loginMode === 'EQUIPE' ? "Usuário ou e-mail (VER1)" : "Informe seu nome ou e-mail"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Senha</label>
                <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[9px] font-black uppercase text-orange-600 hover:text-orange-500 transition-colors">Esqueci minha senha</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-12 text-sm focus:border-orange-500 outline-none transition-all text-gray-900 placeholder-gray-400"
                  placeholder={loginMode === 'EQUIPE' ? "Samar123" : "Sua senha de 8 dígitos"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors">
                  {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full btn-primary mt-4 py-5 shadow-xl shadow-orange-500/10 active:scale-95 transition-all flex items-center justify-center gap-2">
              {isLoading ? <CircleNotch size={24} className="animate-spin" /> : (loginMode === 'EQUIPE' ? "ACESSAR PAINEL" : "ENTRAR NO PORTAL")}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 animate-pulse">
                <Warning size={20} color="#ef4444" />
                <p className="text-[10px] font-black uppercase text-red-500">{error}</p>
              </div>
            )}
          </form>
        ) : (
          <div className="animate-fadeIn">
            {!recoverySent ? (
              <form onSubmit={handleRecovery} className="space-y-5">
                <p className="text-xs text-gray-500 text-center mb-6 leading-relaxed">Informe o e-mail ou WhatsApp da sua conta para restauração.</p>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Identificador</label>
                  <div className="relative">
                    <WhatsappLogo className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-orange-500 outline-none transition-all text-gray-900 placeholder-gray-400"
                      placeholder="E-mail ou WhatsApp"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className="w-full btn-primary py-5 shadow-xl shadow-orange-500/10 active:scale-95 transition-all flex items-center justify-center gap-2">
                  {isLoading ? <CircleNotch size={24} className="animate-spin" /> : "RESTAURAR AGORA"}
                </button>
                <button type="button" onClick={() => setIsForgotPassword(false)} className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 transition-colors pt-2">
                  <ArrowLeft size={16} /> Voltar ao Login
                </button>
              </form>
            ) : (
              <div className="text-center py-4 space-y-6">
                <div className="flex justify-center">
                  <CheckCircle size={64} color="#F97316" weight="fill" className="animate-bounce" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Instruções Enviadas</h3>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">Enviamos as instruções para <b>{recoveryEmail}</b>.</p>
                </div>
                <button onClick={() => { setIsForgotPassword(false); setRecoverySent(false); }} className="w-full py-4 bg-orange-50 border border-orange-100 rounded-2xl text-[10px] font-black uppercase text-orange-600">Voltar ao Início</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthView;
