"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Gavel, 
  ShieldCheck, 
  X,
  Eye,
  FileArchive,
  Upload,
  Plus,
  Trash2,
  Loader2
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { AlertModal } from "@/app/components/AlertModal";

// Interfaz para documentos (coincide con la tabla)
interface DocumentoDB {
  id_biblioteca: string;      // PK real
  titulo: string;
  descripcion: string;
  categoria: string;
  tipo: string;
  tamaño: string;
  fecha: string;
  url_archivo: string;
  nombre_archivo: string;
  usuario_id: string;
}

// Para la UI
interface Document {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  size: string;
  date: string;
  icon: React.ReactNode;
  color: string;
  filePath: string;
  fileName: string;
  isCustom: boolean;
  signedUrl?: string;
}

export const Biblioteca = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("TODOS");
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [documentos, setDocumentos] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  
  const formTitleRef = useRef<HTMLInputElement>(null);
  const formCategoryRef = useRef<HTMLSelectElement>(null);
  const formDescRef = useRef<HTMLTextAreaElement>(null);
  const formFileRef = useRef<HTMLInputElement>(null);

  const categories = ["TODOS", "LEGAL", "TÉCNICO", "FORMATOS"];

  // ==================== ALERT MODAL ====================
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'danger',
    showInput: false,
    inputPlaceholder: '',
    onConfirm: null as ((value?: string) => void) | null,
    cancelText: 'Cancelar',
    confirmText: 'Aceptar',
  });

  const showAlert = (title: string, message: string, type?: 'info'|'success'|'warning'|'danger') => {
    setModalState({
      ...modalState,
      isOpen: true,
      title,
      message,
      type: type || 'info',
      showInput: false,
      onConfirm: null,
    });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModalState({
      ...modalState,
      isOpen: true,
      title,
      message,
      type: 'warning',
      showInput: false,
      onConfirm: () => { onConfirm(); setModalState(prev => ({ ...prev, isOpen: false })); },
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
  };

  const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

  // ========== OCULTAR SIDEBAR CUANDO MODAL ESTÁ ABIERTO ==========
  useEffect(() => {
    if (showRegisterModal || modalState.isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [showRegisterModal, modalState.isOpen]);

  // ==================== DOCUMENTOS LEGALES (estáticos, desde /public) ====================
  const documentosLegalesEstaticos: Document[] = [
    { id: "101", title: "Reglamento Parcial de la Ley Orgánica de la Economía Comunal", description: "Documento oficial disponible para consulta y descarga comunitaria.", category: "LEGAL", type: "PDF", size: "Varios", date: "", icon: <Gavel className="h-5 w-5" />, color: "bg-amber-50 text-amber-600 border-amber-100", filePath: "/Reglamento-Parcial-de-la-Ley-Organica-de-la-economia-comunal.pdf", fileName: "", isCustom: false },
    { id: "102", title: "Ley Orgánica del Sistema Económico Comunal", description: "Documento oficial disponible para consulta y descarga comunitaria.", category: "LEGAL", type: "PDF", size: "Varios", date: "", icon: <Gavel className="h-5 w-5" />, color: "bg-amber-50 text-amber-600 border-amber-100", filePath: "/Ley-organica-del-Sistema-Economico-Comunal.pdf", fileName: "", isCustom: false },
    { id: "103", title: "Ley Orgánica de Gestión Comunitaria", description: "Documento oficial disponible para consulta y descarga comunitaria.", category: "LEGAL", type: "PDF", size: "Varios", date: "", icon: <Gavel className="h-5 w-5" />, color: "bg-amber-50 text-amber-600 border-amber-100", filePath: "/Ley-Organica-de-Gestion-comiunitaria.pdf", fileName: "", isCustom: false },
    { id: "104", title: "Ley Orgánica de Planificación Pública y Popular", description: "Documento oficial disponible para consulta y descarga comunitaria.", category: "LEGAL", type: "PDF", size: "Varios", date: "", icon: <Gavel className="h-5 w-5" />, color: "bg-amber-50 text-amber-600 border-amber-100", filePath: "/Ley-Organica-de-Planificacion-Publica-y-Popular.pdf", fileName: "", isCustom: false },
    { id: "105", title: "Ley Orgánica del Consejo Federal de Gobierno y su Reglamento", description: "Documento oficial disponible para consulta y descarga comunitaria.", category: "LEGAL", type: "PDF", size: "Varios", date: "", icon: <Gavel className="h-5 w-5" />, color: "bg-amber-50 text-amber-600 border-amber-100", filePath: "/Ley-Organica-del-Consejo-Federal-de-Gobierno-y-su-Reglamento.pdf", fileName: "", isCustom: false },
    { id: "106", title: "Ley Orgánica de las Comunas", description: "Documento oficial disponible para consulta y descarga comunitaria.", category: "LEGAL", type: "PDF", size: "Varios", date: "", icon: <Gavel className="h-5 w-5" />, color: "bg-amber-50 text-amber-600 border-amber-100", filePath: "/Ley-Organica-de-las-Comunas.pdf", fileName: "", isCustom: false },
    { id: "107", title: "Ley Orgánica del Poder Popular", description: "Documento oficial disponible para consulta y descarga comunitaria.", category: "LEGAL", type: "PDF", size: "Varios", date: "", icon: <Gavel className="h-5 w-5" />, color: "bg-amber-50 text-amber-600 border-amber-100", filePath: "/Ley-Organica-del-Poder-Popular.pdf", fileName: "", isCustom: false },
    { id: "108", title: "Ley Orgánica de Contraloría Social", description: "Documento oficial disponible para consulta y descarga comunitaria.", category: "LEGAL", type: "PDF", size: "Varios", date: "", icon: <Gavel className="h-5 w-5" />, color: "bg-amber-50 text-amber-600 border-amber-100", filePath: "/Ley-Organica-de-Contraloria-Social.pdf", fileName: "", isCustom: false },
    { id: "109", title: "Gaceta Oficial Extraordinaria 6.759", description: "Documento oficial disponible para consulta y descarga comunitaria.", category: "LEGAL", type: "PDF", size: "Varios", date: "", icon: <Gavel className="h-5 w-5" />, color: "bg-amber-50 text-amber-600 border-amber-100", filePath: "/GOE-6.759.pdf", fileName: "", isCustom: false },
    { id: "110", title: "Constitución de la República Bolivariana de Venezuela", description: "Documento oficial disponible para consulta y descarga comunitaria.", category: "LEGAL", type: "PDF", size: "Varios", date: "", icon: <Gavel className="h-5 w-5" />, color: "bg-amber-50 text-amber-600 border-amber-100", filePath: "/Constitucion-Venezuela-CRBV.pdf", fileName: "", isCustom: false },
  ];

  // ==================== OBTENER URL FIRMADA ====================
  const getSignedUrl = async (path: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('documentos')
        .createSignedUrl(path, 3600);
      if (error) throw error;
      return data.signedUrl;
    } catch (err) {
      console.error("Error generando URL firmada:", err);
      return null;
    }
  };

  // ==================== OBTENER DOCUMENTOS DESDE SUPABASE ====================
  const fetchDocumentos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documentos_biblioteca')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const docsFromDB: Document[] = [];
      for (const doc of (data || [])) {
        const signedUrl = await getSignedUrl(doc.url_archivo);
        docsFromDB.push({
          // 🔥 CORRECCIÓN: usar id_biblioteca como id
          id: doc.id_biblioteca,
          title: doc.titulo,
          description: doc.descripcion,
          category: doc.categoria,
          type: doc.tipo,
          size: doc.tamaño,
          date: new Date(doc.fecha).toLocaleDateString(),
          icon: doc.categoria === "TÉCNICO" ? <ShieldCheck className="h-5 w-5" /> : <FileText className="h-5 w-5" />,
          color: doc.categoria === "TÉCNICO" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100",
          filePath: doc.url_archivo,
          fileName: doc.nombre_archivo,
          isCustom: true,
          signedUrl: signedUrl || undefined,
        });
      }
      setDocumentos(docsFromDB);
    } catch (err) {
      console.error("Error cargando documentos:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDocumentos();
  }, [fetchDocumentos]);

  // ==================== SUBIR ARCHIVO A STORAGE ====================
  const uploadFile = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `documentos/${user.id}/${fileName}`;

    const { error } = await supabase.storage
      .from('documentos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error("Error subiendo archivo:", error);
      return null;
    }

    return filePath;
  };

  // ==================== REGISTRAR DOCUMENTO ====================
  const handleRegisterDocument = async () => {
    if (!user) {
      showAlert("Inicio de sesión requerido", "Debes iniciar sesión para registrar documentos.", "warning");
      return;
    }

    const title = formTitleRef.current?.value.trim();
    const category = formCategoryRef.current?.value;
    const description = formDescRef.current?.value.trim();
    const file = formFileRef.current?.files?.[0];

    if (!title || !category || !description || !file) {
      showAlert("Campos incompletos", "Completa todos los campos, incluyendo el archivo.", "warning");
      return;
    }

    const filePath = await uploadFile(file);
    if (!filePath) {
      showAlert("Error al subir", "Error al subir el archivo. Intenta de nuevo.", "danger");
      return;
    }

    const fileSize = file.size;
    let sizeLabel = "";
    if (fileSize < 1024) sizeLabel = `${fileSize} B`;
    else if (fileSize < 1024 * 1024) sizeLabel = `${(fileSize / 1024).toFixed(1)} KB`;
    else sizeLabel = `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;

    const tipo = file.name.split('.').pop()?.toUpperCase() || "ARCHIVO";

    const { error } = await supabase
      .from('documentos_biblioteca')
      .insert({
        titulo: title,
        descripcion: description,
        categoria: category,
        tipo: tipo,
        tamaño: sizeLabel,
        fecha: new Date().toISOString(),
        url_archivo: filePath,
        nombre_archivo: file.name,
        usuario_id: user.id,
      });

    if (error) {
      console.error("Error insertando documento:", error);
      showAlert("Error al guardar", "No se pudo guardar el documento en la base de datos.", "danger");
      return;
    }

    showAlert("Documento registrado", "Documento registrado exitosamente.", "success");
    setShowRegisterModal(false);
    if (formTitleRef.current) formTitleRef.current.value = "";
    if (formCategoryRef.current) formCategoryRef.current.value = "TÉCNICO";
    if (formDescRef.current) formDescRef.current.value = "";
    if (formFileRef.current) formFileRef.current.value = "";
    fetchDocumentos();
  };

  // ==================== ELIMINAR DOCUMENTO ====================
  const handleDeleteDocument = async (doc: Document) => {
    showConfirm(
      "Confirmar eliminación",
      `¿Eliminar permanentemente "${doc.title}"?`,
      async () => {
        if (!user) return;

        const { error: storageError } = await supabase.storage
          .from('documentos')
          .remove([doc.filePath]);

        if (storageError) {
          console.error("Error eliminando archivo:", storageError);
        }

        const { error: deleteError } = await supabase
          .from('documentos_biblioteca')
          .delete()
          .eq('id_biblioteca', doc.id); // 🔥 Usar id_biblioteca

        if (deleteError) {
          console.error("Error eliminando registro:", deleteError);
          showAlert("Error", "No se pudo eliminar el documento.", "danger");
          return;
        }

        showAlert("Eliminado", "Documento eliminado.", "success");
        fetchDocumentos();
      }
    );
  };

  // ==================== VER / DESCARGAR CON URL FIRMADA ====================
  const handleViewDocument = async (doc: Document) => {
    if (doc.category === "LEGAL") {
      window.open(doc.filePath, '_blank');
      return;
    }

    let url = doc.signedUrl;
    if (!url) {
      url = await getSignedUrl(doc.filePath) || undefined;
      if (url) doc.signedUrl = url;
    }
    if (url) window.open(url, '_blank');
    else showAlert("Error", "No se pudo acceder al documento.", "danger");
  };

  const handleDownloadDocument = async (doc: Document) => {
    if (doc.category === "LEGAL") {
      const a = document.createElement('a');
      a.href = doc.filePath;
      a.download = doc.fileName || "documento";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    let url = doc.signedUrl;
    if (!url) {
      url = await getSignedUrl(doc.filePath) || undefined;
      if (url) doc.signedUrl = url;
    }
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName || "documento";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      showAlert("Error", "No se pudo descargar el documento.", "danger");
    }
  };

  const allDocuments: Document[] = [...documentosLegalesEstaticos, ...documentos];

  const filteredDocs = allDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "TODOS" || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!user) {
    return <div className="p-8 text-center text-xs">Debes iniciar sesión para acceder a la biblioteca.</div>;
  }

  return (
    <div className="space-y-5 p-3 md:p-5 min-h-screen">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-6 w-6 bg-brand-primary rounded-lg flex items-center justify-center text-white shadow-md">
              <BookOpen className="h-4 w-4" />
            </div>
            <h2 className="text-base font-black text-slate-800 italic uppercase tracking-tighter">
              Biblioteca Digital
            </h2>
          </div>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center gap-1.5">
            Centro de documentación legal y técnica <span className="h-1 w-1 rounded-full bg-brand-primary animate-pulse" />
          </p>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 group-focus-within:text-brand-primary" />
          <input 
            type="text" 
            placeholder="Buscar leyes, formatos o guías..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-brand-primary/10 outline-none text-[10px] font-bold transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* FILTROS Y BOTÓN REGISTRO */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
                selectedCategory === cat 
                  ? "bg-brand-primary text-white shadow-md" 
                  : "bg-white text-slate-400 border border-gray-100 hover:bg-gray-50"
              )}
            >
              {cat === "TODOS" && <Filter className="h-2.5 w-2.5" />}
              {cat}
            </button>
          ))}
        </div>

        {(selectedCategory === "TÉCNICO" || selectedCategory === "FORMATOS") && (
          <button 
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-primary text-white rounded-lg text-[8px] font-black uppercase tracking-wider hover:scale-105 transition-all shadow-md"
          >
            <Plus className="h-3 w-3" /> Registrar Documento
          </button>
        )}
      </div>

      {/* LISTA DE DOCUMENTOS */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode='popLayout'>
            {filteredDocs.map((doc) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={doc.id} // 🔥 Ahora siempre tiene un valor único
                className="group bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className={cn("p-2 rounded-lg border transition-transform group-hover:scale-105", doc.color)}>
                      {doc.icon}
                    </div>
                    <span className="text-[7px] font-black bg-gray-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      {doc.type} • {doc.size}
                    </span>
                  </div>
                  
                  <h3 className="text-sm font-black text-slate-800 italic uppercase leading-tight mb-2">
                    {doc.title}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-4 line-clamp-2">
                    {doc.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
                    <span className="text-[8px] font-bold text-slate-400 uppercase">{doc.date || "Actualizado"}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => handleViewDocument(doc)}
                      className="p-1.5 rounded-lg bg-gray-50 text-slate-400 hover:bg-brand-primary/10 hover:text-brand-primary transition-colors"
                      title="Ver documento"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                    <button 
                      onClick={() => handleDownloadDocument(doc)}
                      className="p-1.5 rounded-lg bg-brand-primary text-white shadow-md hover:scale-105 transition-all"
                      title="Descargar"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                    {doc.isCustom && (
                      <button 
                        onClick={() => handleDeleteDocument(doc)}
                        className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                        title="Eliminar documento"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* MODAL DE REGISTRO */}
      <AnimatePresence>
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRegisterModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <h4 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">Registrar Documento</h4>
                <button onClick={() => setShowRegisterModal(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="h-5 w-5 text-slate-400" /></button>
              </div>
              <div className="p-8 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Título del Documento</label>
                  <input ref={formTitleRef} type="text" className="w-full p-4 rounded-2xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none" placeholder="Ej: Manual de procesos" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoría</label>
                  <select ref={formCategoryRef} className="w-full p-4 rounded-2xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none appearance-none cursor-pointer">
                    <option value="TÉCNICO">TÉCNICO</option>
                    <option value="FORMATOS">FORMATOS</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descripción</label>
                  <textarea ref={formDescRef} className="w-full p-4 rounded-2xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none resize-none min-h-25" placeholder="Breve resumen del contenido del documento..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Archivo</label>
                  <input ref={formFileRef} type="file" className="hidden" />
                  <button type="button" onClick={() => formFileRef.current?.click()} className="w-full p-6 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center gap-2 hover:border-brand-primary transition-colors group">
                    <Upload className="h-6 w-6 text-slate-300 group-hover:text-brand-primary" />
                    <span className="text-[10px] font-black text-slate-400 uppercase">Click para subir (PDF, DOCX, etc.)</span>
                  </button>
                </div>
                <button onClick={handleRegisterDocument} className="w-full py-5 rounded-2xl bg-brand-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 mt-4">Guardar en Biblioteca</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AlertModal global */}
      <AlertModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        showInput={modalState.showInput}
        inputPlaceholder={modalState.inputPlaceholder}
        cancelText={modalState.cancelText}
        confirmText={modalState.confirmText}
        onConfirm={modalState.onConfirm || (() => closeModal())}
      />
    </div>
  );
};