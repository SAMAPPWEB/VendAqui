
import React, { useState, useRef } from "react";
import { User, UserRole } from "../types";
import { UserPlus, PencilSimple, Trash, ToggleLeft, ToggleRight, X, IdentificationBadge, ShieldCheck, Camera, Key } from "phosphor-react";
import { userService } from "../services/databaseService";
import bcrypt from 'bcryptjs';

interface UsersViewProps {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
}

const UsersView: React.FC<UsersViewProps> = ({ users, onUpdateUsers }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const toggleStatus = async (id: string) => {
    const userToUpdate = users.find(u => u.id === id);
    if (!userToUpdate) return;

    const newStatus = userToUpdate.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    try {
      await userService.update(id, { status: newStatus });
      onUpdateUsers(users.map(u => u.id === id ? { ...u, status: newStatus } : u));
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status do usuário.");
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setTempAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const nome = fd.get('nome')?.toString().toUpperCase() || "";
    const email = fd.get('email')?.toString().toLowerCase() || "";
    const role = fd.get('role') as UserRole;
    const senha = fd.get('senha') as string;
    const dailyRate = fd.get('dailyRate')?.toString();

    const userPayload = {
      nome,
      email,
      role,
      senha: senha ? await bcrypt.hash(senha, 10) : (editingUser?.senha || ""),
      avatar: tempAvatar || editingUser?.avatar,
      status: editingUser?.status || 'ATIVO',
      dailyRate: (role === 'GUIA' && dailyRate) ? dailyRate : (editingUser?.dailyRate || "0")
    };

    try {
      if (editingUser) {
        const updated = await userService.update(editingUser.id, userPayload);
        onUpdateUsers(users.map(u => u.id === editingUser.id ? updated : u));
      } else {
        const created = await userService.create(userPayload);
        onUpdateUsers([...users, created]);
      }

      setShowModal(false);
      setEditingUser(null);
      setTempAvatar(null);
    } catch (error: any) {
      console.error("Erro ao salvar usuário:", error);
      alert(`Erro ao salvar usuário: ${error.message}`);
    }
  };

  const removeUser = async (id: string) => {
    if (!confirm("Excluir usuário permanentemente?")) return;
    try {
      await userService.delete(id);
      onUpdateUsers(users.filter(x => x.id !== id));
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      alert("Erro ao excluir usuário.");
    }
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setTempAvatar(u.avatar || null);
    setShowModal(true);
  };

  return (
    <div className="px-6 pb-20">
      <div className="space-y-6 animate-slide">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 uppercase leading-none">Equipe</h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Colaboradores & Acessos</p>
          </div>
          <button
            onClick={() => { setEditingUser(null); setTempAvatar(null); setShowModal(true); }}
            className="w-14 h-14 bg-orange-500 rounded-3xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform cursor-pointer"
          >
            <UserPlus size={28} weight="bold" />
          </button>
        </div>

        <div className="space-y-4">
          {users.filter(u => u.role !== 'DESENVOLVEDOR').map(u => (
            <div key={u.id} className="agenda-card bg-white border-gray-100 flex flex-col gap-4 shadow-sm group">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 bg-gray-50 shadow-inner">
                    {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <IdentificationBadge size={28} className="text-gray-300" />}
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-gray-900 uppercase leading-tight">{u.nome}</h4>
                    <span className="text-[9px] bg-gray-100 px-2 py-0.5 rounded-lg font-black text-gray-500 uppercase mt-1 inline-block">{u.role}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(u)} className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:text-orange-500 transition-colors">
                    <PencilSimple size={20} weight="bold" />
                  </button>
                  {u.id !== '1' && (
                    <button onClick={() => removeUser(u.id)} className="p-2.5 bg-red-50 text-red-400 rounded-xl">
                      <Trash size={20} weight="bold" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <span className="text-[10px] font-bold text-gray-400 truncate max-w-[150px]">{u.email}</span>
                {u.id !== '1' ? (
                  <button onClick={() => toggleStatus(u.id)} className={`flex items-center gap-1.5 text-[9px] font-black uppercase ${u.status === 'ATIVO' ? 'text-orange-600' : 'text-red-400'}`}>
                    {u.status === 'ATIVO' ? <ToggleRight size={24} weight="fill" /> : <ToggleLeft size={24} weight="fill" />} {u.status}
                  </button>
                ) : (
                  <span className="text-[9px] font-black uppercase text-emerald-600 flex items-center gap-1"><ShieldCheck size={18} weight="fill" /> Master</span>
                )}
              </div>
              {u.role === 'GUIA' && (
                <div className="pt-2 border-t border-gray-50 mt-2">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Diária: <span className="text-gray-900">R$ {u.dailyRate || "0,00"}</span></p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-end sm:items-center justify-center">
          <div className="w-full max-w-lg bg-white rounded-t-[40px] sm:rounded-[40px] flex flex-col max-h-[92vh] animate-slide shadow-2xl overflow-hidden relative border-t-8 border-orange-500">
            <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-gray-100 flex-shrink-0">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">
                {editingUser ? "Editar Membro" : "Novo Colaborador"}
              </h3>
              <div className="flex gap-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 rounded-full text-[9px] font-black text-gray-500 uppercase tracking-widest hover:bg-gray-200 transition-colors cursor-pointer">
                  Retornar
                </button>
                <button onClick={() => setShowModal(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors cursor-pointer">
                  <X size={24} weight="bold" />
                </button>
              </div>
            </div>

            <form id="userForm" onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
              <div className="flex justify-center py-4">
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  className="w-28 h-28 rounded-[40px] bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 cursor-pointer overflow-hidden relative shadow-inner"
                >
                  {tempAvatar ? (
                    <img src={tempAvatar} className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={32} />
                  )}
                </div>
                <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={handleAvatarUpload} />
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input name="nome" defaultValue={editingUser?.nome} required className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-orange-500 transition-all uppercase" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
                  <input name="email" type="email" defaultValue={editingUser?.email} required className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-orange-500 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cargo / Permissão</label>
                  <select name="role" defaultValue={editingUser?.role || "OPERADOR"} className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-orange-500 transition-all">
                    <option value="ADMIN">Administrador</option>
                    <option value="OPERADOR">Operação</option>
                    <option value="GUIA">Guia de Turismo</option>
                  </select>
                </div>

                {/* Daily Rate Input - Only for Guides */}
                <div className="space-y-1.5" id="dailyRateField">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Valor Diária (R$)</label>
                  <input
                    name="dailyRate"
                    defaultValue={editingUser?.dailyRate || "0"}
                    placeholder="0,00"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-orange-500 transition-all"
                  />
                  <p className="text-[9px] text-gray-400 font-bold uppercase ml-1">*Preencha apenas se for Guia</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha de acesso ao app</label>
                  <div className="relative">
                    <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" />
                    <input
                      name="senha"
                      type="password"
                      defaultValue={editingUser?.senha}
                      placeholder="Crie uma senha de acesso"
                      required
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="h-10"></div>
            </form>

            <div className="px-8 py-6 bg-white border-t border-gray-100 flex-shrink-0">
              <button type="submit" form="userForm" className="w-full bg-orange-500 text-white rounded-3xl py-6 text-[11px] font-black uppercase shadow-xl active:scale-95 transition-all">
                {editingUser ? "Salvar Alterações" : "Cadastrar na Unidade"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersView;
