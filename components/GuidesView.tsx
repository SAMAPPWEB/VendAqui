import React, { useState, useMemo, useRef, useEffect } from "react";
import { User, Booking, WhiteLabelConfig, Transaction, BookingMedia } from "../types";
import {
    Users, Calendar, List, X, CaretLeft, CaretRight, Printer,
    WhatsappLogo, MagnifyingGlass, Plus, Trash, PencilSimple,
    IdentificationCard, ListChecks, ChartLineUp, FilePlus,
    MapPin, ClockCounterClockwise, CheckCircle, Clock, Warning,
    Folder, DownloadSimple, UploadSimple, FilePdf
} from "phosphor-react";
import { userService, taskService } from "../services/databaseService";
import { mediaService } from "../services/mediaService";

interface GuidesViewProps {
    currentUser: User;
    users: User[];
    onUpdateUsers: (users: User[]) => void;
    bookings: Booking[];
    config: WhiteLabelConfig;
    tasks: any[];
    onUpdateTasks: (tasks: any[]) => void;
    transactions: Transaction[];
}

const GuidesView: React.FC<GuidesViewProps> = ({
    currentUser, users, onUpdateUsers, bookings, config, tasks, onUpdateTasks, transactions
}) => {
    const [activeTab, setActiveTab] = useState<'AGENDAMENTOS' | 'TAREFAS' | 'DASHBOARD' | 'CLIENTES'>('AGENDAMENTOS');
    const [selectedGuide, setSelectedGuide] = useState<User | null>(null);

    // Initial load: If current user is a guide, select them automatically
    useEffect(() => {
        if (currentUser.role === 'GUIA') {
            setSelectedGuide(currentUser);
        }
    }, [currentUser]);
    const [showRegModal, setShowRegModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadFolder, setUploadFolder] = useState("");
    const [selectedBookingForMedia, setSelectedBookingForMedia] = useState<Booking | null>(null);

    // Selection Dropdown State
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectionSearch, setSelectionSearch] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filters for Agendamentos
    const [locFilter, setLocFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [historySearch, setHistorySearch] = useState("");

    // Task Management State
    const [showAddTask, setShowAddTask] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);

    // Media Viewing State
    const [viewingMediaForClient, setViewingMediaForClient] = useState<{ name: string; id: string } | null>(null);
    const [clientMedia, setClientMedia] = useState<BookingMedia[]>([]);
    const [isLoadingMedia, setIsLoadingMedia] = useState(false);

    const guides = useMemo(() => {
        return users.filter(u =>
            u.role === 'GUIA' ||
            (u.role === 'ADMIN' && u.email === 'a_sergio@icloud.com')
        );
    }, [users]);

    const filteredSelection = useMemo(() => {
        if (!selectionSearch) return guides;
        return guides.filter(g => g.nome.toUpperCase().includes(selectionSearch.toUpperCase()));
    }, [guides, selectionSearch]);

    const guideBookings = useMemo(() => {
        if (!selectedGuide) return [];
        return bookings.filter(b => b.guideId === selectedGuide.id && b.status !== 'CANCELADO')
            .filter(b => !locFilter || b.location.toUpperCase().includes(locFilter.toUpperCase()))
            .filter(b => !dateFilter || b.date === dateFilter)
            .filter(b => !historySearch || b.client.toUpperCase().includes(historySearch.toUpperCase()))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [selectedGuide, bookings, locFilter, dateFilter, historySearch]);

    const guideTasks = useMemo(() => {
        if (!selectedGuide) return [];
        return tasks.filter(t => t.assignedTo === selectedGuide.id);
    }, [selectedGuide, tasks]);

    const guideStats = useMemo(() => {
        if (!selectedGuide) return { total: 0, received: 0, pending: 0, cancelled: 0 };
        const relevantBookings = bookings.filter(b => b.guideId === selectedGuide.id);

        let received = 0;
        let pending = 0;
        let cancelled = 0;

        relevantBookings.forEach(b => {
            // Use guideRevenue if available, fallback to 0 (since we don't want to show full price)
            const val = b.guideRevenue
                ? parseFloat(String(b.guideRevenue).replace(/[^\d,]/g, '').replace(',', '.'))
                : 0;

            if (b.status === 'CANCELADO') cancelled += val;
            else if (b.status === 'CONFIRMADO' || b.status === 'AGENDADO') received += val;
            else pending += val;
        });

        return { total: received + pending, received, pending, cancelled };
    }, [selectedGuide, bookings]);

    const uniqueClientsForGuide = useMemo(() => {
        if (!selectedGuide) return [];
        const guideBookings = bookings.filter(b => b.guideId === selectedGuide.id);
        const clientsMap = new Map();

        guideBookings.forEach(b => {
            if (!clientsMap.has(b.clientId || b.client)) {
                clientsMap.set(b.clientId || b.client, {
                    id: b.clientId,
                    name: b.client,
                    whatsapp: b.whatsapp,
                    location: b.location,
                    lastBooking: b
                });
            }
        });

        return Array.from(clientsMap.values());
    }, [selectedGuide, bookings]);

    // Handle outside click for dropdown
    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    const handleRegisterGuide = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const fd = new FormData(e.currentTarget);

        const newGuide: Omit<User, 'id'> = {
            nome: fd.get('nome')?.toString().toUpperCase() || "",
            email: fd.get('email')?.toString().toLowerCase() || "",
            whatsapp: fd.get('whatsapp')?.toString() || "",
            cnpj: fd.get('cnpj')?.toString() || "",
            endereco: fd.get('endereco')?.toString().toUpperCase() || "",
            dailyRate: fd.get('dailyRate')?.toString() || "0",
            role: 'GUIA',
            status: 'ATIVO',
            avatar: null
        };

        try {
            // Find if user already exists to preserve role if it's ADMIN
            const existingUser = users.find(u => u.email === newGuide.email);

            const payload = {
                ...newGuide,
                id: existingUser?.id,
                // If it's the master user, keep ADMIN role even if registered as GUIA
                role: (existingUser?.role === 'ADMIN' && existingUser?.email === 'a_sergio@icloud.com')
                    ? 'ADMIN'
                    : 'GUIA'
            };

            const created = await userService.upsert(payload as any);

            if (existingUser) {
                onUpdateUsers(users.map(u => u.id === created.id ? created : u));
                alert("Dados do guia atualizados com sucesso!");
            } else {
                onUpdateUsers([...users, created]);
                alert("Guia cadastrado com sucesso!");
            }
            setShowRegModal(false);
        } catch (err: any) {
            console.error(err);
            const msg = err.message || "";
            if (msg.includes("duplicate key") || msg.includes("23505")) {
                alert("Erro: Este e-mail já está cadastrado no sistema.");
            } else {
                alert(`Erro ao cadastrar guia: ${msg}`);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length || !selectedBookingForMedia || !uploadFolder) {
            alert("Selecione arquivos e defina uma pasta!");
            return;
        }

        setIsUploading(true);
        try {
            await mediaService.uploadFiles(String(selectedBookingForMedia.id), uploadFolder, files);
            alert("Arquivos enviados com sucesso!");
            setSelectedBookingForMedia(null);
            setUploadFolder("");

            // Refresh media view if currently viewing a client
            if (viewingMediaForClient) {
                // We need to re-fetch media for the current client
                setIsLoadingMedia(true);
                const clientBookings = bookings.filter(b =>
                    (b.clientId === viewingMediaForClient.id || b.client === viewingMediaForClient.name) &&
                    b.guideId === selectedGuide?.id
                );
                const bookingIds = clientBookings.map(b => String(b.id));
                const media = await mediaService.getMediaByBookings(bookingIds);
                setClientMedia(media);
                setIsLoadingMedia(false);
            }
        } catch (err) {
            console.error(err);
            alert("Erro ao enviar arquivos.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveTask = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedGuide) return;
        setIsSaving(true);
        const fd = new FormData(e.currentTarget);
        const title = fd.get('title')?.toString().toUpperCase() || "";
        const date = fd.get('date')?.toString() || "";
        const time = fd.get('time')?.toString() || "";

        try {
            if (editingTask) {
                await taskService.update(editingTask.id, {
                    title,
                    description: time,
                    dueDate: date,
                    assignedTo: selectedGuide.id
                });
                onUpdateTasks(tasks.map(t => t.id === editingTask.id ? { ...t, title, date, time, assignedTo: selectedGuide.id } : t));
            } else {
                const created = await taskService.create({
                    title,
                    description: time,
                    dueDate: date,
                    assignedTo: selectedGuide.id,
                    priority: 'NORMAL',
                    status: 'PENDENTE'
                });
                onUpdateTasks([...tasks, { id: created.id, title, date, time, assignedTo: selectedGuide.id, completed: false }]);
            }
            setShowAddTask(false);
            setEditingTask(null);
        } catch (err) {
            console.error(err);
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
        } catch (err) {
            console.error(err);
        }
    };

    const removeTask = async (taskId: string) => {
        if (!confirm("Excluir esta tarefa?")) return;
        try {
            await taskService.delete(taskId);
            onUpdateTasks(tasks.filter(t => t.id !== taskId));
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteMedia = async (media: BookingMedia) => {
        if (!confirm("Tem certeza que deseja excluir este arquivo?")) return;
        try {
            await mediaService.deleteMedia(media.id, `${media.bookingId}/${media.filename}`); // Assuming filename matches format or we use url
            // Actually filePath for delete is strictly bookingId/filename in our service
            // But we store 'filename' as original name.
            // The service uploads as `${bookingId}/${random}.${ext}`.
            // We need the ACTUAL path in storage.
            // In uploadFiles: `const filePath = \`\${bookingId}/\${fileName}\`;`
            // And `filename: file.name` (Original Name).
            // We are NOT storing the storage path in DB directly, only URL.
            // We need to extract storage path from URL or store it.
            // URL: .../public/photos/bookingId/random.ext
            // We can parse URL.
            const urlParts = media.url.split('/photos/');
            if (urlParts.length < 2) {
                alert("Erro ao identificar arquivo no storage.");
                return;
            }
            const storagePath = urlParts[1];

            await mediaService.deleteMedia(media.id, storagePath);

            // Refresh
            setClientMedia(prev => prev.filter(m => m.id !== media.id));
        } catch (err) {
            console.error(err);
            alert("Erro ao excluir mídia.");
        }
    };

    const handleRenameMedia = async (media: BookingMedia) => {
        const newName = prompt("Novo nome para o arquivo:", media.filename);
        if (!newName || newName === media.filename) return;

        try {
            await mediaService.updateMedia(media.id, { filename: newName });
            setClientMedia(prev => prev.map(m => m.id === media.id ? { ...m, filename: newName } : m));
        } catch (err) {
            console.error(err);
            alert("Erro ao renomear arquivo.");
        }
    };

    const handleRenameFolder = async (oldName: string) => {
        const newName = prompt("Novo nome para a pasta:", oldName);
        if (!newName || newName === oldName) return;

        // Find all media in this folder
        const mediaInFolder = clientMedia.filter(m => m.folderName === oldName);
        if (!mediaInFolder.length) return;

        if (!confirm(`Isso alterará a pasta de ${mediaInFolder.length} arquivos. Confirmar?`)) return;

        try {
            // Update all (Parallel)
            await Promise.all(mediaInFolder.map(m => mediaService.updateMedia(m.id, { folderName: newName })));

            setClientMedia(prev => prev.map(m => m.folderName === oldName ? { ...m, folderName: newName } : m));
        } catch (err) {
            console.error(err);
            alert("Erro ao renomear pasta.");
        }
    };

    const handleViewMedia = async (client: any) => {
        if (!selectedGuide) return;
        setViewingMediaForClient({ name: client.name, id: client.id });
        setIsLoadingMedia(true);
        setClientMedia([]);

        try {
            // Get all bookings for this client assigned to this guide
            const clientBookings = bookings.filter(b =>
                (b.clientId === client.id || b.client === client.name) &&
                b.guideId === selectedGuide.id
            );

            const bookingIds = clientBookings.map(b => String(b.id));
            const media = await mediaService.getMediaByBookings(bookingIds);
            setClientMedia(media);
        } catch (err) {
            console.error(err);
            alert("Erro ao carregar mídias.");
        } finally {
            setIsLoadingMedia(false);
        }
    };

    const formatDateLong = (dateStr: string) => {
        if (!dateStr) return "";
        const [y, m, d] = dateStr.split('-');
        return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    return (
        <div className="p-8 space-y-8 animate-fadeIn pb-32">
            {/* Header with Tabs */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-none border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-none flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                        <IdentificationCard size={28} weight="bold" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tighter uppercase leading-none">Painel Operacional</h2>
                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mt-1">Gestão de Guias e Atendimentos</p>
                    </div>
                </div>

                <div className="flex bg-gray-50 p-1 rounded-none border border-gray-100 shadow-inner">
                    <button
                        onClick={() => setActiveTab('AGENDAMENTOS')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-none text-[10px] font-black uppercase transition-all ${activeTab === 'AGENDAMENTOS' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Calendar size={18} weight="bold" /> Agendamentos
                    </button>
                    <button
                        onClick={() => setActiveTab('TAREFAS')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-none text-[10px] font-black uppercase transition-all ${activeTab === 'TAREFAS' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <ListChecks size={18} weight="bold" /> Tarefas
                    </button>
                    <button
                        onClick={() => setActiveTab('CLIENTES')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-none text-[10px] font-black uppercase transition-all ${activeTab === 'CLIENTES' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Users size={18} weight="bold" /> Clientes
                    </button>
                    <button
                        onClick={() => setActiveTab('DASHBOARD')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-none text-[10px] font-black uppercase transition-all ${activeTab === 'DASHBOARD' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <ChartLineUp size={18} weight="bold" /> Dashboard
                    </button>
                </div>

                <button
                    onClick={() => setShowRegModal(true)}
                    className="bg-gray-900 text-white px-6 py-3 rounded-none text-[10px] font-black uppercase flex items-center gap-2 hover:bg-black transition-all shadow-lg"
                >
                    <Plus size={18} weight="bold" /> Cadastrar Guia
                </button>
            </div>

            {/* Selection Box */}
            <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2" ref={dropdownRef}>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Selecionar Guia</label>
                    <div className="relative">
                        <div
                            onClick={() => {
                                // Only allow dropdown if user is ADMIN or MASTER (Antonio Sergio)
                                if (currentUser.role === 'ADMIN' || currentUser.role === 'DESENVOLVEDOR') {
                                    setIsDropdownOpen(!isDropdownOpen);
                                }
                            }}
                            className={`w-full bg-white border border-gray-100 rounded-none py-4 px-6 text-sm font-bold text-gray-900 uppercase flex justify-between items-center shadow-sm ${(currentUser.role !== 'ADMIN' && currentUser.role !== 'DESENVOLVEDOR') ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                                }`}
                        >
                            <span className={selectedGuide ? "text-gray-900" : "text-gray-300"}>
                                {selectedGuide ? selectedGuide.nome : "Escolha um guia responsável..."}
                            </span>
                            {(currentUser.role === 'ADMIN' || currentUser.role === 'DESENVOLVEDOR') && (
                                <CaretLeft size={16} weight="bold" className={`transition-transform ${isDropdownOpen ? 'rotate-90' : '-rotate-90'}`} />
                            )}
                        </div>

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-none shadow-2xl z-[100] overflow-hidden">
                                <div className="p-4 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
                                    <MagnifyingGlass size={18} className="text-gray-400" />
                                    <input
                                        autoFocus
                                        placeholder="BUSCAR GUIA..."
                                        value={selectionSearch}
                                        onChange={e => setSelectionSearch(e.target.value)}
                                        className="w-full bg-transparent border-none text-xs font-black uppercase outline-none text-gray-900"
                                    />
                                </div>
                                <div className="max-h-60 overflow-y-auto no-scrollbar">
                                    {filteredSelection.map(g => (
                                        <div
                                            key={g.id}
                                            onClick={() => {
                                                setSelectedGuide(g);
                                                setIsDropdownOpen(false);
                                                setSelectionSearch("");
                                            }}
                                            className="px-6 py-4 hover:bg-orange-500 hover:text-white cursor-pointer text-xs font-bold uppercase transition-colors flex items-center gap-3"
                                        >
                                            <div className="w-8 h-8 rounded-none bg-gray-100 flex items-center justify-center text-gray-400 text-[10px]">
                                                {g.avatar ? <img src={g.avatar} className="w-full h-full object-cover" /> : g.nome.charAt(0)}
                                            </div>
                                            {g.nome}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {activeTab === 'AGENDAMENTOS' && (
                    <div className="flex gap-2">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Localização</label>
                            <input value={locFilter} onChange={e => setLocFilter(e.target.value)} placeholder="LOCAL..." className="bg-white border border-gray-100 rounded-none py-4 px-5 text-xs font-bold uppercase shadow-sm outline-none focus:border-orange-500 w-32" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data</label>
                            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="bg-white border border-gray-100 rounded-none py-4 px-5 text-xs font-bold shadow-sm outline-none focus:border-orange-500" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Histórico</label>
                            <input value={historySearch} onChange={e => setHistorySearch(e.target.value)} placeholder="CLIENTE..." className="bg-white border border-gray-100 rounded-none py-4 px-5 text-xs font-bold uppercase shadow-sm outline-none focus:border-orange-500 w-32" />
                        </div>
                    </div>
                )}
            </div>

            {!selectedGuide ? (
                <div className="py-20 text-center opacity-30 flex flex-col items-center">
                    <IdentificationCard size={80} weight="light" className="mb-4 text-gray-400" />
                    <h3 className="text-xl font-black text-gray-900 uppercase">Selecione um guia</h3>
                </div>
            ) : (
                <div className="animate-slide">
                    {activeTab === 'AGENDAMENTOS' && (
                        <div className="bg-white rounded-none border border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-orange-500 text-white">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-orange-400">Data / Hora</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-orange-400">Passeio</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-orange-400">Cliente / WhatsApp</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-orange-400">Localização / Pickup</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-orange-400 text-center">Pax</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {guideBookings.map(b => (
                                        <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 border-r border-gray-50">
                                                <span className="text-[11px] font-black text-gray-900 uppercase block">{formatDateLong(b.date)}</span>
                                                <span className="text-[9px] text-orange-600 font-bold uppercase">{b.time || 'A DEFINIR'}</span>
                                            </td>
                                            <td className="px-6 py-4 border-r border-gray-50">
                                                <span className="text-[11px] font-black text-gray-900 uppercase">{b.tour}</span>
                                            </td>
                                            <td className="px-6 py-4 border-r border-gray-50">
                                                <span className="text-[11px] font-black text-gray-900 uppercase block">{b.client}</span>
                                                <span className="text-[9px] text-gray-400 font-bold uppercase">{b.whatsapp}</span>
                                            </td>
                                            <td className="px-6 py-4 border-r border-gray-50">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase">{b.location}</span>
                                            </td>
                                            <td className="px-6 py-4 border-r border-gray-50 text-center">
                                                <span className="text-[11px] font-black text-gray-900">{b.pax.adl + b.pax.chd}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`text-[8px] font-black px-2 py-1 rounded-none uppercase ${(b.status === 'CONFIRMADO' || b.status === 'AGENDADO') ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {b.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'TAREFAS' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1 bg-white rounded-none border border-gray-100 p-6 shadow-sm flex flex-col min-h-[450px]">
                                <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Checklist</h3>
                                    <button onClick={() => setShowAddTask(true)} className="bg-orange-500 text-white p-2 rounded-none hover:bg-orange-600 transition-colors">
                                        <Plus weight="bold" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                                    {guideTasks.map(t => (
                                        <div key={t.id} className="p-4 bg-gray-50 rounded-none border border-gray-100 flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => toggleTask(t)}
                                                    className={`w-5 h-5 rounded-none border flex items-center justify-center transition-all ${t.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 bg-white'}`}
                                                >
                                                    {t.completed && <CheckCircle size={12} weight="fill" />}
                                                </button>
                                                <div className={t.completed ? 'opacity-30 line-through' : ''}>
                                                    <p className="text-[11px] font-black text-gray-900 uppercase leading-none">{t.title}</p>
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase mt-1 block">{formatDateLong(t.date)} {t.time}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setEditingTask(t); setShowAddTask(true); }} className="text-gray-400 hover:text-orange-500"><PencilSimple size={14} /></button>
                                                <button onClick={() => removeTask(t.id)} className="text-red-300 hover:text-red-500"><Trash size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="lg:col-span-2 bg-gray-900 rounded-none p-12 text-center flex flex-col items-center justify-center text-white border border-white/5">
                                <ListChecks size={64} weight="thin" className="text-orange-500 mb-4" />
                                <h4 className="text-xl font-black uppercase tracking-tighter">Agenda Operacional</h4>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Clique no botão lateral para registrar checklists para este guia.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'DASHBOARD' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white p-6 rounded-none border border-gray-100 shadow-sm">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Média Mensal</p>
                                    <h4 className="text-2xl font-black text-gray-900 tracking-tighter">R$ {guideStats.total.toLocaleString()}</h4>
                                </div>
                                <div className="bg-emerald-500 p-6 rounded-none shadow-lg shadow-emerald-500/10">
                                    <p className="text-[9px] font-black text-white/70 uppercase tracking-widest mb-1">Comissões Pagas</p>
                                    <h4 className="text-2xl font-black text-white tracking-tighter">R$ {guideStats.received.toLocaleString()}</h4>
                                </div>
                                <div className="bg-white p-6 rounded-none border border-gray-100 shadow-sm">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">A Receber</p>
                                    <h4 className="text-2xl font-black text-gray-900 tracking-tighter">R$ {guideStats.pending.toLocaleString()}</h4>
                                </div>
                                <div className="bg-red-50 p-6 rounded-none border border-red-100 shadow-sm">
                                    <p className="text-[9px] font-black text-red-300 uppercase tracking-widest mb-1">Canceladas</p>
                                    <h4 className="text-2xl font-black text-red-500 tracking-tighter">R$ {guideStats.cancelled.toLocaleString()}</h4>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'CLIENTES' && (
                        <div className="grid grid-cols-1 gap-6 animate-fadeIn">
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Gestão de Mídias por Cliente</h3>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{uniqueClientsForGuide.length} Clientes Localizados</span>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {uniqueClientsForGuide.map(client => (
                                        <div key={client.id || client.name} className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-black text-xs uppercase">
                                                    {client.name.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{client.name}</h4>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{client.lastBooking?.tour} • {client.lastBooking?.date}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleViewMedia(client)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase hover:bg-black transition-all shadow-md"
                                                >
                                                    <Folder size={16} weight="bold" /> Ver Arquivos
                                                </button>
                                                <a
                                                    href={`https://wa.me/${client.whatsapp.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-100 transition-all border border-emerald-100"
                                                >
                                                    <WhatsappLogo size={16} weight="bold" /> WhatsApp
                                                </a>
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.location)}`}
                                                    target="_blank"
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase hover:bg-blue-100 transition-all border border-blue-100"
                                                >
                                                    <MapPin size={16} weight="bold" /> Ver Local
                                                </a>
                                                <button
                                                    onClick={() => setSelectedBookingForMedia(client.lastBooking)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-[9px] font-black uppercase hover:bg-orange-600 transition-all shadow-md shadow-orange-500/10"
                                                >
                                                    <UploadSimple size={16} weight="bold" /> Enviar Fotos
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {uniqueClientsForGuide.length === 0 && (
                                        <div className="p-12 text-center">
                                            <Users size={48} weight="thin" className="mx-auto text-gray-200 mb-4" />
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nenhum cliente vinculado a este guia</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Registration Modal */}
            {showRegModal && (
                <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-xl bg-white rounded-none border-t-8 border-orange-500 shadow-2xl animate-slide relative">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Novo Cadastro de Guia</h3>
                            <button onClick={() => setShowRegModal(false)} className="text-gray-400 hover:text-gray-900"><X size={24} weight="bold" /></button>
                        </div>
                        <form onSubmit={handleRegisterGuide} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome Completo</label>
                                    <input name="nome" required placeholder="NOME..." className="w-full bg-gray-50 border border-gray-200 rounded-none p-4 text-xs font-bold uppercase outline-none focus:border-orange-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">WhatsApp</label>
                                    <input name="whatsapp" required placeholder="CELULAR..." className="w-full bg-gray-50 border border-gray-200 rounded-none p-4 text-xs font-bold outline-none focus:border-orange-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CNPJ</label>
                                    <input name="cnpj" placeholder="DOCUMENTO..." className="w-full bg-gray-50 border border-gray-200 rounded-none p-4 text-xs font-bold outline-none focus:border-orange-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</label>
                                    <input name="email" type="email" required placeholder="EMAIL..." className="w-full bg-gray-50 border border-gray-200 rounded-none p-4 text-xs font-bold outline-none focus:border-orange-500" />
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Endereço</label>
                                    <input name="endereco" placeholder="ENDEREÇO COMPLETO..." className="w-full bg-gray-50 border border-gray-200 rounded-none p-4 text-xs font-bold uppercase outline-none focus:border-orange-500" />
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor Diária (R$)</label>
                                    <input name="dailyRate" placeholder="0,00" className="w-full bg-gray-50 border border-gray-200 rounded-none p-4 text-xs font-bold uppercase outline-none focus:border-orange-500" />
                                </div>
                            </div>
                            <button disabled={isSaving} type="submit" className="w-full py-5 bg-orange-500 text-white rounded-none text-[11px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all">
                                {isSaving ? "CADASTRANDO..." : "FINALIZAR CADASTRO"}
                            </button>
                        </form>
                    </div>
                </div >
            )}

            {/* Media Upload Modal */}
            {
                selectedBookingForMedia && (
                    <div className="fixed inset-0 z-[1200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl animate-slide overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Portal de Mídia</h3>
                                    <p className="text-[9px] text-orange-600 font-bold uppercase tracking-widest">{selectedBookingForMedia.client}</p>
                                </div>
                                <button onClick={() => setSelectedBookingForMedia(null)} className="text-gray-400 hover:text-gray-900 transition-colors">
                                    <X size={20} weight="bold" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome da Pasta / Álbum</label>
                                    <div className="relative">
                                        <Folder className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            value={uploadFolder}
                                            onChange={(e) => setUploadFolder(e.target.value)}
                                            placeholder="EX: FOTOS DO PASSEIO, TRILHA..."
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 pl-12 text-[10px] font-bold uppercase outline-none focus:border-orange-500 focus:bg-white transition-all shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="border-2 border-dashed border-gray-100 bg-gray-50/50 rounded-2xl p-8 text-center space-y-4">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-orange-500 mx-auto shadow-sm">
                                        <UploadSimple size={24} weight="bold" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-900 uppercase">Selecione Múltiplas Fotos</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Upload direto para o portal do cliente</p>
                                    </div>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        disabled={isUploading || !uploadFolder}
                                        className="hidden"
                                        id="media-upload"
                                    />
                                    <label
                                        htmlFor="media-upload"
                                        className={`inline-block px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${isUploading || !uploadFolder ? 'bg-gray-200 text-gray-400' : 'bg-gray-900 text-white hover:bg-black shadow-lg shadow-black/10'}`}
                                    >
                                        {isUploading ? "ENVIANDO..." : "ESCOLHER ARQUIVOS"}
                                    </label>
                                </div>

                                {isUploading && (
                                    <div className="space-y-2">
                                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-500 animate-[loading_2s_infinite]" style={{ width: '40%' }}></div>
                                        </div>
                                        <p className="text-[8px] text-gray-400 font-black text-center uppercase tracking-widest">Processando mídias de alta resolução...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* View Media Modal */}
            {
                viewingMediaForClient && (
                    <div className="fixed inset-0 z-[1100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl animate-slide overflow-hidden max-h-[90vh] flex flex-col">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Arquivos do Cliente</h3>
                                    <p className="text-[9px] text-orange-600 font-bold uppercase tracking-widest">{viewingMediaForClient.name}</p>
                                </div>
                                <button onClick={() => setViewingMediaForClient(null)} className="text-gray-400 hover:text-gray-900 transition-colors">
                                    <X size={20} weight="bold" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 bg-white">
                                {isLoadingMedia ? (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Carregando arquivos...</p>
                                    </div>
                                ) : clientMedia.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                        <Folder size={48} weight="thin" className="text-gray-400 mb-4" />
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nenhum arquivo encontrado para este cliente com este guia.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {Object.entries(clientMedia.reduce((acc, curr) => {
                                            if (!acc[curr.folderName]) acc[curr.folderName] = [];
                                            acc[curr.folderName].push(curr);
                                            return acc;
                                        }, {} as Record<string, BookingMedia[]>)).map(([folder, items]) => (
                                            <div key={folder} className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Folder size={18} weight="duotone" className="text-orange-500" />
                                                        <h4 className="text-xs font-black text-gray-900 uppercase">{folder}</h4>
                                                        <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[9px] font-bold">{items.length}</span>
                                                        {['ADMIN', 'DESENVOLVEDOR'].includes(currentUser.role) && (
                                                            <button
                                                                onClick={() => handleRenameFolder(folder)}
                                                                className="text-gray-400 hover:text-blue-500 transition-colors ml-2"
                                                                title="Renomear pasta"
                                                            >
                                                                <PencilSimple size={14} weight="bold" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            // Find the booking associated with this folder's first item to define context
                                                            const contextBooking = bookings.find(b => String(b.id) === items[0].bookingId);
                                                            if (contextBooking) {
                                                                setSelectedBookingForMedia(contextBooking);
                                                                setUploadFolder(folder);
                                                                // Close view modal temporarily or keep it open? 
                                                                // Better: Keep view modal open, open upload modal on top (Z-index handled)
                                                                // But we need to ensure refresh happens. 
                                                                // Let's close view modal to avoid z-index hell for now, or ensure upload modal is higher.
                                                                // The upload modal has z-[1100], view modal z-[1100]. Let's bump upload to z-[1200] in next step.
                                                            }
                                                        }}
                                                        className="text-[9px] font-bold text-orange-600 uppercase hover:text-orange-800 flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-lg"
                                                    >
                                                        <Plus size={12} weight="bold" /> Adicionar
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                                    {items.map(media => {
                                                        const filename = media.filename || media.url.split('/').pop()?.split('?')[0] || 'file';
                                                        const ext = filename.split('.').pop()?.toLowerCase() || '';
                                                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
                                                        const isPdf = ext === 'pdf';
                                                        const isMaster = ['ADMIN', 'DESENVOLVEDOR'].includes(currentUser.role);

                                                        return (
                                                            <div key={media.id} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                                                <a
                                                                    href={media.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="absolute inset-0 z-0 cursor-pointer"
                                                                    title={`Abrir ${filename}`}
                                                                >
                                                                    {isImage ? (
                                                                        <img
                                                                            src={media.url}
                                                                            alt="Media"
                                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                                            onError={(e) => {
                                                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Erro';
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <div className="flex flex-col items-center justify-center w-full h-full bg-gray-50 text-gray-400 group-hover:text-orange-500 transition-colors">
                                                                            {isPdf ? (
                                                                                <FilePdf size={32} weight="duotone" />
                                                                            ) : (
                                                                                <FilePlus size={32} weight="duotone" />
                                                                            )}
                                                                            <span className="text-[8px] font-bold mt-2 uppercase tracking-widest">{ext}</span>
                                                                        </div>
                                                                    )}

                                                                    {/* Overlay Gradient */}
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                                </a>

                                                                {/* Admin Controls */}
                                                                {isMaster && (
                                                                    <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleRenameMedia(media); }}
                                                                            className="bg-white/90 p-1.5 rounded-full text-blue-600 hover:bg-blue-50 shadow-sm backdrop-blur-sm transition-transform hover:scale-110"
                                                                            title="Renomear arquivo"
                                                                        >
                                                                            <PencilSimple size={14} weight="bold" />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleDeleteMedia(media); }}
                                                                            className="bg-white/90 p-1.5 rounded-full text-red-600 hover:bg-red-50 shadow-sm backdrop-blur-sm transition-transform hover:scale-110"
                                                                            title="Excluir arquivo"
                                                                        >
                                                                            <Trash size={14} weight="bold" />
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                <div className="absolute inset-x-0 bottom-0 p-2 pointer-events-none">
                                                                    <p className="text-[9px] font-bold text-white truncate drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                                                                        {filename}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Task Modal */}
            {
                showAddTask && (
                    <div className="fixed inset-0 z-[1000] bg-black/80 flex items-center justify-center p-4">
                        <div className="w-full max-w-md bg-white rounded-none border-t-8 border-orange-500 shadow-2xl p-8 space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-black text-gray-900 uppercase">Tarefa Operacional</h3>
                                <button onClick={() => { setShowAddTask(false); setEditingTask(null); }}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSaveTask} className="space-y-4">
                                <input name="title" defaultValue={editingTask?.title} required placeholder="DESCRIÇÃO..." className="w-full bg-gray-50 border rounded-none p-4 text-xs font-bold" />
                                <div className="grid grid-cols-2 gap-4">
                                    <input name="date" type="date" defaultValue={editingTask?.date || new Date().toISOString().split('T')[0]} className="w-full bg-gray-50 border rounded-none p-3 text-[10px] font-bold" />
                                    <input name="time" type="time" defaultValue={editingTask?.time} className="w-full bg-gray-50 border rounded-none p-3 text-[10px] font-bold" />
                                </div>
                                <button type="submit" className="w-full bg-orange-500 text-white py-4 text-[10px] font-black uppercase hover:bg-orange-600">GRAVAR</button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default GuidesView;
