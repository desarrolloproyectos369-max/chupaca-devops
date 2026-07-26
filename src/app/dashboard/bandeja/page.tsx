"use client";

import React, { useState, useEffect } from "react";
import { Inbox, Search, Eye, Download, FileText, AlertCircle, FileUp, Loader2, Send, UserPlus, Tag, Clock, CheckCircle, Flag, SlidersHorizontal, X, LayoutList, ListChecks } from "lucide-react";
import styles from "../../page.module.css";
import RichTextEditor from "@/components/RichTextEditor";
import { UserContext } from "../ClientLayout";
import Link from "next/link";

interface TipoDocumental {
  nombre: string;
  plazoDias: number;
}

interface Usuario {
  nombres: string;
  apellidos: string;
}

interface UnidadOrganica {
  id: number;
  nombre: string;
}

interface Anexo {
  id: number;
  nombreArchivo: string;
  archivoUrl: string;
  creadoEn: string;
  subidoPor: Usuario;
}

interface DerivacionHistorial {
  id: number;
  instrucciones: string | null;
  estado: string;
  creadoEn: string;
  origen: {
    nombres: string;
    apellidos: string;
    rol: { nombre: string; };
  };
  destinoUnidad: {
    nombre: string;
  } | null;
  destinoUsuario: {
    nombres: string;
    apellidos: string;
  } | null;
}

interface Expediente {
  id: number;
  codigo: string;
  asunto: string;
  folios: number;
  dniRemitente: string;
  nombresRemitente: string;
  apellidosRemitente: string;
  estado: string;
  prioridad?: string;
  archivoUrl: string | null;
  tipoDocumental: TipoDocumental;
  registrador: Usuario;
  creadoEn: string;
  derivaciones?: any[];
  esModificable?: boolean;
  asignadoAMi?: boolean;
  esSubsanable?: boolean;
  puedePriorizar?: boolean;
}

