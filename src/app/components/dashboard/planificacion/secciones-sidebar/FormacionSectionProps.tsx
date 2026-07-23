'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Users, Award, Search, 
  Filter, GraduationCap, Calendar,
  Briefcase,ChevronLeft,ChevronRight, 
  MapPin,
  Clock,
  User,
  X,
  Eye,
  PlusCircle,
  Mail,
  Phone,
  Printer,
  Download,
  Hash,
  PenTool,
  UserPlus,
  Trash2,
  Edit,
  Loader2,
  Upload,
  Ban
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

// Interfaces
interface Curso {
  id: number;
  titulo: string;
  duration: string;
  type: string;
  students: number;
  fechaInicio: string;
  horario: string;
  lugar: string;
  facilitador: string;
  institucion: string;
  cupos: number;
  cupos_disponibles?: number;
  icon: any;
  descripcion?: string;
  publicado: boolean;
  fechaInicioRaw: string;
  tipo: string;
  modalidad: string;
}

interface Facilitador {
  id: number;
  name: string;
  area: string;
  certs: number;
  rating: number;
  especialidad: string;
  email: string;
  telefono?: string;
  cedula?: string;
  disponible?: boolean;
  tipoFacilitador?: string;
  institucion?: string;
}

interface Certificado {
  id: number;
  codigo: string;
  nombreParticipante: string;
  cedulaParticipante: string;
  nombreCurso: string;
  fechaEmision: string;
  horas: string;
  firmaFacilitador: string;
  firmaAlcalde: string;
  estado: 'Activo' | 'Cancelado';
}

interface ParticipanteReal {
  id_participante: number;
  nombre_participante: string;
  apellido_participante: string;
  cedula_participante: string;
  id_comuna: number | null;
  nombre_comuna: string | null;
  id_curso: number;
  id_postulacion: number;
  estado: string;
  fecha_inscripcion: string;
  certificado_url: string | null;
  curso_titulo?: string;
  curso_fecha_inicio?: string;
  sala_nombre?: string;
}

interface PlantillaCertificado {
  id: number;
  nombre: string;
  descripcion: string;
  url_imagen: string;
}

