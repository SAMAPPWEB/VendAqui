
import React, { useState, useMemo } from "react";
import { Calendar as CalendarIcon, Clock, Plus, X, CheckCircle, Trash, CaretLeft, CaretRight, ListChecks } from "phosphor-react";
import { taskService } from "../services/databaseService";

interface TasksViewProps {
  tasks: any[];
  onUpdateTasks: (tasks: any[]) => void;
}

const TasksView: React.FC<TasksViewProps> = ({ tasks, onUpdateTasks }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const formatDateLong = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const [year, month, day] = dateStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch (e) { return dateStr; }
  };

  const formatToYMD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const selectedDateStr = formatToYMD(selectedDate);
  const currentTasks = useMemo(() => tasks.filter(t => t.date === selectedDateStr), [tasks, selectedDateStr]);

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const title = fd.get('title')?.toString().toUpperCase() || "";
    const time = fd.get('time')?.toString().toUpperCase() || "";
    const date = fd.get('date') as string;

    try {
      if (editingTask) {
        const updated = await taskService.update(editingTask.id, {
          title,
          description: time,
          dueDate: date || selectedDateStr,
        });
        const mapped = {
          id: updated.id,
          title: updated.title,
          time: updated.description,
          date: updated.dueDate,
          completed: updated.status === 'CONCLUIDO'
        };
        onUpdateTasks(tasks.map(t => t.id === editingTask.id ? mapped : t));
      } else {
        const newTask = await taskService.create({
          title,
          description: time,
          assignedTo: null,
          dueDate: date || selectedDateStr,
          priority: 'NORMAL',
          status: 'PENDENTE'
        });
        const mappedTask = {
          id: newTask.id,
          title: newTask.title,
          time: newTask.description,
          date: newTask.dueDate,
          completed: newTask.status === 'CONCLUIDO'
        };
        onUpdateTasks([...tasks, mappedTask]);
      }
      setShowAdd(false);
      setEditingTask(null);
    } catch (error) {
      console.error("Erro ao salvar tarefa:", error);
      alert("Erro ao salvar tarefa.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTask = async (task: any) => {
    const newStatus = !task.completed ? 'CONCLUIDO' : 'PENDENTE';
    try {
      await taskService.update(task.id, { status: newStatus });
      onUpdateTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !task.completed } : t));
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
    }
  };

  const removeTask = async (id: string) => {
    if (!confirm("Excluir tarefa?")) return;
    try {
      await taskService.delete(id);
      onUpdateTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
    }
  };

  return (
    <div className="px-6 pb-24">
      <div className="space-y-6 animate-slide">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 uppercase leading-none">Tarefas</h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Checklist Diário</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="w-14 h-14 bg-orange-500 rounded-3xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform cursor-pointer">
            <Plus size={28} weight="bold" />
          </button>
        </div>

        <div className="agenda-card bg-white border-gray-100 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">
              {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(viewDate)}
            </h3>
            <div className="flex gap-2">
              <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-2 bg-gray-50 border border-gray-100 rounded-none">
                <CaretLeft size={20} weight="bold" />
              </button>
              <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-2 bg-gray-50 border border-gray-100 rounded-none">
                <CaretRight size={20} weight="bold" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
              <button key={day} onClick={() => setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day))} className={`h-10 w-full rounded-none text-[11px] font-black transition-all ${selectedDate.getDate() === day ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {currentTasks.length > 0 ? currentTasks.map(task => (
            <div key={task.id} className="agenda-card bg-white border-gray-100 p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleTask(task)}
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-orange-500 border-orange-500 text-white shadow-inner' : 'border-gray-200 bg-gray-50'}`}
                >
                  <CheckCircle size={16} weight="fill" />
                </button>
                <div className={task.completed ? 'opacity-30 line-through' : ''}>
                  <p className="text-[12px] font-black text-gray-900 uppercase tracking-tight leading-none">{task.title}</p>
                  <span className="text-[9px] font-bold text-gray-400 mt-1 flex items-center gap-1 uppercase">
                    <Clock size={12} /> {task.time || "GERAL"} • {formatDateLong(task.date)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingTask(task); setShowAdd(true); }} className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:text-orange-500 transition-colors">
                  <Plus size={18} weight="bold" className="rotate-45" />
                  <span className="text-[8px] font-black ml-1">EDITAR</span>
                </button>
                <button onClick={() => removeTask(task.id)} className="p-2.5 bg-red-50 text-red-400 rounded-xl active:scale-95">
                  <Trash size={18} />
                </button>
              </div>
            </div>
          )) : (
            <div className="py-12 text-center opacity-30 flex flex-col items-center">
              <ListChecks size={40} className="mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest">Tudo em dia por aqui!</p>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-end sm:items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-t-[40px] sm:rounded-[40px] flex flex-col max-h-[92vh] animate-slide shadow-2xl overflow-hidden relative border-t-8 border-orange-500">
            <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-gray-100 flex-shrink-0">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">
                {editingTask ? "Editar Tarefa" : "Nova Tarefa"}
              </h3>
              <div className="flex gap-2">
                <button onClick={() => { setShowAdd(false); setEditingTask(null); }} className="px-4 py-2 bg-gray-100 rounded-full text-[9px] font-black text-gray-500 uppercase tracking-widest hover:bg-gray-200 transition-colors cursor-pointer">
                  Retornar
                </button>
                <button onClick={() => { setShowAdd(false); setEditingTask(null); }} className="p-3 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors cursor-pointer">
                  <X size={24} weight="bold" />
                </button>
              </div>
            </div>

            <form id="taskForm" onSubmit={handleSaveTask} className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">O que fazer?</label>
                <input name="title" defaultValue={editingTask?.title} required placeholder="TÍTULO DA ATIVIDADE" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-orange-500 uppercase" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data</label>
                  <input name="date" type="date" defaultValue={editingTask?.date || selectedDateStr} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs font-bold text-gray-900" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Horário</label>
                  <input name="time" type="time" defaultValue={editingTask?.time} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs font-bold text-gray-900" />
                </div>
              </div>
              <div className="h-10"></div>
            </form>

            <div className="px-8 py-6 bg-white border-t border-gray-100 flex-shrink-0">
              <button
                type="submit"
                form="taskForm"
                className="w-full bg-orange-500 text-white rounded-3xl py-6 text-[11px] font-black uppercase shadow-xl active:scale-95 transition-all disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? 'SALVANDO...' : (editingTask ? 'SALVAR ALTERAÇÕES' : 'SALVAR TAREFA')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksView;