export default function BandejaPage() {
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [loading, setLoading] = useState(true);
  
  // RF-25: Búsqueda Avanzada
  const [searchTerm, setSearchTerm] = useState("");
  const [filtrosVisibles, setFiltrosVisibles] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState("");
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // RF-27: Bandeja Personalizada
  const [vistaActual, setVistaActual] = useState<"mis_pendientes" | "todos">("mis_pendientes");
  
  // Modal de Detalles
  const [selectedExpediente, setSelectedExpediente] = useState<Expediente | null>(null);
  
  // Visor PDF Integrado
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Gestión de Anexos
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [anexosLoading, setAnexosLoading] = useState(false);
  const [uploadingAnexo, setUploadingAnexo] = useState(false);

  // Derivación de Expediente (RF-14)
  const [unidades, setUnidades] = useState<UnidadOrganica[]>([]);
  const [derivarExpediente, setDerivarExpediente] = useState<Expediente | null>(null);
  const [derivacionDestino, setDerivacionDestino] = useState("");
  const [derivacionInstrucciones, setDerivacionInstrucciones] = useState("");
  const [derivando, setDerivando] = useState(false);

  // Reasignación Interna (RF-16)
  const [empleados, setEmpleados] = useState<{id: number, nombres: string, apellidos: string, rol: {nombre: string}}[]>([]);
  const [reasignarExpediente, setReasignarExpediente] = useState<Expediente | null>(null);
  const [reasignacionDestino, setReasignacionDestino] = useState("");
  const [reasignacionInstrucciones, setReasignacionInstrucciones] = useState("");
  const [reasignando, setReasignando] = useState(false);

  // Control de Estados (RF-17)
  const [estadoExpediente, setEstadoExpediente] = useState<Expediente | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [justificacionEstado, setJustificacionEstado] = useState("");
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  // Subsanación (RF-18)
  const [subsanarExpediente, setSubsanarExpediente] = useState<any | null>(null);
  const [subsanarForm, setSubsanarForm] = useState<{archivo: File | null; comentarios: string}>({ archivo: null, comentarios: "" });
  const [isLoading, setIsLoading] = useState(false);

  // Notificaciones Personalizadas
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Historial de Movimientos (RF-15)
  const [historial, setHistorial] = useState<DerivacionHistorial[]>([]);
  const [historialLoading, setHistorialLoading] = useState(false);

  // Redacción de Proveídos y Respuestas (RF-21)
  const [redactarExpediente, setRedactarExpediente] = useState<Expediente | null>(null);
  const [documentosInternos, setDocumentosInternos] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [redactarForm, setRedactarForm] = useState({ tipo: "PROVEIDO", contenido: "" });
  const [redactando, setRedactando] = useState(false);

  // Aprobaciones V°B° (RF-22)
  const currentUser = React.useContext(UserContext);
  const [observarDocumentoId, setObservarDocumentoId] = useState<number | null>(null);
  const [observacionesVb, setObservacionesVb] = useState("");
  const [aprobandoDocs, setAprobandoDocs] = useState<Record<number, boolean>>({});
  const [firmarModalId, setFirmarModalId] = useState<number | null>(null);

  const fetchExpedientes = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setIsSearching(true);
      
      const params = new URLSearchParams();
      params.append("vista", vistaActual);
      if (searchTerm) params.append("q", searchTerm);
      if (filtroEstado) params.append("estado", filtroEstado);
      if (filtroPrioridad) params.append("prioridad", filtroPrioridad);
      if (filtroFechaDesde) params.append("fechaDesde", filtroFechaDesde);
      if (filtroFechaHasta) params.append("fechaHasta", filtroFechaHasta);

      const res = await fetch(`/api/expedientes?${params.toString()}`);
      if (!res.ok) throw new Error("Error fetching expedientes");
      const data = await res.json();
      setExpedientes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchExpedientes();
  }, [vistaActual]); // Reload when tab changes

  useEffect(() => {
    fetchUnidades();
    fetchEmpleados();
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchExpedientes();
  };

  const fetchUnidades = async () => {
    try {
      const res = await fetch("/api/unidades");
      if (res.ok) {
        setUnidades(await res.json());
      }
    } catch (e) {
      console.error("Error cargando unidades", e);
    }
  };

  const fetchEmpleados = async () => {
    try {
      const res = await fetch("/api/usuarios/mi-area");
      if (res.ok) {
        const data = await res.json();
        const filtrados = (data.empleados || []).filter((e: any) => e.id !== data.miId);
        setEmpleados(filtrados);
      }
    } catch (e) {
      console.error("Error cargando empleados", e);
    }
  };

  useEffect(() => {
    if (selectedExpediente) {
      fetchAnexos(selectedExpediente.id);
      fetchHistorial(selectedExpediente.id);
      fetchDocumentosInternos(selectedExpediente.id);
    } else {
      setAnexos([]);
      setHistorial([]);
      setDocumentosInternos([]);
    }
  }, [selectedExpediente]);

  const fetchDocumentosInternos = async (expedienteId: number) => {
    setDocsLoading(true);
    try {
      const res = await fetch(`/api/expedientes/${expedienteId}/documentos`);
      if (res.ok) {
        setDocumentosInternos(await res.json());
      }
    } catch (err) {
      console.error("Error al cargar documentos internos", err);
    } finally {
      setDocsLoading(false);
    }
  };

  const fetchHistorial = async (expedienteId: number) => {
    setHistorialLoading(true);
    try {
      const res = await fetch(`/api/expedientes/${expedienteId}/historial`);
      if (res.ok) {
        setHistorial(await res.json());
      }
    } catch (err) {
      console.error("Error al cargar historial", err);
    } finally {
      setHistorialLoading(false);
    }
  };

  const fetchAnexos = async (expedienteId: number) => {
    setAnexosLoading(true);
    try {
      const res = await fetch(`/api/expedientes/${expedienteId}/anexos`);
      if (res.ok) {
        const data = await res.json();
        setAnexos(data);
      }
    } catch (err) {
      console.error("Error al cargar anexos", err);
    } finally {
      setAnexosLoading(false);
    }
  };

  const handleSubirAnexo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedExpediente || !e.target.files || e.target.files.length === 0) return;
    const archivo = e.target.files[0];
    
    if (archivo.type !== "application/pdf") {
      setNotification({ message: "Solo se permiten archivos PDF", type: "error" });
      e.target.value = "";
      return;
    }

    setUploadingAnexo(true);
    const formData = new FormData();
    formData.append("archivo", archivo);

    try {
      const res = await fetch(`/api/expedientes/${selectedExpediente.id}/anexos`, {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        fetchAnexos(selectedExpediente.id);
        setNotification({ message: "Anexo subido con éxito", type: "success" });
      } else {
        const data = await res.json();
        setNotification({ message: data.error || "Error al subir anexo", type: "error" });
      }
    } catch (err) {
      setNotification({ message: "Error de conexión", type: "error" });
    } finally {
      setUploadingAnexo(false);
      e.target.value = ""; 
    }
  };

  const handleRedactarDocumento = async () => {
    if (!redactarExpediente || !redactarForm.contenido || !redactarForm.tipo) return;
    
    setRedactando(true);
    try {
      const res = await fetch(`/api/expedientes/${redactarExpediente.id}/documentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(redactarForm)
      });

      if (res.ok) {
        setNotification({ message: "Documento redactado con éxito", type: "success" });
        setRedactarExpediente(null);
        setRedactarForm({ tipo: "PROVEIDO", contenido: "" });
        if (selectedExpediente?.id === redactarExpediente.id) {
          fetchDocumentosInternos(selectedExpediente.id);
        }
      } else {
        const data = await res.json();
        setNotification({ message: data.error || "Error al guardar documento", type: "error" });
      }
    } catch (err) {
      setNotification({ message: "Error de conexión", type: "error" });
    } finally {
      setRedactando(false);
    }
  };

  const handleAprobarDocumento = async (docId: number, accion: 'APROBAR' | 'OBSERVAR') => {
    if (!selectedExpediente) return;
    
    setAprobandoDocs(prev => ({ ...prev, [docId]: true }));
    try {
      const res = await fetch(`/api/expedientes/${selectedExpediente.id}/documentos/${docId}/aprobar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion, observaciones: accion === 'OBSERVAR' ? observacionesVb : null })
      });

      if (res.ok) {
        setNotification({ message: accion === 'APROBAR' ? "Documento aprobado con éxito" : "Documento observado", type: "success" });
        if (accion === 'OBSERVAR') {
          setObservarDocumentoId(null);
          setObservacionesVb("");
        }
        fetchDocumentosInternos(selectedExpediente.id);
      } else {
        const data = await res.json();
        setNotification({ message: data.error || "Error al procesar acción", type: "error" });
      }
    } catch (err) {
      setNotification({ message: "Error de conexión", type: "error" });
    } finally {
      setAprobandoDocs(prev => ({ ...prev, [docId]: false }));
    }
  };

  const executeFirmarDocumento = async () => {
    if (!selectedExpediente || firmarModalId === null) return;
    const docId = firmarModalId;
    setFirmarModalId(null); // Cerrar modal

    setAprobandoDocs(prev => ({ ...prev, [docId]: true }));
    try {
      const res = await fetch(`/api/expedientes/${selectedExpediente.id}/documentos/${docId}/firmar`, {
        method: "POST",
      });

      if (!res.ok) {
        const errorData = await res.json();
        setNotification({ message: errorData.error || "Error al firmar", type: "error" });
        return;
      }

      setNotification({ message: "Documento firmado digitalmente y emitido", type: "success" });
      
      const docRes = await fetch(`/api/expedientes/${selectedExpediente.id}/documentos`);
      if (docRes.ok) {
        const docData = await docRes.json();
        setDocumentosInternos(docData);
      }
      fetchExpedientes(true);
    } catch (e) {
      console.error(e);
      setNotification({ message: "Error al firmar el documento", type: "error" });
    } finally {
      setAprobandoDocs(prev => ({ ...prev, [docId]: false }));
    }
  };

  const handleDerivar = async () => {
    if (!derivarExpediente || !derivacionDestino) return;
    
    setDerivando(true);
    try {
      const res = await fetch(`/api/expedientes/${derivarExpediente.id}/derivar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          destinoUnidadId: derivacionDestino,
          instrucciones: derivacionInstrucciones
        })
      });
      
      if (res.ok) {
        setDerivarExpediente(null);
        setDerivacionDestino("");
        setDerivacionInstrucciones("");
        fetchExpedientes();
        setNotification({ message: "¡Expediente derivado exitosamente!", type: "success" });
      } else {
        const data = await res.json();
        setNotification({ message: data.error || "Error al derivar el expediente", type: "error" });
      }
    } catch (e) {
      setNotification({ message: "Error de conexión", type: "error" });
    } finally {
      setDerivando(false);
    }
  };

  const handleReasignar = async () => {
    if (!reasignarExpediente || !reasignacionDestino) return;
    
    setReasignando(true);
    try {
      const res = await fetch(`/api/expedientes/${reasignarExpediente.id}/reasignar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          destinoUsuarioId: reasignacionDestino,
          instrucciones: reasignacionInstrucciones
        })
      });
      
      if (res.ok) {
        setReasignarExpediente(null);
        setReasignacionDestino("");
        setReasignacionInstrucciones("");
        fetchExpedientes();
        setNotification({ message: "¡Expediente reasignado al personal exitosamente!", type: "success" });
      } else {
        const data = await res.json();
        setNotification({ message: data.error || "Error al reasignar", type: "error" });
      }
    } catch (e) {
      setNotification({ message: "Error de conexión", type: "error" });
    } finally {
      setReasignando(false);
    }
  };

  const handleArchivar = async (expedienteId: number, desarchivar: boolean = false) => {
    if (!confirm(desarchivar ? "¿Estás seguro de desarchivar este expediente?" : "¿Estás seguro de archivar y cerrar definitivamente este expediente?")) return;
    
    try {
      const res = await fetch(`/api/expedientes/${expedienteId}/archivar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desarchivar })
      });
      
      const data = await res.json();
      if (!res.ok) {
        setNotification({ message: data.error || "Error al modificar el estado", type: "error" });
      } else {
        setNotification({ message: data.message || "Expediente actualizado", type: "success" });
        if (selectedExpediente && selectedExpediente.id === expedienteId) {
          setSelectedExpediente({...selectedExpediente, estado: desarchivar ? "EN_PROCESO" : "ARCHIVADO"});
        }
        fetchExpedientes(true);
      }
    } catch (error) {
      setNotification({ message: "Error de red", type: "error" });
    }
  };

  const handleCambiarEstado = async () => {
    if (!estadoExpediente || !nuevoEstado) return;
    
    setCambiandoEstado(true);
    try {
      const res = await fetch(`/api/expedientes/${estadoExpediente.id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          estado: nuevoEstado, 
          justificacion: justificacionEstado 
        })
      });
      
      if (res.ok) {
        setEstadoExpediente(null);
        setNuevoEstado("");
        setJustificacionEstado("");
        fetchExpedientes();
        setNotification({ message: "¡Estado actualizado exitosamente!", type: "success" });
      } else {
        const data = await res.json();
        setNotification({ message: data.error || "Error al cambiar estado", type: "error" });
      }
    } catch (e) {
      setNotification({ message: "Error de conexión", type: "error" });
    } finally {
      setCambiandoEstado(false);
    }
  };

  const handleSubmitSubsanar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subsanarExpediente || !subsanarForm.archivo) return;
    setIsLoading(true);
    try {
        const formData = new FormData();
        formData.append("archivo", subsanarForm.archivo);
        formData.append("comentarios", subsanarForm.comentarios);
        const res = await fetch(`/api/expedientes/${subsanarExpediente.id}/subsanar`, { method: "POST", body: formData });
        if (res.ok) {
            setSubsanarExpediente(null);
            fetchExpedientes();
            setNotification({ message: "Subsanación enviada correctamente", type: "success" });
        }
    } finally {
        setIsLoading(false);
    }
  };

  const getStatusStyle = (estado: string) => {
    switch(estado) {
      case 'REGISTRADO': return { bg: '#dcfce7', text: '#166534' };
      case 'EN_PROCESO': return { bg: '#fef3c7', text: '#b45309' };
      case 'OBSERVADO': return { bg: '#fee2e2', text: '#b91c1c' };
      case 'FINALIZADO': return { bg: '#dbeafe', text: '#1e3a8a' };
      case 'ARCHIVADO': return { bg: '#f1f5f9', text: '#475569' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  const togglePrioridad = async (exp: Expediente) => {
    if (!exp.puedePriorizar) return;

    let nuevaPrioridad = "NORMAL";
    if (!exp.prioridad || exp.prioridad === "NORMAL") nuevaPrioridad = "ALTA";
    else if (exp.prioridad === "ALTA") nuevaPrioridad = "URGENTE";
    else nuevaPrioridad = "NORMAL";

    setExpedientes(prev => prev.map(e => e.id === exp.id ? { ...e, prioridad: nuevaPrioridad } : e));

    try {
      const res = await fetch(`/api/expedientes/${exp.id}/prioridad`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prioridad: nuevaPrioridad })
      });
      if (!res.ok) {
        throw new Error("Failed");
      }
    } catch (error) {
      fetchExpedientes(true);
      console.error("Error al cambiar prioridad:", error);
    }
  };

  const calcularSemaforo = (creadoEn: string, plazoDias: number, estado: string) => {
    if (estado === 'FINALIZADO' || estado === 'ARCHIVADO') {
      return { status: 'COMPLETED', label: 'Completado', color: '#64748b', bg: '#f1f5f9', icon: <CheckCircle size={14} /> };
    }

    const fechaCreacion = new Date(creadoEn);
    const hoy = new Date();
    const msPorDia = 1000 * 60 * 60 * 24;
    const diasTranscurridos = Math.floor((hoy.getTime() - fechaCreacion.getTime()) / msPorDia);
    const diasRestantes = plazoDias - diasTranscurridos;

    if (diasRestantes < 0) {
      return { status: 'DANGER', label: `Vencido hace ${Math.abs(diasRestantes)} d`, color: '#b91c1c', bg: '#fef2f2', icon: <AlertCircle size={14} /> };
    } else if (diasRestantes <= 5) {
      return { status: 'WARNING', label: `Vence en ${diasRestantes} d`, color: '#b45309', bg: '#fffbeb', icon: <Clock size={14} /> };
    } else {
      return { status: 'GOOD', label: `Quedan ${diasRestantes} d`, color: '#15803d', bg: '#f0fdf4', icon: <Clock size={14} /> };
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--primary)", fontSize: "1.75rem", marginBottom: "0.5rem" }}>
            <Inbox size={28} />
            Mi Bandeja de Expedientes
          </h1>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>Gestión y enrutamiento de documentos ingresados</p>
        </div>
        
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: "300px", maxWidth: "500px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "white", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "0.5rem 1rem", flex: 1 }}>
            <Search size={18} style={{ color: "var(--text-muted)" }} />
            <input 
              type="text" 
              placeholder="Buscar por código, DNI o asunto..." 
              style={{ border: "none", outline: "none", width: "100%", fontSize: "0.875rem" }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            type="button"
            onClick={() => setFiltrosVisibles(!filtrosVisibles)}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", backgroundColor: filtrosVisibles ? "var(--primary)" : "white", color: filtrosVisibles ? "white" : "var(--primary)", border: `1px solid var(--primary)`, borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, transition: "all 0.2s" }}
          >
            <SlidersHorizontal size={18} />
            Filtros
          </button>
          <button 
            type="submit"
            disabled={isSearching}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0.5rem 1.25rem", backgroundColor: "var(--primary)", color: "white", border: "none", borderRadius: "var(--radius-md)", cursor: isSearching ? "not-allowed" : "pointer", fontSize: "0.875rem", fontWeight: 600, opacity: isSearching ? 0.7 : 1 }}
          >
            {isSearching ? <Loader2 size={18} className="spin" /> : "Buscar"}
          </button>
        </form>
      </div>

      {/* RF-27: Tabs de Vistas */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid var(--border-color)" }}>
        <button
          onClick={() => setVistaActual("mis_pendientes")}
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", backgroundColor: "transparent",
            border: "none", borderBottom: vistaActual === "mis_pendientes" ? "2px solid var(--primary)" : "2px solid transparent",
            color: vistaActual === "mis_pendientes" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: vistaActual === "mis_pendientes" ? 600 : 500, fontSize: "0.875rem", cursor: "pointer", transition: "all 0.2s"
          }}
        >
          <ListChecks size={18} />
          Mis Pendientes
        </button>
        <button
          onClick={() => setVistaActual("todos")}
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", backgroundColor: "transparent",
            border: "none", borderBottom: vistaActual === "todos" ? "2px solid var(--primary)" : "2px solid transparent",
            color: vistaActual === "todos" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: vistaActual === "todos" ? 600 : 500, fontSize: "0.875rem", cursor: "pointer", transition: "all 0.2s"
          }}
        >
          <LayoutList size={18} />
          Todos los Expedientes
        </button>
      </div>

      {/* Panel de Filtros Avanzados (RF-25) */}
      {filtrosVisibles && (
        <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", marginBottom: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", animation: "fadeIn 0.2s ease-out" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-color)" }}>Estado del Documento</label>
            <select 
              value={filtroEstado} 
              onChange={(e) => setFiltroEstado(e.target.value)}
              style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.875rem", outline: "none" }}
            >
              <option value="">Todos los estados</option>
              <option value="REGISTRADO">Registrado</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="OBSERVADO">Observado</option>
              <option value="FINALIZADO">Finalizado</option>
              <option value="ARCHIVADO">Archivado</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-color)" }}>Nivel de Prioridad</label>
            <select 
              value={filtroPrioridad} 
              onChange={(e) => setFiltroPrioridad(e.target.value)}
              style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.875rem", outline: "none" }}
            >
              <option value="">Cualquier prioridad</option>
              <option value="NORMAL">Normal</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-color)" }}>Fecha Desde</label>
            <input 
              type="date" 
              value={filtroFechaDesde}
              onChange={(e) => setFiltroFechaDesde(e.target.value)}
              style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.875rem", outline: "none" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-color)" }}>Fecha Hasta</label>
            <input 
              type="date" 
              value={filtroFechaHasta}
              onChange={(e) => setFiltroFechaHasta(e.target.value)}
              style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.875rem", outline: "none" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
            <button 
              onClick={() => {
                setFiltroEstado("");
                setFiltroPrioridad("");
                setFiltroFechaDesde("");
                setFiltroFechaHasta("");
                setSearchTerm("");
                setTimeout(() => handleSearchSubmit(), 0);
              }}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1rem", backgroundColor: "transparent", color: "var(--text-muted)", border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 }}
            >
              <X size={16} />
              Limpiar Filtros
            </button>
          </div>
        </div>
      )}

      <div className="solid-panel" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "950px" }}>
          <thead style={{ backgroundColor: "rgba(0,0,0,0.02)", borderBottom: "1px solid var(--border-color)" }}>
            <tr>
              <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", color: "var(--text-muted)", width: "130px" }}>Código</th>
              <th style={{ padding: "1rem", textAlign: "center", fontSize: "0.875rem", color: "var(--text-muted)", width: "80px" }}>Prioridad</th>
              <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", color: "var(--text-muted)", width: "120px" }}>Ingreso</th>
              <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", color: "var(--text-muted)" }}>Documento y Asunto</th>
              <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", color: "var(--text-muted)" }}>Vencimiento</th>
              <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", color: "var(--text-muted)", width: "180px" }}>Remitente</th>
              <th style={{ padding: "1rem", textAlign: "center", fontSize: "0.875rem", color: "var(--text-muted)", width: "130px" }}>Estado</th>
              <th style={{ padding: "1rem", textAlign: "right", fontSize: "0.875rem", color: "var(--text-muted)", width: "150px" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && expedientes.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Cargando expedientes...</td></tr>
            ) : expedientes.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
                  <AlertCircle size={40} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
                  <div>No se encontraron expedientes en la bandeja.</div>
                </td>
              </tr>
            ) : (
              expedientes.map((exp) => {
                const statusStyle = getStatusStyle(exp.estado);
                const fecha = new Date(exp.creadoEn).toLocaleDateString("es-PE", { day: '2-digit', month: '2-digit', year: 'numeric' });
                const hora = new Date(exp.creadoEn).toLocaleTimeString("es-PE", { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <tr key={exp.id} style={{ 
                    borderBottom: "1px solid var(--border-color)",
                    backgroundColor: exp.prioridad === "URGENTE" ? "#fef2f2" : exp.prioridad === "ALTA" ? "#fefce8" : "transparent"
                  }}>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 700, color: "var(--primary)", whiteSpace: "nowrap" }}>{exp.codigo}</div>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      <button 
                        onClick={() => togglePrioridad(exp)}
                        disabled={!exp.puedePriorizar}
                        style={{
                          background: "none", border: "none", cursor: exp.puedePriorizar ? "pointer" : "default",
                          padding: "0.2rem", display: "inline-flex", alignItems: "center", justifyContent: "center", opacity: exp.prioridad === "NORMAL" || !exp.prioridad ? 0.3 : 1
                        }}
                        title={exp.puedePriorizar ? `Cambiar prioridad (Actual: ${exp.prioridad || "NORMAL"})` : `Prioridad: ${exp.prioridad || "NORMAL"}`}
                      >
                        <Flag size={18} fill={exp.prioridad === "URGENTE" ? "#ef4444" : exp.prioridad === "ALTA" ? "#eab308" : "transparent"} color={exp.prioridad === "URGENTE" ? "#ef4444" : exp.prioridad === "ALTA" ? "#eab308" : "#64748b"} />
                      </button>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 500 }}>{fecha}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{hora}</div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                        {exp.tipoDocumental.nombre}
                      </div>
                      <div style={{ fontSize: "0.875rem", marginTop: "0.25rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {exp.asunto}
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.5rem" }}>
                        <FileText size={14} />
                        {exp.folios} Folios
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {exp.tipoDocumental && (
                        (() => {
                          const semaforo = calcularSemaforo(exp.creadoEn, exp.tipoDocumental.plazoDias, exp.estado);
                          return (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.75rem", borderRadius: "var(--radius-full)", backgroundColor: semaforo.bg, color: semaforo.color, fontSize: "0.75rem", fontWeight: 700 }}>
                              {semaforo.icon}
                              {semaforo.label}
                            </div>
                          );
                        })()
                      )}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{exp.nombresRemitente}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>DNI: {exp.dniRemitente}</div>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      <span style={{ 
                        padding: "0.25rem 0.75rem", 
                        backgroundColor: statusStyle.bg, 
                        color: statusStyle.text, 
                        borderRadius: "var(--radius-full)", 
                        fontSize: "0.75rem", 
                        fontWeight: 700 
                      }}>
                        {exp.estado}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                        {exp.archivoUrl && (
                          <button 
                            onClick={() => setPreviewUrl(exp.archivoUrl)}
                            title="Previsualizar Documento Principal"
                            style={{ background: "#e0f2fe", border: "none", color: "#0369a1", cursor: "pointer", padding: "0.5rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <FileText size={16} />
                          </button>
                        )}
                        
                        {exp.esModificable && exp.estado !== 'OBSERVADO' && exp.estado !== 'ARCHIVADO' && (
                          <>
                            <button 
                              title="Derivar a Área" 
                              onClick={() => setDerivarExpediente(exp)}
                              style={{ background: "#fef3c7", border: "none", color: "#d97706", cursor: "pointer", padding: "0.5rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <Send size={16} />
                            </button>

                            <button 
                              title="Reasignar a otra persona"
                              onClick={() => setReasignarExpediente(exp)}
                              style={{ background: "#f3e8ff", border: "none", color: "#7e22ce", cursor: "pointer", padding: "0.5rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <UserPlus size={16} />
                            </button>
                            
                            <button 
                              title="Redactar Proveído o Respuesta"
                              onClick={() => setRedactarExpediente(exp)}
                              style={{ background: "#e0e7ff", border: "none", color: "#4f46e5", cursor: "pointer", padding: "0.5rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <FileText size={16} />
                            </button>

                            <button 
                              title="Cambiar Estado (RF-17)" 
                              onClick={() => setEstadoExpediente(exp)}
                              style={{ background: "#d1fae5", border: "none", color: "#059669", cursor: "pointer", padding: "0.5rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <SlidersHorizontal size={16} />
                            </button>
                          </>
                        )}
                        {exp.esSubsanable && (
                          <button 
                            title="Subsanar Observación (RF-18)" 
                            onClick={() => setSubsanarExpediente(exp)}
                            style={{ background: "#fee2e2", border: "none", color: "#dc2626", cursor: "pointer", padding: "0.5rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <AlertCircle size={16} />
                          </button>
                        )}
                        {exp.estado === 'ARCHIVADO' && (currentUser?.rol === "ADMINISTRADOR" || currentUser?.rol === "Administrador funcional") && (
                          <button 
                            title="Desarchivar Expediente (Admin)" 
                            onClick={() => handleArchivar(exp.id, true)}
                            style={{ background: "#f59e0b", border: "none", color: "white", cursor: "pointer", padding: "0.5rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <UserPlus size={16} />
                          </button>
                        )}

                        <button 
                          title="Ver Detalles y Anexos" 
                          onClick={() => setSelectedExpediente(exp)}
                          style={{ background: "#f0fdf4", border: "none", color: "#166534", cursor: "pointer", padding: "0.5rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: Derivación de Expediente (RF-14) */}
      {derivarExpediente && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="solid-panel" style={{ width: "100%", maxWidth: "500px", padding: "2rem", position: "relative" }}>
            <h2 style={{ fontSize: "1.25rem", color: "var(--text-main)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Send size={20} color="var(--primary)" /> Derivar Expediente
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
              Ruta de documento para: <strong>{derivarExpediente.codigo}</strong>
            </p>

            <div className={styles.formGroup}>
              <label className={styles.label}>Área de Destino (Unidad Orgánica)</label>
              <select 
                className={styles.input} 
                value={derivacionDestino} 
                onChange={(e) => setDerivacionDestino(e.target.value)}
                disabled={derivando}
              >
                <option value="">-- Seleccionar Área --</option>
                {unidades.map(u => (
                  <option key={u.id} value={u.id}>{u.nombre}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Instrucciones (Opcional)</label>
              <textarea 
                className={styles.input} 
                rows={3} 
                placeholder="Ej: Para su evaluación técnica y emisión de informe correspondiente..."
                value={derivacionInstrucciones}
                onChange={(e) => setDerivacionInstrucciones(e.target.value)}
                disabled={derivando}
              ></textarea>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "2rem" }}>
              <button 
                onClick={() => setDerivarExpediente(null)} 
                className={styles.btnSecondary} 
                style={{ width: "auto", padding: "0.6rem 1.5rem", margin: 0 }}
                disabled={derivando}
              >
                Cancelar
              </button>
              <button 
                onClick={handleDerivar} 
                className={styles.btnPrimary} 
                style={{ width: "auto", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.5rem", margin: 0 }}
                disabled={!derivacionDestino || derivando}
              >
                {derivando ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                {derivando ? "Enviando..." : "Confirmar Derivación"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1.5: Reasignación Interna (RF-16) */}
      {reasignarExpediente && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="solid-panel" style={{ width: "100%", maxWidth: "500px", padding: "2rem", position: "relative" }}>
            <h2 style={{ fontSize: "1.25rem", color: "var(--text-main)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <UserPlus size={20} color="#9333ea" /> {reasignarExpediente.asignadoAMi ? "Transferir Expediente" : "Reasignar Expediente"}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
              {reasignarExpediente.asignadoAMi ? "Transferir" : "Asignar"} documento: <strong>{reasignarExpediente.codigo}</strong> a un compañero del área.
            </p>

            <div className={styles.formGroup}>
              <label className={styles.label}>Seleccionar Personal (Trabajador)</label>
              <select 
                className={styles.input} 
                value={reasignacionDestino} 
                onChange={(e) => setReasignacionDestino(e.target.value)}
                disabled={reasignando}
              >
                <option value="">-- Seleccionar Trabajador --</option>
                {empleados.map(e => (
                  <option key={e.id} value={e.id}>{e.nombres} {e.apellidos} ({e.rol.nombre})</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Instrucciones / Observaciones</label>
              <textarea 
                className={styles.input} 
                rows={3} 
                placeholder="Ej: Encárgate de evaluar la parte técnica de este documento..."
                value={reasignacionInstrucciones}
                onChange={(e) => setReasignacionInstrucciones(e.target.value)}
                disabled={reasignando}
              ></textarea>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "2rem" }}>
              <button 
                onClick={() => setReasignarExpediente(null)} 
                className={styles.btnSecondary} 
                style={{ width: "auto", padding: "0.6rem 1.5rem", margin: 0 }}
                disabled={reasignando}
              >
                Cancelar
              </button>
              <button 
                onClick={handleReasignar} 
                className={styles.btnPrimary} 
                style={{ width: "auto", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.5rem", margin: 0, backgroundColor: "#9333ea", borderColor: "#9333ea" }}
                disabled={!reasignacionDestino || reasignando}
              >
                {reasignando ? <Loader2 size={16} className="spin" /> : <UserPlus size={16} />}
                {reasignando ? "Asignando..." : "Confirmar Asignación"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1.7: Control de Estados (RF-17) */}
      {estadoExpediente && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="solid-panel" style={{ width: "100%", maxWidth: "500px", padding: "2rem", position: "relative" }}>
            <h2 style={{ fontSize: "1.25rem", color: "var(--text-main)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Tag size={20} color="#0f766e" /> Cambiar Estado del Trámite
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
              Modificando el estado actual del expediente: <strong>{estadoExpediente.codigo}</strong>
            </p>

            <div className={styles.formGroup}>
              <label className={styles.label}>Nuevo Estado</label>
              <select 
                className={styles.input} 
                value={nuevoEstado} 
                onChange={(e) => setNuevoEstado(e.target.value)}
                disabled={cambiandoEstado}
              >
                <option value="">-- Seleccionar Estado --</option>
                <option value="EN_PROCESO">En Proceso (Trabajando)</option>
                <option value="OBSERVADO">Observado (Falta información)</option>
                <option value="FINALIZADO">Finalizado (Resuelto exitosamente)</option>
                <option value="ARCHIVADO">Archivado (Cerrado sin acción)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Justificación / Motivo (Opcional)</label>
              <textarea 
                className={styles.input} 
                rows={3} 
                placeholder="Ej: Trámite concluido, se emitió resolución..."
                value={justificacionEstado}
                onChange={(e) => setJustificacionEstado(e.target.value)}
                disabled={cambiandoEstado}
              ></textarea>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "2rem" }}>
              <button 
                onClick={() => setEstadoExpediente(null)} 
                className={styles.btnSecondary} 
                style={{ width: "auto", padding: "0.6rem 1.5rem", margin: 0 }}
                disabled={cambiandoEstado}
              >
                Cancelar
              </button>
              <button 
                onClick={handleCambiarEstado} 
                className={styles.btnPrimary} 
                style={{ width: "auto", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.5rem", margin: 0, backgroundColor: "#0f766e", borderColor: "#0f766e" }}
                disabled={!nuevoEstado || cambiandoEstado}
              >
                {cambiandoEstado ? <Loader2 size={16} className="spin" /> : <Tag size={16} />}
                {cambiandoEstado ? "Guardando..." : "Actualizar Estado"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUBSANAR (RF-18) */}
      {subsanarExpediente && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="solid-panel" style={{ width: "100%", maxWidth: "500px", padding: "2rem", position: "relative" }}>
            <h2 style={{ fontSize: "1.25rem", color: "var(--text-main)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertCircle size={20} color="#dc2626" /> Subsanar Observación
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
              Adjuntar subsanación para el expediente: <strong>{subsanarExpediente.codigo}</strong>
            </p>

            <form onSubmit={handleSubmitSubsanar}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Documento de Subsanación (PDF) *</label>
                <input 
                  type="file" 
                  accept="application/pdf"
                  className={styles.input}
                  onChange={(e) => setSubsanarForm({...subsanarForm, archivo: e.target.files ? e.target.files[0] : null})}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Comentarios / Detalles</label>
                <textarea 
                  className={styles.input}
                  value={subsanarForm.comentarios}
                  onChange={(e) => setSubsanarForm({...subsanarForm, comentarios: e.target.value})}
                  placeholder="Se adjunta el DNI actualizado que faltaba..."
                  rows={3}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "2rem" }}>
                <button 
                  type="button" 
                  onClick={() => setSubsanarExpediente(null)}
                  className={styles.btnSecondary}
                  style={{ width: "auto", margin: 0 }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={styles.btnPrimary}
                  disabled={isLoading || !subsanarForm.archivo}
                  style={{ width: "auto", margin: 0, backgroundColor: "#dc2626", borderColor: "#dc2626" }}
                >
                  {isLoading ? "Subsanando..." : "Confirmar Subsanación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REDACTAR DOCUMENTO (RF-21) */}
      {redactarExpediente && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="solid-panel" style={{ width: "100%", maxWidth: "800px", padding: "2rem", position: "relative" }}>
            <h2 style={{ fontSize: "1.25rem", color: "var(--text-main)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FileText size={20} color="var(--primary)" /> Redactar Documento Interno
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
              Redactando para el expediente: <strong>{redactarExpediente.codigo}</strong>
            </p>

            <div className={styles.formGroup}>
              <label className={styles.label}>Tipo de Documento</label>
              <select 
                className={styles.input} 
                value={redactarForm.tipo} 
                onChange={(e) => setRedactarForm({...redactarForm, tipo: e.target.value})}
                disabled={redactando}
              >
                <option value="PROVEIDO">Proveído</option>
                <option value="INFORME">Informe Técnico / Legal</option>
                <option value="RESPUESTA_CIUDADANO">Respuesta al Ciudadano (Carta/Oficio)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Contenido del Documento</label>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <RichTextEditor 
                  content={redactarForm.contenido}
                  onChange={(html) => setRedactarForm({...redactarForm, contenido: html})}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "2rem" }}>
              <button 
                onClick={() => setRedactarExpediente(null)} 
                className={styles.btnSecondary} 
                style={{ width: "auto", padding: "0.6rem 1.5rem", margin: 0 }}
                disabled={redactando}
              >
                Cancelar
              </button>
              <button 
                onClick={handleRedactarDocumento} 
                className={styles.btnPrimary} 
                style={{ width: "auto", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.5rem", margin: 0 }}
                disabled={!redactarForm.contenido || redactarForm.contenido === '<p></p>' || redactando}
              >
                {redactando ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                {redactando ? "Guardando..." : "Guardar Documento"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Detalles del Expediente (con RF-12 Anexos) */}
      {selectedExpediente && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="solid-panel" style={{ width: "100%", maxWidth: "800px", padding: "2rem", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
            <button 
              onClick={() => setSelectedExpediente(null)}
              style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}
            >
              ×
            </button>
            
            <h2 style={{ fontSize: "1.25rem", color: "var(--text-main)", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Detalles del Expediente: <span style={{ color: "var(--primary)" }}>{selectedExpediente.codigo}</span></span>
              <div style={{ display: "flex", gap: "0.5rem", paddingRight: "2rem" }}>
                {selectedExpediente.estado !== 'ARCHIVADO' && (
                  <button 
                    onClick={() => handleArchivar(selectedExpediente.id)}
                    style={{ background: "#475569", border: "none", color: "white", cursor: "pointer", padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 600 }}
                  >
                    <CheckCircle size={16} />
                    Archivar Expediente
                  </button>
                )}
                {selectedExpediente.estado === 'ARCHIVADO' && (currentUser?.rol === "ADMINISTRADOR" || currentUser?.rol === "Administrador funcional") && (
                  <button 
                    onClick={() => handleArchivar(selectedExpediente.id, true)}
                    style={{ background: "#f59e0b", border: "none", color: "white", cursor: "pointer", padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 600 }}
                  >
                    <UserPlus size={16} />
                    Desarchivar (Admin)
                  </button>
                )}
              </div>
            </h2>
            {selectedExpediente.estado === 'ARCHIVADO' && (
              <div style={{ padding: "1rem", backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "var(--radius-md)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem", color: "#475569" }}>
                <AlertCircle size={20} />
                <span><strong>Este expediente se encuentra ARCHIVADO.</strong> No se pueden realizar modificaciones ni adjuntar nuevos documentos.</span>
              </div>
            )}

            {/* Panel de Vencimiento (RF-19) */}
            {selectedExpediente.tipoDocumental && (
              (() => {
                const semaforo = calcularSemaforo(selectedExpediente.creadoEn, selectedExpediente.tipoDocumental.plazoDias, selectedExpediente.estado);
                return (
                  <div style={{ padding: "1rem", borderRadius: "var(--radius-md)", backgroundColor: semaforo.bg, border: `1px solid ${semaforo.color}40`, marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center", color: semaforo.color, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                        {semaforo.icon}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "0.9rem", color: semaforo.color }}>Control de Plazo: {semaforo.label}</h4>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          Plazo legal del trámite: <strong>{selectedExpediente.tipoDocumental.plazoDias} días</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
              <div>
                <h3 style={{ fontSize: "0.875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.75rem" }}>Datos del Documento</h3>
                <div style={{ marginBottom: "0.5rem" }}><strong>Tipo:</strong> {selectedExpediente.tipoDocumental.nombre}</div>
                <div style={{ marginBottom: "0.5rem" }}><strong>Folios:</strong> {selectedExpediente.folios}</div>
                <div style={{ marginBottom: "0.5rem" }}><strong>Registrado por:</strong> {selectedExpediente.registrador.nombres} {selectedExpediente.registrador.apellidos}</div>
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong>Fecha de Registro:</strong> {new Date(selectedExpediente.creadoEn).toLocaleString("es-PE")}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: "0.875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.75rem" }}>Datos del Remitente</h3>
                <div style={{ marginBottom: "0.5rem" }}><strong>Remitente:</strong> {selectedExpediente.nombresRemitente} {selectedExpediente.apellidosRemitente}</div>
                <div style={{ marginBottom: "0.5rem" }}><strong>DNI/RUC:</strong> {selectedExpediente.dniRemitente}</div>
              </div>

              <div style={{ gridColumn: "1 / -1", backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "var(--radius-md)" }}>
                <h3 style={{ fontSize: "0.875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.5rem" }}>Asunto del Trámite</h3>
                <p style={{ margin: 0, color: "var(--text-main)", lineHeight: "1.5" }}>{selectedExpediente.asunto}</p>
              </div>
            </div>

            {/* SECCIÓN DE ANEXOS RF-12 */}
            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.1rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <FileText size={18} /> Documentos Anexos
                </h3>
                
                {selectedExpediente.estado !== 'ARCHIVADO' && (
                  <div>
                    <input 
                      type="file" 
                      id="anexo-upload" 
                      accept="application/pdf" 
                      style={{ display: "none" }} 
                      onChange={handleSubirAnexo}
                      disabled={uploadingAnexo}
                    />
                    <label 
                      htmlFor="anexo-upload" 
                      className={styles.btnPrimary} 
                      style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", cursor: uploadingAnexo ? "not-allowed" : "pointer", opacity: uploadingAnexo ? 0.7 : 1, width: "auto", margin: 0 }}
                    >
                      {uploadingAnexo ? <Loader2 size={16} className="spin" /> : <FileUp size={16} />}
                      {uploadingAnexo ? "Subiendo..." : "Añadir Anexo (PDF)"}
                    </label>
                  </div>
                )}
              </div>

              <div style={{ backgroundColor: "#fafafa", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", padding: "1rem", minHeight: "100px" }}>
                {anexosLoading ? (
                  <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "1rem" }}>Cargando anexos...</div>
                ) : anexos.length === 0 ? (
                  <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "1rem" }}>No hay documentos anexos registrados.</div>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {anexos.map((anx) => (
                      <li key={anx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "white", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                          <FileText size={20} color="#3b82f6" />
                          <div>
                            <div style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--text-main)" }}>{anx.nombreArchivo}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              Subido por: {anx.subidoPor.nombres} {anx.subidoPor.apellidos} - {new Date(anx.creadoEn).toLocaleString("es-PE")}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button 
                            onClick={() => setPreviewUrl(anx.archivoUrl)}
                            style={{ background: "#e0f2fe", border: "none", color: "#0369a1", cursor: "pointer", padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 500 }}
                          >
                            <FileText size={16} /> Ver
                          </button>
                          <Link href={anx.archivoUrl} target="_blank">
                            <button style={{ background: "#f1f5f9", border: "none", color: "var(--primary)", cursor: "pointer", padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 500 }}>
                              <Download size={16} /> Descargar
                            </button>
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* SECCIÓN DE HISTORIAL (RF-15) */}
            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem", marginTop: "2rem" }}>
              <h3 style={{ fontSize: "1.1rem", color: "var(--text-main)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> 
                Ruta del Expediente (Historial)
              </h3>
              
              <div style={{ paddingLeft: "1rem" }}>
                {/* Nodo Inicial: Registro */}
                <div style={{ display: "flex", gap: "1.5rem", position: "relative", paddingBottom: "1.5rem" }}>
                  <div style={{ position: "absolute", left: "7px", top: "24px", bottom: 0, width: "2px", backgroundColor: "#e2e8f0" }}></div>
                  <div style={{ position: "relative", zIndex: 10, width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#10b981", border: "4px solid #d1fae5", flexShrink: 0, marginTop: "4px" }}></div>
                  <div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                      {new Date(selectedExpediente.creadoEn).toLocaleString("es-PE")}
                    </div>
                    <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "1rem" }}>Ingreso por Mesa de Partes</div>
                    <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                      Registrado por: {selectedExpediente.registrador.nombres} {selectedExpediente.registrador.apellidos}
                    </div>
                  </div>
                </div>
                
                {historialLoading ? (
                  <div style={{ padding: "1rem", color: "var(--text-muted)" }}>Cargando ruta...</div>
                ) : historial.length === 0 ? (
                  <div style={{ display: "flex", gap: "1.5rem", position: "relative" }}>
                    <div style={{ position: "relative", zIndex: 10, width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#cbd5e1", border: "4px solid #f1f5f9", flexShrink: 0, marginTop: "4px" }}></div>
                    <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "2px" }}>El expediente aún no ha sido derivado a ninguna otra área.</div>
                  </div>
                ) : (
                  historial.map((mov, index) => {
                    const isLast = index === historial.length - 1;
                    return (
                      <div key={mov.id} style={{ display: "flex", gap: "1.5rem", position: "relative", paddingBottom: isLast ? "0" : "1.5rem" }}>
                        {!isLast && <div style={{ position: "absolute", left: "7px", top: "24px", bottom: 0, width: "2px", backgroundColor: "#e2e8f0" }}></div>}
                        <div style={{ position: "relative", zIndex: 10, width: "16px", height: "16px", borderRadius: "50%", backgroundColor: isLast ? "#3b82f6" : "#94a3b8", border: "4px solid " + (isLast ? "#dbeafe" : "#f1f5f9"), flexShrink: 0, marginTop: "4px" }}></div>
                        <div style={{ backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "var(--radius-md)", width: "100%", border: "1px solid var(--border-color)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                              {new Date(mov.creadoEn).toLocaleString("es-PE")}
                            </div>
                            <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.5rem", backgroundColor: mov.estado === "PENDIENTE" ? "#fef3c7" : "#dcfce7", color: mov.estado === "PENDIENTE" ? "#b45309" : "#166534", borderRadius: "var(--radius-full)" }}>
                              {mov.estado}
                            </span>
                          </div>
                          <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "1rem", marginBottom: "0.25rem" }}>
                            {mov.destinoUnidad ? (
                              <>Derivado a: <span style={{ color: "var(--primary)" }}>{mov.destinoUnidad.nombre}</span></>
                            ) : mov.destinoUsuario ? (
                              <>Reasignado a: <span style={{ color: "#9333ea" }}>{mov.destinoUsuario.nombres} {mov.destinoUsuario.apellidos}</span></>
                            ) : (
                              <><span style={{ color: "#059669" }}>Registro de Acción</span></>
                            )}
                          </div>
                          <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                            Enviado por: {mov.origen.nombres} {mov.origen.apellidos} ({mov.origen.rol.nombre})
                          </div>
                          {mov.instrucciones && (
                            <div style={{ fontSize: "0.875rem", backgroundColor: "white", padding: "0.75rem", borderRadius: "var(--radius-md)", borderLeft: "3px solid #cbd5e1" }}>
                              <strong>Instrucciones:</strong> {mov.instrucciones}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div style={{ marginTop: "2rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", color: "var(--text-main)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FileText size={18} color="var(--primary)" /> Documentos Internos (Proveídos / Informes)
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {docsLoading ? (
                  <div style={{ textAlign: "center", padding: "1rem", color: "var(--text-muted)" }}>
                    <Loader2 size={24} className="spin" style={{ margin: "0 auto" }} />
                    <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>Cargando documentos...</p>
                  </div>
                ) : documentosInternos.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", backgroundColor: "#f8fafc", borderRadius: "var(--radius-md)", border: "1px dashed var(--border-color)" }}>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>
                      Aún no se han redactado proveídos ni informes internos para este expediente.
                    </p>
                  </div>
                ) : (
                  documentosInternos.map((doc) => {
                    const isJefe = currentUser?.rolNombre === "Jefe o responsable de área" || currentUser?.rolNombre === "Funcionario firmante";
                    const isSameUnit = currentUser?.unidadId === doc.autor?.unidadId;
                    const canApprove = isJefe && isSameUnit;
                    const isPendiente = doc.estadoAprobacion === 'PENDIENTE';
                    const isAprobado = doc.estadoAprobacion === 'APROBADO';
                    const isFirmado = doc.estadoAprobacion === 'FIRMADO';
                    
                    return (
                      <div key={doc.id} style={{ backgroundColor: "#f8fafc", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                        <div style={{ padding: "0.75rem 1rem", backgroundColor: "white", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                          <div>
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.5rem", backgroundColor: "#e0f2fe", color: "#0284c7", borderRadius: "var(--radius-sm)", marginRight: "0.5rem" }}>
                              {doc.tipo}
                            </span>
                            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginRight: "1rem" }}>
                              por {doc.autor?.nombres} {doc.autor?.apellidos}
                            </span>
                            <span style={{ 
                              fontSize: "0.7rem", 
                              fontWeight: 700, 
                              padding: "0.15rem 0.5rem", 
                              backgroundColor: doc.estadoAprobacion === "APROBADO" ? "#dcfce7" : doc.estadoAprobacion === "OBSERVADO" ? "#fee2e2" : "#fef3c7", 
                              color: doc.estadoAprobacion === "APROBADO" ? "#166534" : doc.estadoAprobacion === "OBSERVADO" ? "#991b1b" : "#b45309", 
                              borderRadius: "var(--radius-full)" 
                            }}>
                              V°B° {doc.estadoAprobacion}
                            </span>
                          </div>
                          
                          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {new Date(doc.creadoEn).toLocaleString("es-PE")}
                            </span>
                            
                            {canApprove && isPendiente && (
                              <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button 
                                  onClick={() => handleAprobarDocumento(doc.id, 'APROBAR')}
                                  disabled={aprobandoDocs[doc.id]}
                                  style={{ backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "var(--radius-md)", padding: "0.4rem 0.75rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
                                >
                                  {aprobandoDocs[doc.id] ? <Loader2 size={12} className="spin" /> : <CheckCircle size={12} />}
                                  Aprobar V°B°
                                </button>
                                <button 
                                  onClick={() => setObservarDocumentoId(doc.id)}
                                  disabled={aprobandoDocs[doc.id]}
                                  style={{ backgroundColor: "white", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "var(--radius-md)", padding: "0.4rem 0.75rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                                >
                                  Observar
                                </button>
                              </div>
                            )}

                            {canApprove && isAprobado && (
                              <button 
                                onClick={() => setFirmarModalId(doc.id)}
                                disabled={aprobandoDocs[doc.id]}
                                style={{ backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "var(--radius-md)", padding: "0.4rem 0.75rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
                              >
                                {aprobandoDocs[doc.id] ? <Loader2 size={12} className="spin" /> : <FileText size={12} />}
                                Firmar y Emitir
                              </button>
                            )}

                            {isFirmado && (
                              <button 
                                onClick={async () => {
                                  try {
                                    setDocsLoading(true);
                                    const htmlString = `
                                      <div style="padding: 20mm; font-family: 'Times New Roman', serif; color: black; background: white;">
                                        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px;">
                                          <div style="text-align: center; flex: 1;">
                                            <h1 style="font-size: 1.2rem; margin: 0; text-transform: uppercase;">Municipalidad Provincial de Chupaca</h1>
                                            <h2 style="font-size: 1rem; margin: 5px 0 0 0; color: #444;">"Año del Bicentenario, de la consolidación de nuestra Independencia..."</h2>
                                          </div>
                                        </div>
                                        <div style="margin-bottom: 30px;">
                                          <p style="margin: 5px 0; font-size: 12pt;"><strong>TIPO DE DOCUMENTO:</strong> ${doc.tipo}</p>
                                          <p style="margin: 5px 0; font-size: 12pt;"><strong>EXPEDIENTE REFERENCIA:</strong> ${selectedExpediente?.codigo}</p>
                                          <p style="margin: 5px 0; font-size: 12pt;"><strong>ASUNTO:</strong> ${selectedExpediente?.asunto}</p>
                                          <p style="margin: 5px 0; font-size: 12pt;"><strong>FECHA:</strong> ${new Date(doc.creadoEn).toLocaleDateString("es-PE")}</p>
                                        </div>
                                        <div style="font-size: 12pt; line-height: 1.6;">
                                          ${doc.contenido}
                                        </div>
                                      </div>
                                    `;
                                    
                                    const opt: any = {
                                      margin:       0,
                                      filename:     `${doc.tipo}_${selectedExpediente?.codigo}.pdf`,
                                      image:        { type: 'jpeg', quality: 0.98 },
                                      html2canvas:  { scale: 2 },
                                      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
                                    };
                                    
                                    const html2pdf = (await import('html2pdf.js')).default;
                                    const pdfBlob = await html2pdf().set(opt).from(htmlString).output('blob');
                                    const blobUrl = URL.createObjectURL(pdfBlob);
                                    setPreviewUrl(blobUrl);
                                  } catch(e) {
                                    console.error(e);
                                    setNotification({ message: "Error al generar PDF", type: "error" });
                                  } finally {
                                    setDocsLoading(false);
                                  }
                                }}
                                style={{ backgroundColor: "#f8fafc", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "var(--radius-md)", padding: "0.4rem 0.75rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
                              >
                                {docsLoading ? <Loader2 size={12} className="spin" /> : <FileText size={12} />}
                                Previsualizar / Descargar PDF Oficial
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {doc.estadoAprobacion === 'OBSERVADO' && doc.observacionesRevisor && (
                          <div style={{ backgroundColor: "#fef2f2", padding: "0.75rem 1rem", borderBottom: "1px solid #fecaca", fontSize: "0.875rem", color: "#991b1b" }}>
                            <strong>Observación del Revisor:</strong> {doc.observacionesRevisor}
                          </div>
                        )}

                        <div 
                          style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--text-main)" }}
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: doc.contenido }}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem" }}>
              <button onClick={() => setSelectedExpediente(null)} className={styles.btnSecondary} style={{ width: "auto", padding: "0.75rem 2rem", margin: 0 }}>
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Visor PDF a Pantalla Completa (RF-13) */}
      {previewUrl && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", zIndex: 999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <div style={{ width: "100%", maxWidth: "1200px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ color: "white", margin: 0, fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FileText size={24} /> Previsualización de Documento
            </h3>
            <button 
              onClick={() => setPreviewUrl(null)} 
              className={styles.btnPrimary} 
              style={{ backgroundColor: "#ef4444", border: "none", width: "auto", padding: "0.5rem 1.5rem" }}
            >
              Cerrar Visor
            </button>
          </div>
          <div style={{ width: "100%", maxWidth: "1200px", height: "85vh", backgroundColor: "white", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5)" }}>
            <iframe 
              src={previewUrl} 
              width="100%" 
              height="100%" 
              style={{ border: "none" }}
              title="Visor PDF"
            />
          </div>
        </div>
      )}

      {/* MODAL OBSERVACIÓN V°B° */}
      {observarDocumentoId && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="solid-panel" style={{ width: "100%", maxWidth: "450px", padding: "2rem", position: "relative" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#dc2626", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertCircle size={20} /> Observar Documento
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
              Indica qué correcciones debe realizar el autor antes de que el documento pueda ser aprobado.
            </p>

            <div className={styles.formGroup}>
              <label className={styles.label}>Motivo de la Observación *</label>
              <textarea 
                className={styles.input}
                value={observacionesVb}
                onChange={(e) => setObservacionesVb(e.target.value)}
                placeholder="Ej: Por favor adjunta la firma digital o corrige el párrafo 2..."
                rows={4}
                required
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "2rem" }}>
              <button 
                type="button" 
                onClick={() => {
                  setObservarDocumentoId(null);
                  setObservacionesVb("");
                }}
                className={styles.btnSecondary}
                style={{ width: "auto", margin: 0 }}
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleAprobarDocumento(observarDocumentoId, 'OBSERVAR')}
                className={styles.btnPrimary}
                disabled={aprobandoDocs[observarDocumentoId] || !observacionesVb.trim()}
                style={{ width: "auto", margin: 0, backgroundColor: "#dc2626", borderColor: "#dc2626" }}
              >
                {aprobandoDocs[observarDocumentoId] ? "Enviando..." : "Enviar Observación"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Notificación Personalizada */}
      {notification && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="solid-panel" style={{ width: "100%", maxWidth: "400px", padding: "2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            {notification.type === "success" ? (
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
            ) : (
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
            )}
            
            <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--text-main)" }}>
              {notification.type === "success" ? "¡Éxito!" : "Atención"}
            </h3>
            
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>
              {notification.message}
            </p>
            
            <button 
              onClick={() => setNotification(null)}
              className={styles.btnPrimary}
              style={{ marginTop: "1rem", backgroundColor: notification.type === "success" ? "#16a34a" : "#dc2626", borderColor: notification.type === "success" ? "#16a34a" : "#dc2626", width: "100%" }}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: Confirmación de Firma (Reemplazo de window.confirm) */}
      {firmarModalId !== null && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ backgroundColor: "white", borderRadius: "var(--radius-md)", padding: "2rem", width: "100%", maxWidth: "450px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", color: "#b45309" }}>
              <AlertCircle size={28} />
              <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--text-main)" }}>Confirmar Emisión</h3>
            </div>
            <p style={{ color: "var(--text-muted)", marginBottom: "2rem", lineHeight: 1.5 }}>
              ¿Estás seguro de emitir y firmar digitalmente este documento? Una vez firmado, el documento quedará sellado y <strong>ya no podrá ser modificado ni eliminado</strong>.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              <button onClick={() => setFirmarModalId(null)} className={styles.btnSecondary} style={{ flex: 1, margin: 0, padding: "0.75rem", fontSize: "0.875rem", fontWeight: 600, height: "42px", display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
                Cancelar
              </button>
              <button onClick={executeFirmarDocumento} className={styles.btnPrimary} style={{ flex: 1, margin: 0, padding: "0.75rem", fontSize: "0.875rem", fontWeight: 600, height: "42px", display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
                Sí, Firmar y Emitir
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .table-row-hover:hover { background-color: rgba(var(--primary-hue), 85%, 55%, 0.03); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
