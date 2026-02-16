
import React, { useState, useMemo } from "react";
import { Plus, CurrencyDollar, TrendUp, TrendDown, Wallet, X, Trash, CheckCircle, Clock, User as UserIcon, MagnifyingGlass, Receipt, Tag } from "phosphor-react";
import { Transaction, User } from "../types";
import { transactionService } from "../services/databaseService";

interface FinancialViewProps {
   transactions: Transaction[];
   onUpdateTransactions: (txs: Transaction[]) => void;
   currentUser: User;
}

const FinancialView: React.FC<FinancialViewProps> = ({ transactions, onUpdateTransactions, currentUser }) => {
   const [showModal, setShowModal] = useState(false);
   const [editingTx, setEditingTx] = useState<Transaction | null>(null);
   const [search, setSearch] = useState("");

   const formatCurrency = (value: string | number) => {
      if (typeof value === 'number') {
         return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      }
      const clean = value.replace(/\D/g, "");
      if (!clean) return "";
      const amount = (parseInt(clean) / 100).toFixed(2);
      return amount.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
   };

   const parseCurrency = (value: string) => {
      return parseFloat(value.replace(/\D/g, "")) / 100 || 0;
   };

   const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const clean = e.target.value.replace(/\D/g, "");
      if (!clean) {
         e.target.value = "";
         return;
      }
      e.target.value = formatCurrency(clean) as string;
   };

   const stats = useMemo(() => {
      const income = transactions.filter(t => t.type === 'ENTRADA' && t.status === 'PAGO').reduce((acc, curr) => acc + curr.amount, 0);
      const expenses = transactions.filter(t => t.type === 'SAIDA' && t.status === 'PAGO').reduce((acc, curr) => acc + curr.amount, 0);
      const pendingIncome = transactions.filter(t => t.type === 'ENTRADA' && t.status === 'PENDENTE').reduce((acc, curr) => acc + curr.amount, 0);
      const pendingExpenses = transactions.filter(t => t.type === 'SAIDA' && t.status === 'PENDENTE').reduce((acc, curr) => acc + curr.amount, 0);
      return {
         total: income - expenses,
         income,
         expenses,
         pendingIncome,
         pendingExpenses
      };
   }, [transactions]);

   const filteredTransactions = useMemo(() => {
      return transactions.filter(t =>
         t.description.toLowerCase().includes(search.toLowerCase()) ||
         t.category.toLowerCase().includes(search.toLowerCase())
      );
   }, [transactions, search]);

   const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget as HTMLFormElement);
      const amountStr = fd.get('amount')?.toString() || '0';

      const txPayload = {
         description: fd.get('description')?.toString().toUpperCase() || "",
         category: fd.get('category')?.toString().toUpperCase() || "OUTROS",
         amount: parseCurrency(amountStr),
         type: fd.get('type') as 'ENTRADA' | 'SAIDA',
         status: fd.get('status') as 'PAGO' | 'PENDENTE',
         date: fd.get('date')?.toString() || new Date().toISOString().split('T')[0],
         userName: currentUser.nome
      };

      try {
         if (editingTx) {
            const updated = await transactionService.update(editingTx.id, txPayload);
            onUpdateTransactions(transactions.map(t => t.id === editingTx.id ? updated : t));
         } else {
            const created = await transactionService.create(txPayload);
            onUpdateTransactions([created, ...transactions]);
         }
         setShowModal(false);
         setEditingTx(null);
      } catch (error) {
         console.error("Erro ao salvar transação:", error);
         alert("Erro ao salvar lançamento.");
      }
   };

   const removeTransaction = async (id: string) => {
      if (confirm("Deseja excluir permanentemente este lançamento?")) {
         try {
            await transactionService.delete(id);
            onUpdateTransactions(transactions.filter(t => t.id !== id));
         } catch (error) {
            console.error("Erro ao excluir:", error);
         }
      }
   };

   return (
      <div className="px-6 pb-24">
         <div className="space-y-6 animate-slide">
            <div className="flex justify-between items-center text-left">
               <div>
                  <h2 className="text-2xl font-black tracking-tight text-gray-900 uppercase leading-none">Gestão Financeira</h2>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Fluxo de Caixa Operacional</p>
               </div>
               <button onClick={() => { setEditingTx(null); setShowModal(true); }} className="w-14 h-14 bg-orange-500 rounded-3xl flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer text-white">
                  <Plus size={28} weight="bold" />
               </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
               <div className="agenda-card bg-gray-900 p-4 flex flex-col justify-between h-28 border-none shadow-xl text-left">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white"><Wallet size={18} weight="fill" /></div>
                  <div>
                     <p className="text-lg font-black text-white leading-none">{formatCurrency(stats.total)}</p>
                     <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mt-2">Saldo em Caixa</p>
                  </div>
               </div>
               <div className="agenda-card bg-white p-4 flex flex-col justify-between h-28 shadow-sm text-left">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><TrendUp size={18} weight="bold" /></div>
                  <div>
                     <p className="text-lg font-black text-emerald-600 leading-none">{formatCurrency(stats.income)}</p>
                     <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mt-2">Entradas Pagas</p>
                  </div>
               </div>
               <div className="agenda-card bg-white p-4 flex flex-col justify-between h-28 shadow-sm text-left">
                  <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-600"><TrendDown size={18} weight="bold" /></div>
                  <div>
                     <p className="text-lg font-black text-red-600 leading-none">{formatCurrency(stats.expenses)}</p>
                     <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mt-2">Saídas Pagas</p>
                  </div>
               </div>
               <div className="agenda-card bg-white p-4 flex flex-col justify-between h-28 shadow-sm text-left">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500"><Clock size={18} weight="bold" /></div>
                  <div>
                     <p className="text-lg font-black text-amber-600 leading-none">{formatCurrency(stats.pendingIncome)}</p>
                     <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mt-2">A Receber</p>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <div className="relative text-left">
                  <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                     type="text"
                     value={search}
                     onChange={(e) => setSearch(e.target.value.toUpperCase())}
                     placeholder="BUSCAR LANÇAMENTO..."
                     className="w-full bg-white border border-gray-200 rounded-[20px] py-4 pl-12 pr-4 text-sm font-bold focus:border-orange-500 outline-none shadow-sm uppercase"
                  />
               </div>

               <div className="space-y-3">
                  {filteredTransactions.map(tx => (
                     <div key={tx.id} className="agenda-card bg-white p-4 flex flex-col gap-3 shadow-sm border-l-8 text-left" style={{ borderLeftColor: tx.type === 'ENTRADA' ? '#10B981' : '#EF4444' }}>
                        <div className="flex justify-between items-start">
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                 <Tag size={12} className="text-gray-400" />
                                 <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{tx.category}</span>
                              </div>
                              <h4 className="font-black text-sm text-gray-900 uppercase leading-tight mt-1 truncate">{tx.description}</h4>
                              <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">{tx.date} • {tx.userName}</p>
                           </div>
                           <div className="text-right flex flex-col items-end gap-1.5 ml-4">
                              <p className={`text-sm font-black ${tx.type === 'ENTRADA' ? 'text-emerald-600' : 'text-red-600'}`}>
                                 {tx.type === 'ENTRADA' ? '+' : '-'} {formatCurrency(tx.amount)}
                              </p>
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase border ${tx.status === 'PAGO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{tx.status}</span>
                           </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
                           <button onClick={() => { setEditingTx(tx); setShowModal(true); }} className="p-2 text-gray-400 hover:text-orange-500">
                              <Receipt size={18} />
                           </button>
                           <button onClick={() => removeTransaction(tx.id)} className="p-2 text-gray-300 hover:text-red-500">
                              <Trash size={18} />
                           </button>
                        </div>
                     </div>
                  ))}

                  {filteredTransactions.length === 0 && (
                     <div className="py-20 text-center opacity-30 flex flex-col items-center">
                        <CurrencyDollar size={48} className="mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Nenhum lançamento localizado</p>
                     </div>
                  )}
               </div>
            </div>
         </div>

         {showModal && (
            <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-end sm:items-center justify-center">
               <div className="w-full max-w-md bg-white rounded-t-[40px] sm:rounded-[40px] flex flex-col max-h-[92vh] animate-slide shadow-2xl overflow-hidden relative border-t-8 border-orange-500">
                  <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-gray-100 flex-shrink-0">
                     <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Lançamento Financeiro</h3>
                     <div className="flex gap-2">
                        <button onClick={() => setShowModal(false)} className="p-2 bg-gray-50 rounded-full text-gray-400">
                           <X size={24} weight="bold" />
                        </button>
                     </div>
                  </div>

                  <form id="txForm" onSubmit={handleSave} className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-6 text-left">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Fluxo</label>
                           <select name="type" defaultValue={editingTx?.type || "ENTRADA"} className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-4 text-sm font-bold uppercase outline-none focus:border-orange-500">
                              <option value="ENTRADA">Entrada (+)</option>
                              <option value="SAIDA">Saída (-)</option>
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado</label>
                           <select name="status" defaultValue={editingTx?.status || "PAGO"} className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-4 text-sm font-bold uppercase outline-none focus:border-orange-500">
                              <option value="PAGO">Pago / Recebido</option>
                              <option value="PENDENTE">Pendente</option>
                           </select>
                        </div>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição do Lançamento</label>
                        <input name="description" defaultValue={editingTx?.description} placeholder="EX: RECEBIMENTO TOUR TRANCOSO" required className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-orange-500 uppercase" />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoria</label>
                           <input name="category" defaultValue={editingTx?.category} placeholder="VENDAS, MARKETING..." required className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-4 text-sm font-bold outline-none focus:border-orange-500 uppercase" />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Valor Total R$</label>
                           <input
                              name="amount"
                              type="text"
                              defaultValue={editingTx?.amount ? (editingTx.amount * 100).toString() : ""}
                              onChange={handlePriceChange}
                              placeholder="R$ 0,00"
                              required
                              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-4 text-sm font-black text-orange-600 outline-none focus:border-orange-500"
                           />
                        </div>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data Competência</label>
                        <input name="date" type="date" defaultValue={editingTx?.date || new Date().toISOString().split('T')[0]} className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-orange-500" />
                     </div>
                     <div className="h-10"></div>
                  </form>

                  <div className="px-8 py-6 bg-white border-t border-gray-100 flex-shrink-0">
                     <button type="submit" form="txForm" className="w-full bg-orange-500 text-white rounded-3xl py-6 text-[11px] font-black uppercase shadow-xl active:scale-95 transition-all">
                        Efetivar Lançamento
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default FinancialView;