export const FormacionSection: React.FC<{ activeTab?: string }> = ({ activeTab = 'oferta' }) => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [loading, setLoading] = useState(false);
  const [loadingFacilitadores, setLoadingFacilitadores] = useState(false);
  const [loadingPlantillas, setLoadingPlantillas] = useState(false);
  const [loadingParticipantes, setLoadingParticipantes] = useState(false);
  
  // Estados para modales
  const [showNuevaOfertaModal, setShowNuevaOfertaModal] = useState(false);
  const [showEditarOfertaModal, setShowEditarOfertaModal] = useState(false);
  const [showNuevoFacilitadorModal, setShowNuevoFacilitadorModal] = useState(false);
  const [showEditarFacilitadorModal, setShowEditarFacilitadorModal] = useState(false);
  const [showNuevoCertificadoModal, setShowNuevoCertificadoModal] = useState(false);
  const [showPlantillaModal, setShowPlantillaModal] = useState(false);
  const [showNuevoParticipanteModal, setShowNuevoParticipanteModal] = useState(false);
  const [selectedCertificado, setSelectedCertificado] = useState<Certificado | null>(null);
  const [showCertificadoPreview, setShowCertificadoPreview] = useState(false);
  const [searchCertificado, setSearchCertificado] = useState('');
  const [searchParticipante, setSearchParticipante] = useState('');
  const [selectedCursoFiltro, setSelectedCursoFiltro] = useState('');
  const [selectedParticipante, setSelectedParticipante] = useState<ParticipanteReal | null>(null);
  const [showParticipanteDetail, setShowParticipanteDetail] = useState(false);
  const [cursoEditando, setCursoEditando] = useState<Curso | null>(null);
  const [facilitadorEditando, setFacilitadorEditando] = useState<Facilitador | null>(null);
  const [selectedPlantilla, setSelectedPlantilla] = useState<PlantillaCertificado | null>(null);
  
  // Datos desde Supabase
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [facilitadores, setFacilitadores] = useState<Facilitador[]>([]);
  const [plantillas, setPlantillas] = useState<PlantillaCertificado[]>([]);
  const [participantesReales, setParticipantesReales] = useState<ParticipanteReal[]>([]);
  
  // Datos mock certificados
  const [certificados, setCertificados] = useState<Certificado[]>([
    { id: 1, codigo: "CERT-2026-001", nombreParticipante: "María González", cedulaParticipante: "V-12345678", nombreCurso: "Diplomado en Gestión de Proyectos Comunitarios", fechaEmision: "10/03/2026", horas: "120", firmaFacilitador: "Dr. Roberto Mendoza", firmaAlcalde: "Alcaldesa de Carrizal", estado: "Activo" },
    { id: 2, codigo: "CERT-2026-002", nombreParticipante: "José Ramírez", cedulaParticipante: "V-87654321", nombreCurso: "Taller de Cartografía Social Base", fechaEmision: "15/04/2026", horas: "40", firmaFacilitador: "Lic. Claudia Santos", firmaAlcalde: "Alcaldesa de Carrizal", estado: "Activo" },
    { id: 3, codigo: "CERT-2026-003", nombreParticipante: "Ana Lucía Fernández", cedulaParticipante: "V-11223344", nombreCurso: "Contraloría Comunal y Transparencia", fechaEmision: "20/05/2026", horas: "30", firmaFacilitador: "Abg. Elena Rivas", firmaAlcalde: "Alcaldesa de Carrizal", estado: "Activo" },
    { id: 4, codigo: "CERT-2026-004", nombreParticipante: "Roberto Díaz", cedulaParticipante: "V-66778899", nombreCurso: "Diplomado en Gestión de Proyectos Comunitarios", fechaEmision: "10/03/2026", horas: "120", firmaFacilitador: "Dr. Roberto Mendoza", firmaAlcalde: "Alcaldesa de Carrizal", estado: "Activo" },
  ]);

  // Formularios
  const [nuevaOferta, setNuevaOferta] = useState({
    titulo: '', tipo: '', modalidad: '', duracion: '', fechaInicio: '', fechaFin: '', horario: '', lugar: '', facilitador: '', institucion: '', cupos: '', descripcion: ''
  });

  const [nuevoFacilitador, setNuevoFacilitador] = useState({
    nombre: '', apellido: '', cedula: '', email: '', telefono: '', area: '', especialidad: '', experiencia: '', tipoFacilitador: '', institucion: '', disponible: true
  });

  const [nuevoParticipante, setNuevoParticipante] = useState({
    nombre: '', apellido: '', cedula: '', telefono: '', email: '', direccion: '', comuna: '', sector: ''
  });

  const [nuevoCertificado, setNuevoCertificado] = useState({
    nombreParticipante: '', cedulaParticipante: '', nombreCurso: '', fechaEmision: new Date().toISOString().split('T')[0], horas: '', facilitador: ''
  });

  // Estados para plantillas
  const [nuevaPlantilla, setNuevaPlantilla] = useState({
    nombre: '',
    descripcion: '',
    archivo: null as File | null
  });
  const [uploadingPlantilla, setUploadingPlantilla] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [certificadoImagenGenerada, setCertificadoImagenGenerada] = useState<string | null>(null);

  // Función para contar participantes de un curso
  const contarParticipantesCurso = async (idCurso: number): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('participantes_curso')
        .select('*', { count: 'exact', head: true })
        .eq('id_curso', idCurso);
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error contando participantes:', error);
      return 0;
    }
  };

  // Cargar participantes reales desde la base de datos
  const cargarParticipantesReales = async () => {
    setLoadingParticipantes(true);
    try {
      const { data, error } = await supabase
        .from('participantes_curso')
        .select(`
          *,
          cursos: id_curso (id_cursos, titulo, fecha_inicio),
          postulaciones_sala: id_postulacion (nombre_sala, ubicacion_sala)
        `)
        .order('fecha_inscripcion', { ascending: false });
      
      if (error) throw error;
      
      const participantesConDetalles = (data || []).map((p: any) => ({
        id_participante: p.id_participante,
        nombre_participante: p.nombre_participante,
        apellido_participante: p.apellido_participante,
        cedula_participante: p.cedula_participante,
        id_comuna: p.id_comuna,
        nombre_comuna: p.nombre_comuna,
        id_curso: p.id_curso,
        id_postulacion: p.id_postulacion,
        estado: p.estado,
        fecha_inscripcion: p.fecha_inscripcion,
        certificado_url: p.certificado_url,
        curso_titulo: p.cursos?.titulo,
        curso_fecha_inicio: p.cursos?.fecha_inicio,
        sala_nombre: p.postulaciones_sala?.nombre_sala
      }));
      
      setParticipantesReales(participantesConDetalles);
    } catch (error) {
      console.error('Error cargando participantes:', error);
    } finally {
      setLoadingParticipantes(false);
    }
  };

  // ==================== FUNCIONES CRUD CURSOS ====================
  const getIconByTipo = (tipo: string) => {
    switch(tipo) {
      case 'Diplomado': return Briefcase;
      case 'Taller': return BookOpen;
      default: return GraduationCap;
    }
  };

  const cargarCursos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      const cursosConCupos = await Promise.all(data.map(async (curso: any) => {
        const participantesCount = await contarParticipantesCurso(curso.id_cursos);
        return {
          id: curso.id_cursos,
          titulo: curso.titulo,
          duration: curso.duracion,
          type: curso.modalidad,
          students: participantesCount,
          fechaInicio: new Date(curso.fecha_inicio).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
          horario: curso.horario,
          lugar: curso.lugar,
          facilitador: curso.facilitador,
          institucion: curso.institucion,
          cupos: curso.cupos,
          cupos_disponibles: Math.max(0, curso.cupos - participantesCount),
          icon: getIconByTipo(curso.tipo),
          descripcion: curso.descripcion,
          publicado: curso.publicado,
          fechaInicioRaw: curso.fecha_inicio,
          tipo: curso.tipo,
          modalidad: curso.modalidad
        };
      }));
      
      setCursos(cursosConCupos);
    } catch (error) {
      console.error(error);
      alert('No se pudieron cargar los cursos');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarOferta = async () => {
    if (!user) return alert('Debes iniciar sesión');
    if (!nuevaOferta.titulo || !nuevaOferta.tipo || !nuevaOferta.modalidad || !nuevaOferta.duracion || !nuevaOferta.fechaInicio || !nuevaOferta.horario || !nuevaOferta.lugar || !nuevaOferta.facilitador || !nuevaOferta.institucion) {
      return alert('Completa todos los campos obligatorios');
    }
    try {
      const { error } = await supabase.from('cursos').insert({
        titulo: nuevaOferta.titulo,
        tipo: nuevaOferta.tipo,
        modalidad: nuevaOferta.modalidad,
        duracion: nuevaOferta.duracion,
        fecha_inicio: nuevaOferta.fechaInicio,
        fecha_fin: nuevaOferta.fechaFin || null,
        horario: nuevaOferta.horario,
        lugar: nuevaOferta.lugar,
        facilitador: nuevaOferta.facilitador,
        institucion: nuevaOferta.institucion,
        cupos: parseInt(nuevaOferta.cupos) || 0,
        descripcion: nuevaOferta.descripcion,
        publicado: true,
        usuario_id: user.id
      });
      if (error) throw error;
      alert('Oferta creada');
      setShowNuevaOfertaModal(false);
      resetNuevaOferta();
      cargarCursos();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  
  const handleEditarOferta = async () => {
    if (!cursoEditando) return;
    try {
      const { error } = await supabase.from('cursos').update({
        titulo: nuevaOferta.titulo,
        tipo: nuevaOferta.tipo,
        modalidad: nuevaOferta.modalidad,
        duracion: nuevaOferta.duracion,
        fecha_inicio: nuevaOferta.fechaInicio,
        fecha_fin: nuevaOferta.fechaFin || null,
        horario: nuevaOferta.horario,
        lugar: nuevaOferta.lugar,
        facilitador: nuevaOferta.facilitador,
        institucion: nuevaOferta.institucion,
        cupos: parseInt(nuevaOferta.cupos) || 0,
        descripcion: nuevaOferta.descripcion
      }).eq('id_cursos', cursoEditando.id);
      if (error) throw error;
      alert('Curso actualizado');
      setShowEditarOfertaModal(false);
      setCursoEditando(null);
      cargarCursos();
      resetNuevaOferta();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const handleEliminarCurso = async (curso: Curso) => {
    if (!confirm(`¿Eliminar "${curso.titulo}"?`)) return;
    try {
      const { error } = await supabase.from('cursos').delete().eq('id_cursos', curso.id);
      if (error) throw error;
      alert('Curso eliminado');
      cargarCursos();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const resetNuevaOferta = () => setNuevaOferta({ titulo: '', tipo: '', modalidad: '', duracion: '', fechaInicio: '', fechaFin: '', horario: '', lugar: '', facilitador: '', institucion: '', cupos: '', descripcion: '' });
  
  const abrirEditar = (curso: Curso) => {
    setCursoEditando(curso);
    setNuevaOferta({
      titulo: curso.titulo, tipo: curso.tipo, modalidad: curso.modalidad, duracion: curso.duration,
      fechaInicio: curso.fechaInicioRaw, fechaFin: '', horario: curso.horario, lugar: curso.lugar,
      facilitador: curso.facilitador, institucion: curso.institucion, cupos: curso.cupos.toString(),
      descripcion: curso.descripcion || ''
    });
    setShowEditarOfertaModal(true);
  };

  // ==================== FUNCIONES CRUD FACILITADORES ====================
  const cargarFacilitadores = async () => {
    setLoadingFacilitadores(true);
    try {
      const { data, error } = await supabase.from('facilitadores').select('*').order('nombre', { ascending: true });
      if (error) throw error;
      const facilitadoresFormateados: Facilitador[] = data.map((fac: any) => ({
        id: fac.id_facilitador,
        name: `${fac.nombre} ${fac.apellido}`,
        area: fac.area,
        certs: 0,
        rating: 0,
        especialidad: fac.especialidad,
        email: fac.email,
        telefono: fac.telefono,
        cedula: fac.cedula,
        disponible: fac.disponible,
        tipoFacilitador: fac.tipo_facilitador,
        institucion: fac.institucion
      }));
      setFacilitadores(facilitadoresFormateados);
    } catch (error) {
      console.error(error);
      alert('Error al cargar facilitadores');
    } finally {
      setLoadingFacilitadores(false);
    }
  };

  const handleGuardarFacilitador = async () => {
    if (!user) return alert('Debes iniciar sesión');
    if (!nuevoFacilitador.nombre || !nuevoFacilitador.apellido || !nuevoFacilitador.cedula || !nuevoFacilitador.email || !nuevoFacilitador.area || !nuevoFacilitador.especialidad) {
      return alert('Completa los campos obligatorios');
    }
    try {
      const { error } = await supabase.from('facilitadores').insert({
        nombre: nuevoFacilitador.nombre,
        apellido: nuevoFacilitador.apellido,
        cedula: nuevoFacilitador.cedula,
        email: nuevoFacilitador.email,
        telefono: nuevoFacilitador.telefono || null,
        area: nuevoFacilitador.area,
        especialidad: nuevoFacilitador.especialidad,
        tipo_facilitador: nuevoFacilitador.tipoFacilitador || null,
        institucion: nuevoFacilitador.institucion || null,
        disponible: nuevoFacilitador.disponible,
        usuario_id: user.id
      });
      if (error) throw error;
      alert('Facilitador registrado');
      setShowNuevoFacilitadorModal(false);
      resetNuevoFacilitador();
      cargarFacilitadores();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const resetNuevoFacilitador = () => setNuevoFacilitador({ nombre: '', apellido: '', cedula: '', email: '', telefono: '', area: '', especialidad: '', experiencia: '', tipoFacilitador: '', institucion: '', disponible: true });

  const handleEditarFacilitador = (facilitador: Facilitador) => {
    setFacilitadorEditando(facilitador);
    const [nombre, ...apellidoParts] = facilitador.name.split(' ');
    setNuevoFacilitador({
      nombre: nombre || '',
      apellido: apellidoParts.join(' ') || '',
      cedula: facilitador.cedula || '',
      email: facilitador.email,
      telefono: facilitador.telefono || '',
      area: facilitador.area,
      especialidad: facilitador.especialidad,
      experiencia: '',
      tipoFacilitador: facilitador.tipoFacilitador || '',
      institucion: facilitador.institucion || '',
      disponible: facilitador.disponible ?? true
    });
    setShowEditarFacilitadorModal(true);
  };

  const handleActualizarFacilitador = async () => {
    if (!facilitadorEditando) return;
    if (!nuevoFacilitador.nombre || !nuevoFacilitador.apellido || !nuevoFacilitador.cedula || !nuevoFacilitador.email || !nuevoFacilitador.area || !nuevoFacilitador.especialidad) {
      return alert('Completa los campos obligatorios');
    }
    try {
      const { error } = await supabase.from('facilitadores').update({
        nombre: nuevoFacilitador.nombre,
        apellido: nuevoFacilitador.apellido,
        cedula: nuevoFacilitador.cedula,
        email: nuevoFacilitador.email,
        telefono: nuevoFacilitador.telefono || null,
        area: nuevoFacilitador.area,
        especialidad: nuevoFacilitador.especialidad,
        tipo_facilitador: nuevoFacilitador.tipoFacilitador || null,
        institucion: nuevoFacilitador.institucion || null,
        disponible: nuevoFacilitador.disponible
      }).eq('id_facilitador', facilitadorEditando.id);
      if (error) throw error;
      alert('Facilitador actualizado');
      setShowEditarFacilitadorModal(false);
      setFacilitadorEditando(null);
      resetNuevoFacilitador();
      cargarFacilitadores();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const handleEliminarFacilitador = async (facilitador: Facilitador) => {
    if (!confirm(`¿Eliminar a "${facilitador.name}"?`)) return;
    try {
      const { error } = await supabase.from('facilitadores').delete().eq('id_facilitador', facilitador.id);
      if (error) throw error;
      alert('Facilitador eliminado');
      cargarFacilitadores();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  // ==================== FUNCIONES CRUD PLANTILLAS ====================
  const cargarPlantillas = async () => {
    setLoadingPlantillas(true);
    try {
      const { data, error } = await supabase.from('plantillas_certificados').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setPlantillas(data);
    } catch (error) {
      console.error(error);
      alert('Error al cargar plantillas');
    } finally {
      setLoadingPlantillas(false);
    }
  };

  const handleGuardarPlantilla = async () => {
    if (!user) return alert('Debes iniciar sesión');
    if (!nuevaPlantilla.nombre || !nuevaPlantilla.archivo) {
      return alert('Nombre y archivo de imagen son obligatorios');
    }
    setUploadingPlantilla(true);
    try {
      const fileExt = nuevaPlantilla.archivo.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('plantillas_certificados')
        .upload(fileName, nuevaPlantilla.archivo);
      if (uploadError) throw uploadError;

      const { data: signedUrlData } = await supabase.storage
        .from('plantillas_certificados')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365);
      if (!signedUrlData) throw new Error('No se pudo generar la URL firmada');

      const { error: dbError } = await supabase.from('plantillas_certificados').insert({
        nombre: nuevaPlantilla.nombre,
        descripcion: nuevaPlantilla.descripcion,
        url_imagen: signedUrlData.signedUrl,
        usuario_id: user.id
      });
      if (dbError) throw dbError;

      alert('Plantilla guardada correctamente');
      setShowPlantillaModal(false);
      resetNuevaPlantilla();
      cargarPlantillas();
    } catch (error: any) {
      alert('Error al guardar plantilla: ' + error.message);
    } finally {
      setUploadingPlantilla(false);
    }
  };

  const handleEliminarPlantilla = async (plantilla: PlantillaCertificado) => {
    if (!confirm(`¿Eliminar la plantilla "${plantilla.nombre}"?`)) return;
    try {
      const { error: dbError } = await supabase.from('plantillas_certificados').delete().eq('id_plantillas', plantilla.id);
      if (dbError) throw dbError;
      alert('Plantilla eliminada');
      cargarPlantillas();
      if (selectedPlantilla?.id === plantilla.id) setSelectedPlantilla(null);
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const resetNuevaPlantilla = () => {
    setNuevaPlantilla({ nombre: '', descripcion: '', archivo: null });
    setPreviewImageUrl(null);
  };

  const handleSeleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNuevaPlantilla(prev => ({ ...prev, archivo: file }));
      const reader = new FileReader();
      reader.onload = (event) => setPreviewImageUrl(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Generar certificado con superposición de textos
  const generarCertificadoImagen = async (cert: Certificado, plantilla: PlantillaCertificado): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No se pudo crear el canvas');
        ctx.drawImage(img, 0, 0);
        ctx.font = '24px sans-serif';
        ctx.fillStyle = '#000000';
        ctx.fillText(cert.nombreParticipante, 100, 200);
        ctx.font = '18px sans-serif';
        ctx.fillText(cert.cedulaParticipante, 100, 240);
        ctx.font = '22px sans-serif';
        ctx.fillText(cert.nombreCurso, 100, 300);
        ctx.font = '16px sans-serif';
        ctx.fillText(cert.horas + ' horas', 100, 340);
        ctx.font = '14px sans-serif';
        ctx.fillText(cert.fechaEmision, 100, 400);
        ctx.font = '14px sans-serif';
        ctx.fillText(cert.firmaFacilitador, 150, 500);
        ctx.font = '14px sans-serif';
        ctx.fillText(cert.firmaAlcalde, 400, 500);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject('Error al cargar la imagen de la plantilla');
      img.src = plantilla.url_imagen;
    });
  };

  // Handlers para certificados
  const handleNuevoCertificadoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNuevoCertificado(prev => ({ ...prev, [name]: value }));
  };

  const generarCodigoUnico = () => {
    const año = new Date().getFullYear();
    const numero = String(certificados.length + 1).padStart(3, '0');
    return `CERT-${año}-${numero}`;
  };

  const handleGuardarCertificado = () => {
    const nuevoCert: Certificado = {
      id: certificados.length + 1,
      codigo: generarCodigoUnico(),
      nombreParticipante: nuevoCertificado.nombreParticipante,
      cedulaParticipante: nuevoCertificado.cedulaParticipante,
      nombreCurso: nuevoCertificado.nombreCurso,
      fechaEmision: new Date(nuevoCertificado.fechaEmision).toLocaleDateString('es-ES'),
      horas: nuevoCertificado.horas,
      firmaFacilitador: nuevoCertificado.facilitador,
      firmaAlcalde: "Alcaldesa de Carrizal",
      estado: "Activo"
    };
    setCertificados(prev => [...prev, nuevoCert]);
    setShowNuevoCertificadoModal(false);
    setNuevoCertificado({ nombreParticipante: '', cedulaParticipante: '', nombreCurso: '', fechaEmision: new Date().toISOString().split('T')[0], horas: '', facilitador: '' });
    alert(`Certificado creado. Código: ${nuevoCert.codigo}`);
  };

  const handleVerCertificado = async (cert: Certificado, plantilla?: PlantillaCertificado) => {
    setSelectedCertificado(cert);
    if (plantilla) {
      try {
        const imgData = await generarCertificadoImagen(cert, plantilla);
        setCertificadoImagenGenerada(imgData);
      } catch (error) {
        console.error(error);
        setCertificadoImagenGenerada(null);
      }
    } else {
      setCertificadoImagenGenerada(null);
    }
    setShowCertificadoPreview(true);
  };

  // Efectos iniciales
  useEffect(() => {
    cargarCursos();
    cargarFacilitadores();
    cargarPlantillas();
    cargarParticipantesReales();
  }, []);

  // Filtros
  const cursosOptions = cursos.map(c => c.titulo);
  const facilitadoresOptions = facilitadores.map(f => f.name);
  const certificadosFiltrados = certificados.filter(cert =>
    cert.nombreParticipante.toLowerCase().includes(searchCertificado.toLowerCase()) ||
    cert.codigo.toLowerCase().includes(searchCertificado.toLowerCase()) ||
    cert.nombreCurso.toLowerCase().includes(searchCertificado.toLowerCase())
  );
  
  // Filtrar participantes reales
  const participantesFiltrados = participantesReales.filter(part => {
    const nombreCompleto = `${part.nombre_participante} ${part.apellido_participante}`.toLowerCase();
    const matchesSearch = nombreCompleto.includes(searchParticipante.toLowerCase()) || 
                          part.cedula_participante.toLowerCase().includes(searchParticipante.toLowerCase());
    const matchesCurso = selectedCursoFiltro === '' || part.curso_titulo === selectedCursoFiltro;
    return matchesSearch && matchesCurso;
  });

  const handleNuevaOfertaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNuevaOferta(prev => ({ ...prev, [name]: value }));
  };

  const handleFacilitadorSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    const fac = facilitadores.find(f => f.name === selectedName);
    setNuevaOferta(prev => ({ ...prev, facilitador: selectedName, institucion: fac?.institucion || '' }));
  };

  const handleNuevoFacilitadorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNuevoFacilitador(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-8 p-4 md:p-8 min-h-screen">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-3">
            <GraduationCap className="h-7 w-7 text-brand-primary" /> Módulo de Formación Comunal
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            Escuela de Fortalecimiento del Poder Popular
          </p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
          {[
            { id: 'oferta', label: 'Oferta Académica', icon: BookOpen },
            { id: 'participantes', label: 'Participantes', icon: Users },
            { id: 'facilitadores', label: 'Facilitadores', icon: GraduationCap },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setCurrentTab(tab.id as any)} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all", currentTab === tab.id ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20" : "text-slate-400 hover:bg-gray-50")}>
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* OFERTA ACADÉMICA */}
        {currentTab === 'oferta' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex justify-end">
              <button onClick={() => setShowNuevaOfertaModal(true)} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-[1.02] transition-all">
                <PlusCircle className="h-4 w-4" /> Nueva Oferta
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-primary" /></div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {cursos.map((curso) => {
                  const cuposAgotados = curso.cupos_disponibles !== undefined && curso.cupos_disponibles <= 0;
                  return (
                    <div key={curso.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative group">
                      <div>
                        <div className="flex justify-between items-start mb-6">
                          <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest", curso.type === "Presencial" ? "bg-blue-50 text-blue-500" : curso.type === "Online" ? "bg-emerald-50 text-emerald-500" : "bg-amber-50 text-amber-500")}>
                            {curso.type}
                          </span>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex -space-x-2">
                              <div className="h-6 w-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-500">{curso.cupos}</div>
                            </div>
                            {cuposAgotados && (
                              <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                                Cupos agotados
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-4"><curso.icon size={24} /></div>
                        <h3 className="text-lg font-black text-slate-800 italic uppercase leading-tight mb-2">{curso.titulo}</h3>
                        {curso.descripcion && <p className="text-[9px] text-slate-500 mb-4 line-clamp-2">{curso.descripcion}</p>}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-brand-primary" /><span className="text-xs font-bold">{curso.fechaInicio}</span></div>
                          <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-brand-primary" /><span className="text-xs font-bold">{curso.horario}</span></div>
                          <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-brand-primary" /><span className="text-xs font-bold">{curso.lugar}</span></div>
                          <div className="flex items-center gap-3"><BookOpen className="h-4 w-4 text-brand-primary" /><span className="text-xs font-bold">Duración: {curso.duration}</span></div>
                          <div className="flex items-center gap-3"><Users className="h-4 w-4 text-brand-primary" /><span className="text-xs font-bold">Cupos disponibles: {curso.cupos_disponibles}</span></div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-brand-primary shadow-sm"><User className="h-5 w-5" /></div>
                          <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Facilitador</p><p className="text-xs font-black text-slate-800">{curso.facilitador}</p><p className="text-[9px] font-bold text-brand-primary uppercase italic">{curso.institucion}</p></div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
                        <button onClick={() => abrirEditar(curso)} className="p-2 rounded-xl bg-gray-100 text-slate-600 hover:bg-brand-primary/10 hover:text-brand-primary"><Edit className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleEliminarCurso(curso)} className="p-2 rounded-xl bg-gray-100 text-slate-600 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* PARTICIPANTES - DATOS REALES DESDE BD */}
        {currentTab === 'participantes' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex justify-between items-center gap-4">
              <h3 className="text-lg font-black text-slate-800 italic uppercase">Listado de Participantes</h3>
            </div>
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="BUSCAR POR NOMBRE, APELLIDO O CÉDULA..." 
                    className="pl-10 pr-4 py-2 bg-white border-none ring-1 ring-gray-100 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-brand-primary/20 w-full" 
                    value={searchParticipante} 
                    onChange={(e) => setSearchParticipante(e.target.value)} 
                  />
                </div>
                <div className="relative w-full md:w-64">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <select 
                    className="pl-10 pr-4 py-2 bg-white border-none ring-1 ring-gray-100 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-brand-primary/20 w-full appearance-none" 
                    value={selectedCursoFiltro} 
                    onChange={(e) => setSelectedCursoFiltro(e.target.value)}
                  >
                    <option value="">Todos los cursos</option>
                    {cursos.map(curso => (<option key={curso.id} value={curso.titulo}>{curso.titulo}</option>))}
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                {loadingParticipantes ? (
                  <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-primary" /></div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-6 py-4">Sala Postulada</th>
                        <th className="px-6 py-4">Participante</th>
                        <th className="px-6 py-4">Cédula</th>
                        <th className="px-6 py-4">Comuna</th>
                        <th className="px-6 py-4">Curso</th>
                        <th className="px-6 py-4">Estado</th>
                        <th className="px-6 py-4">Fecha Inscripción</th>
                        <th className="px-6 py-4">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {participantesFiltrados.map((part) => (
                        <tr key={part.id_participante} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => { setSelectedParticipante(part); setShowParticipanteDetail(true); }}>
                          <td className="px-6 py-4">
                            <p className="text-[10px] font-bold text-slate-700">{part.sala_nombre || 'No registrada'}</p>
                           </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary text-xs font-black">
                                {part.nombre_participante?.[0]}{part.apellido_participante?.[0]}
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-800">{part.nombre_participante} {part.apellido_participante}</p>
                              </div>
                            </div>
                           </td>
                          <td className="px-6 py-4 text-[10px] font-bold text-slate-600">{part.cedula_participante}</td>
                          <td className="px-6 py-4">
                            <p className="text-[10px] font-bold text-slate-700">{part.nombre_comuna || 'No especificada'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[10px] font-bold text-slate-700 max-w-50 truncate">{part.curso_titulo || 'Curso no disponible'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-lg text-[8px] font-black uppercase",
                              part.estado === 'inscrito' ? "bg-blue-50 text-blue-600" :
                              part.estado === 'completado' ? "bg-emerald-50 text-emerald-600" :
                              part.estado === 'en_curso' ? "bg-amber-50 text-amber-600" :
                              "bg-slate-100 text-slate-500"
                            )}>
                              {part.estado === 'inscrito' ? 'Inscrito' : 
                               part.estado === 'completado' ? 'Completado' : 
                               part.estado === 'en_curso' ? 'En Curso' : part.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[10px] font-bold text-slate-500">
                            {new Date(part.fecha_inscripcion).toLocaleDateString('es-ES')}
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              className="p-1.5 rounded-lg bg-gray-50 hover:bg-brand-primary/10 transition-colors"
                              onClick={(e) => { e.stopPropagation(); setSelectedParticipante(part); setShowParticipanteDetail(true); }}
                            >
                              <Eye className="h-3.5 w-3.5 text-slate-500" />
                            </button>
                          </td>
                         </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {!loadingParticipantes && participantesFiltrados.length === 0 && (
                <div className="p-12 text-center text-slate-400">No hay participantes registrados</div>
              )}
            </div>
          </motion.div>
        )}

        {/* FACILITADORES */}
        {currentTab === 'facilitadores' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4">
              <div><h3 className="text-lg font-black text-slate-800 italic uppercase">Cuerpo de Facilitadores</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Profesionales al servicio de la formación comunal</p></div>
              <div className="flex gap-3">
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input type="text" placeholder="BUSCAR FACILITADOR..." className="pl-10 pr-4 py-2 bg-white border-none ring-1 ring-gray-100 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-brand-primary/20 w-full md:w-64" /></div>
                <button onClick={() => setShowNuevoFacilitadorModal(true)} className="flex items-center gap-2 px-6 py-2 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-[1.02] transition-all"><PlusCircle className="h-4 w-4" /> Nuevo Facilitador</button>
              </div>
            </div>
            <div className="p-6">
              {loadingFacilitadores ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-brand-primary" /></div> : (
                <div className="grid gap-4 md:grid-cols-2">{facilitadores.map((f) => (<div key={f.id} className="p-5 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-brand-primary/30 hover:shadow-md transition-all"><div className="flex items-center gap-4"><div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center font-black italic text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all text-lg">{f.name.charAt(0)}{f.name.split(' ')[1]?.charAt(0) || ''}</div><div><p className="text-sm font-black text-slate-900">{f.name}</p><p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{f.area}</p><p className="text-[8px] text-brand-primary font-bold italic mt-1">{f.especialidad}</p>{f.tipoFacilitador && <p className="text-[7px] text-slate-400 font-bold mt-0.5">{f.tipoFacilitador === 'personal' ? '📋 Personal Alcaldía' : '🏛️ Tutor Institucional'}</p>}</div></div><div className="text-right"><p className="text-[10px] font-black text-slate-900">{f.certs} Cursos</p><div className="flex items-center gap-0.5 mt-1">{[...Array(5)].map((_, j) => (<div key={j} className={cn("w-2 h-2 rounded-full", j < Math.floor(f.rating) ? 'bg-yellow-400' : 'bg-slate-100')} />))}</div><div className="flex items-center gap-1 mt-2 justify-end"><Mail className="h-3 w-3 text-slate-400" /><p className="text-[7px] text-slate-400 font-bold truncate max-w-25">{f.email}</p></div>{f.telefono && <div className="flex items-center gap-1 mt-0.5 justify-end"><Phone className="h-3 w-3 text-slate-400" /><p className="text-[7px] text-slate-400 font-bold">{f.telefono}</p></div>}<div className="flex gap-2 mt-3 justify-end"><button onClick={() => handleEditarFacilitador(f)} className="p-1.5 rounded-lg bg-gray-100 text-slate-500 hover:bg-brand-primary/10 hover:text-brand-primary"><Edit className="h-3 w-3" /></button><button onClick={() => handleEliminarFacilitador(f)} className="p-1.5 rounded-lg bg-gray-100 text-slate-500 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3 w-3" /></button></div></div></div>))}</div>
              )}
              {!loadingFacilitadores && facilitadores.length === 0 && <div className="text-center py-12 text-slate-400">No hay facilitadores registrados</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

       {/* Modal Detalle Participante */}
      <AnimatePresence>
        {showParticipanteDetail && selectedParticipante && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowParticipanteDetail(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-linear-to-r from-brand-primary/10 to-brand-primary/5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary text-xl font-black">
                    {selectedParticipante.nombre_participante?.[0]}{selectedParticipante.apellido_participante?.[0]}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800">{selectedParticipante.nombre_participante} {selectedParticipante.apellido_participante}</h4>
                    <p className="text-[10px] text-slate-500">{selectedParticipante.cedula_participante}</p>
                  </div>
                </div>
                <button onClick={() => setShowParticipanteDetail(false)} className="p-1.5 rounded-xl bg-white/80 text-slate-500 hover:bg-white"><X className="h-4 w-4" /></button>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">Sala Postulada</p>
                    <p className="text-xs font-bold text-slate-800">{selectedParticipante.sala_nombre || 'No registrada'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">Comuna</p>
                    <p className="text-xs font-bold text-slate-800">{selectedParticipante.nombre_comuna || 'No especificada'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">Curso</p>
                    <p className="text-xs font-bold text-slate-800">{selectedParticipante.curso_titulo || 'No disponible'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">Estado</p>
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-[8px] font-black uppercase",
                      selectedParticipante.estado === 'inscrito' ? "bg-blue-50 text-blue-600" :
                      selectedParticipante.estado === 'completado' ? "bg-emerald-50 text-emerald-600" :
                      "bg-amber-50 text-amber-600"
                    )}>
                      {selectedParticipante.estado === 'inscrito' ? 'Inscrito' : 
                       selectedParticipante.estado === 'completado' ? 'Completado' : 
                       selectedParticipante.estado === 'en_curso' ? 'En Curso' : selectedParticipante.estado}
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">Fecha de Inscripción</p>
                    <p className="text-xs font-bold text-slate-800">{new Date(selectedParticipante.fecha_inscripcion).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Modal Nueva Oferta */}
      <AnimatePresence>{showNuevaOfertaModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNuevaOfertaModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" /><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"><div className="p-4 border-b border-gray-50 flex items-center justify-between bg-brand-primary sticky top-0 z-10"><h4 className="text-base font-black text-white italic uppercase tracking-wider">Registrar Nueva Oferta</h4><button onClick={() => setShowNuevaOfertaModal(false)} className="p-1.5 rounded-xl bg-white/10 text-white hover:bg-white/20"><X className="h-3 w-3" /></button></div><div className="p-5 space-y-3"><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div className="md:col-span-2"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Título</label><input type="text" name="titulo" value={nuevaOferta.titulo} onChange={handleNuevaOfertaChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Tipo</label><select name="tipo" value={nuevaOferta.tipo} onChange={handleNuevaOfertaChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"><option value="">Seleccionar</option><option value="Diplomado">Diplomado</option><option value="Taller">Taller</option><option value="Curso">Curso</option></select></div><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Modalidad</label><select name="modalidad" value={nuevaOferta.modalidad} onChange={handleNuevaOfertaChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"><option value="">Seleccionar</option><option value="Presencial">Presencial</option><option value="Online">Online</option><option value="Semipresencial">Semipresencial</option></select></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Duración</label><input type="text" name="duracion" value={nuevaOferta.duracion} onChange={handleNuevaOfertaChange} placeholder="EJ: 40h" className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Horario</label><input type="text" name="horario" value={nuevaOferta.horario} onChange={handleNuevaOfertaChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Fecha Inicio</label><input type="date" name="fechaInicio" value={nuevaOferta.fechaInicio} onChange={handleNuevaOfertaChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Fecha Cierre</label><input type="date" name="fechaFin" value={nuevaOferta.fechaFin} onChange={handleNuevaOfertaChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Lugar</label><input type="text" name="lugar" value={nuevaOferta.lugar} onChange={handleNuevaOfertaChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Cupos</label><input type="number" name="cupos" value={nuevaOferta.cupos} onChange={handleNuevaOfertaChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Facilitador</label><select name="facilitador" value={nuevaOferta.facilitador} onChange={handleFacilitadorSelectChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"><option value="">Seleccionar</option>{facilitadores.map(f => (<option key={f.id} value={f.name}>{f.name}</option>))}</select></div><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Institución</label><input type="text" name="institucion" value={nuevaOferta.institucion} onChange={handleNuevaOfertaChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div></div>
            <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Descripción</label><textarea name="descripcion" value={nuevaOferta.descripcion} onChange={handleNuevaOfertaChange} rows={2} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none" /></div>
            <div className="flex gap-3 pt-2"><button onClick={() => setShowNuevaOfertaModal(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Cancelar</button><button onClick={handleGuardarOferta} className="flex-1 py-3 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-[1.01] transition-all">Registrar</button></div></div></motion.div></div>)}</AnimatePresence>

      {/* Modal Editar Oferta */}
      <AnimatePresence>{showEditarOfertaModal && cursoEditando && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditarOfertaModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" /><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"><div className="p-4 border-b border-gray-50 flex items-center justify-between bg-brand-primary sticky top-0 z-10"><h4 className="text-base font-black text-white italic uppercase tracking-wider">Editar Oferta</h4><button onClick={() => setShowEditarOfertaModal(false)} className="p-1.5 rounded-xl bg-white/10 text-white hover:bg-white/20"><X className="h-3 w-3" /></button></div><div className="p-5 space-y-3"><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div className="md:col-span-2"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Título</label><input type="text" name="titulo" value={nuevaOferta.titulo} onChange={handleNuevaOfertaChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Tipo</label><select name="tipo" value={nuevaOferta.tipo} onChange={handleNuevaOfertaChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"><option value="Diplomado">Diplomado</option><option value="Taller">Taller</option><option value="Curso">Curso</option></select></div><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Modalidad</label><select name="modalidad" value={nuevaOferta.modalidad} onChange={handleNuevaOfertaChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"><option value="Presencial">Presencial</option><option value="Online">Online</option><option value="Semipresencial">Semipresencial</option></select></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Duración</label><input type="text" name="duracion" value={nuevaOferta.duracion} onChange={handleNuevaOfertaChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Horario</label><input type="text" name="horario" value={nuevaOferta.horario} onChange={handleNuevaOfertaChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Fecha Inicio</label><input type="date" name="fechaInicio" value={nuevaOferta.fechaInicio} onChange={handleNuevaOfertaChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Fecha Cierre</label><input type="date" name="fechaFin" value={nuevaOferta.fechaFin} onChange={handleNuevaOfertaChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Lugar</label><input type="text" name="lugar" value={nuevaOferta.lugar} onChange={handleNuevaOfertaChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Cupos</label><input type="number" name="cupos" value={nuevaOferta.cupos} onChange={handleNuevaOfertaChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Facilitador</label><select name="facilitador" value={nuevaOferta.facilitador} onChange={handleFacilitadorSelectChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"><option value="">Seleccionar</option>{facilitadores.map(f => (<option key={f.id} value={f.name}>{f.name}</option>))}</select></div><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Institución</label><input type="text" name="institucion" value={nuevaOferta.institucion} onChange={handleNuevaOfertaChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div></div>
            <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Descripción</label><textarea name="descripcion" value={nuevaOferta.descripcion} onChange={handleNuevaOfertaChange} rows={2} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none" /></div>
            <div className="flex gap-3 pt-2"><button onClick={() => setShowEditarOfertaModal(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Cancelar</button><button onClick={handleEditarOferta} className="flex-1 py-3 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-[1.01] transition-all">Actualizar</button></div></div></motion.div></div>)}</AnimatePresence>

      {/* Modal Nuevo Facilitador */}
      <AnimatePresence>{showNuevoFacilitadorModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNuevoFacilitadorModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" /><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"><div className="p-4 border-b border-gray-50 flex items-center justify-between bg-brand-primary sticky top-0 z-10"><h4 className="text-base font-black text-white italic uppercase tracking-wider">Registrar Nuevo Facilitador</h4><button onClick={() => setShowNuevoFacilitadorModal(false)} className="p-1.5 rounded-xl bg-white/10 text-white hover:bg-white/20"><X className="h-3 w-3" /></button></div><div className="p-5 space-y-3"><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Nombre *</label><input type="text" name="nombre" value={nuevoFacilitador.nombre} onChange={handleNuevoFacilitadorChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Apellido *</label><input type="text" name="apellido" value={nuevoFacilitador.apellido} onChange={handleNuevoFacilitadorChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Cédula *</label><input type="text" name="cedula" value={nuevoFacilitador.cedula} onChange={handleNuevoFacilitadorChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Tipo</label><select name="tipoFacilitador" value={nuevoFacilitador.tipoFacilitador} onChange={handleNuevoFacilitadorChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"><option value="">Seleccionar</option><option value="personal">Personal - Funcionario</option><option value="institucion">Tutor por Institución</option></select></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Área *</label><input type="text" name="area" value={nuevoFacilitador.area} onChange={handleNuevoFacilitadorChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Especialidad *</label><input type="text" name="especialidad" value={nuevoFacilitador.especialidad} onChange={handleNuevoFacilitadorChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Email *</label><input type="email" name="email" value={nuevoFacilitador.email} onChange={handleNuevoFacilitadorChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Teléfono</label><input type="text" name="telefono" value={nuevoFacilitador.telefono} onChange={handleNuevoFacilitadorChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Experiencia</label><input type="text" name="experiencia" value={nuevoFacilitador.experiencia} onChange={handleNuevoFacilitadorChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Institución</label><input type="text" name="institucion" value={nuevoFacilitador.institucion} onChange={handleNuevoFacilitadorChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div></div><div className="flex gap-3 pt-2"><button onClick={() => setShowNuevoFacilitadorModal(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Cancelar</button><button onClick={handleGuardarFacilitador} className="flex-1 py-3 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-[1.01] transition-all">Registrar</button></div></div></motion.div></div>)}</AnimatePresence>

      {/* Modal Editar Facilitador */}
      <AnimatePresence>{showEditarFacilitadorModal && facilitadorEditando && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditarFacilitadorModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" /><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"><div className="p-4 border-b border-gray-50 flex items-center justify-between bg-brand-primary sticky top-0 z-10"><h4 className="text-base font-black text-white italic uppercase tracking-wider">Editar Facilitador</h4><button onClick={() => setShowEditarFacilitadorModal(false)} className="p-1.5 rounded-xl bg-white/10 text-white hover:bg-white/20"><X className="h-3 w-3" /></button></div><div className="p-5 space-y-3"><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Nombre *</label><input type="text" name="nombre" value={nuevoFacilitador.nombre} onChange={handleNuevoFacilitadorChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Apellido *</label><input type="text" name="apellido" value={nuevoFacilitador.apellido} onChange={handleNuevoFacilitadorChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Cédula *</label><input type="text" name="cedula" value={nuevoFacilitador.cedula} onChange={handleNuevoFacilitadorChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Tipo</label><select name="tipoFacilitador" value={nuevoFacilitador.tipoFacilitador} onChange={handleNuevoFacilitadorChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"><option value="">Seleccionar</option><option value="personal">Personal</option><option value="institucion">Tutor</option></select></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Área *</label><input type="text" name="area" value={nuevoFacilitador.area} onChange={handleNuevoFacilitadorChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Especialidad *</label><input type="text" name="especialidad" value={nuevoFacilitador.especialidad} onChange={handleNuevoFacilitadorChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Email *</label><input type="email" name="email" value={nuevoFacilitador.email} onChange={handleNuevoFacilitadorChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Teléfono</label><input type="text" name="telefono" value={nuevoFacilitador.telefono} onChange={handleNuevoFacilitadorChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Experiencia</label><input type="text" name="experiencia" value={nuevoFacilitador.experiencia} onChange={handleNuevoFacilitadorChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Institución</label><input type="text" name="institucion" value={nuevoFacilitador.institucion} onChange={handleNuevoFacilitadorChange} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div></div><div className="flex gap-3 pt-2"><button onClick={() => setShowEditarFacilitadorModal(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Cancelar</button><button onClick={handleActualizarFacilitador} className="flex-1 py-3 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-[1.01] transition-all">Actualizar</button></div></div></motion.div></div>)}</AnimatePresence>
{/* Modal Detalle Participante */}
      <AnimatePresence>{showParticipanteDetail && selectedParticipante && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowParticipanteDetail(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" /><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"><div className="p-5 border-b border-gray-100 flex items-center justify-between bg-linear-to-r from-brand-primary/10 to-brand-primary/5"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary text-xl font-black">{selectedParticipante.nombre[0]}{selectedParticipante.apellido[0]}</div><div><h4 className="text-lg font-black text-slate-800">{selectedParticipante.nombre} {selectedParticipante.apellido}</h4><p className="text-[10px] text-slate-500">{selectedParticipante.cedula}</p></div></div><button onClick={() => setShowParticipanteDetail(false)} className="p-1.5 rounded-xl bg-white/80 text-slate-500 hover:bg-white"><X className="h-4 w-4" /></button></div><div className="p-6 space-y-5"><div><h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Contacto</h5><div className="grid grid-cols-2 gap-4"><div><p className="text-[9px] text-slate-400">Teléfono</p><p className="text-xs font-bold">{selectedParticipante.telefono}</p></div><div><p className="text-[9px] text-slate-400">Email</p><p className="text-xs font-bold">{selectedParticipante.email}</p></div><div className="col-span-2"><p className="text-[9px] text-slate-400">Dirección</p><p className="text-xs font-bold">{selectedParticipante.direccion}</p></div></div></div><div><h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Ubicación</h5><div className="grid grid-cols-2 gap-4"><div><p className="text-[9px] text-slate-400">Comuna</p><p className="text-xs font-bold">{selectedParticipante.comuna}</p></div><div><p className="text-[9px] text-slate-400">Sector</p><p className="text-xs font-bold">{selectedParticipante.sector}</p></div></div></div><div><h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Cursos</h5>{selectedParticipante.cursosTomados.length > 0 ? <div className="space-y-2">{selectedParticipante.cursosTomados.map((c, idx) => (<div key={idx} className="flex justify-between p-3 bg-gray-50 rounded-xl"><div><p className="text-xs font-black">{c.nombre}</p><p className="text-[9px]">{c.fecha}</p></div><span className={cn("px-2 py-1 rounded-lg text-[8px] font-black uppercase", c.estado === "Completado" ? "bg-emerald-50 text-emerald-600" : c.estado === "En Curso" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600")}>{c.estado}</span></div>))}</div> : <p className="text-[10px] italic">Sin cursos</p>}</div><div className="pt-3 border-t"><p className="text-[8px] text-slate-400">Registrado el {selectedParticipante.fechaRegistro}</p></div></div></motion.div></div>)}</AnimatePresence>

    </div>
  );
};