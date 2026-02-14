
import React, { useState, useRef } from "react";
import { User } from "../types";
import { CloudArrowUp, Image, FilePdf, DownloadSimple, Trash, CheckCircle, File as FileIcon, XCircle } from "phosphor-react";

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: string;
}

interface ClientAreaViewProps {
  user: User;
}

const ClientAreaView: React.FC<ClientAreaViewProps> = ({ user }) => {
  const [files, setFiles] = useState<FileItem[]>([
    { id: '1', name: 'Exame_Laboratorio.pdf', type: 'PDF', size: '1.2 MB' },
    { id: '2', name: 'Foto_Agendamento.jpg', type: 'IMG', size: '2.5 MB' },
    { id: '3', name: 'Contrato_SaaS.pdf', type: 'PDF', size: '0.8 MB' },
  ]);
  
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);

    // Simula um delay de processamento para UX
    setTimeout(() => {
      const newFiles: FileItem[] = Array.from(selectedFiles).map((file: File) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type.includes('pdf') ? 'PDF' : (file.type.includes('image') ? 'IMG' : 'DOC'),
        size: formatFileSize(file.size)
      }));

      setFiles(prev => [...newFiles, ...prev]);
      setUploading(false);
      
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, 800);
  };

  const removeFile = (id: string) => {
    if (confirm("Deseja realmente excluir este arquivo?")) {
      setFiles(prev => prev.filter(f => f.id !== id));
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Área de Uploads</h2>
        <p className="text-gray-400 text-sm font-bold">Documentação do Sistema & Comprovantes.</p>
      </div>

      {/* Input oculto para processamento real */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
      />

      {/* Dropzone funcional */}
      <div 
        onClick={triggerUpload}
        className={`sam-card border-dashed border-2 flex flex-col items-center justify-center py-12 gap-3 transition-all cursor-pointer group active:scale-[0.98] ${
          uploading 
          ? 'border-amber-500 bg-amber-500/5 animate-pulse' 
          : 'border-[#40A8FC]/30 bg-black/20 hover:bg-[#40A8FC]/5 hover:border-[#40A8FC]'
        }`}
      >
        <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform ${
          uploading ? 'bg-amber-500/20 text-amber-500' : 'bg-[#40A8FC]/10 text-[#40A8FC] group-hover:scale-110'
        }`}>
          <CloudArrowUp size={32} weight={uploading ? "fill" : "regular"} />
        </div>
        <div className="text-center">
          <p className={`text-sm font-black uppercase tracking-widest ${uploading ? 'text-amber-500' : 'text-[#40A8FC]'}`}>
            {uploading ? 'Sincronizando Arquivos...' : 'Selecionar Arquivos'}
          </p>
          <p className="text-[10px] text-gray-600 uppercase font-black mt-1">
            Clique para buscar no seu dispositivo (PDF, PNG, JPG)
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest">
            Documentos na Nuvem ({files.length})
          </h3>
          {files.length > 0 && !uploading && (
            <span className="text-[10px] text-emerald-500 font-black uppercase flex items-center gap-1">
              <CheckCircle size={14} weight="fill"/> Backup Ativo
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {files.map(f => (
            <div key={f.id} className="sam-card flex justify-between items-center group hover:border-[#40A8FC]/30 transition-all bg-[#1e1e1e] border-[#333]">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center border border-[#333] transition-colors group-hover:border-[#40A8FC]/50">
                  {f.type === 'PDF' ? (
                    <FilePdf size={24} color="#ef4444" weight="duotone" />
                  ) : f.type === 'IMG' ? (
                    <Image size={24} color="#40A8FC" weight="duotone" />
                  ) : (
                    <FileIcon size={24} color="#9ca3af" weight="duotone" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate max-w-[200px] sm:max-w-xs">{f.name}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-tight">
                    {f.size} • {f.type}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 ml-2">
                <button 
                  className="p-2.5 hover:bg-[#40A8FC]/10 rounded-lg text-[#40A8FC] transition-colors active:scale-90"
                  title="Download"
                >
                  <DownloadSimple size={20} />
                </button>
                <button 
                  onClick={() => removeFile(f.id)} 
                  className="p-2.5 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors active:scale-90"
                  title="Excluir"
                >
                  <Trash size={20} />
                </button>
              </div>
            </div>
          ))}

          {files.length === 0 && !uploading && (
            <div className="sam-card py-16 text-center border-dashed border-2 border-[#333] opacity-50 flex flex-col items-center">
               <XCircle size={40} className="text-gray-600 mb-2" />
               <p className="text-[10px] font-black uppercase tracking-widest">Nenhum documento armazenado</p>
               <button onClick={triggerUpload} className="mt-3 text-[#40A8FC] text-[10px] font-black underline">FAZER PRIMEIRO UPLOAD</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientAreaView;
