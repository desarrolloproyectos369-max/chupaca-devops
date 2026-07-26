"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, FileText, AlertCircle, CheckCircle, BarChart3, Loader2, Download, Printer, Eye, SlidersHorizontal, X, FileOutput } from "lucide-react";
import * as XLSX from 'xlsx';
import styles from "../../page.module.css";
import Link from "next/link";

interface KPI {
  total: number;
  enProceso: number;
  archivados: number;
  vencidos: number;
}

interface Expediente {
  id: number;
  codigo: string;
  asunto: string;
  estado: string;
  creadoEn: string;
  prioridad: string;
  nombresRemitente: string;
  apellidosRemitente: string;
  dniRemitente: string;
  tipoDocumental: {
    nombre: string;
    plazoDias: number;
  };
  registrador: {
    nombres: string;
    apellidos: string;
  };
}

export default function ReportesPage() {
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [kpis, setKpis] = useState<KPI>({ total: 0, enProceso: 0, archivados: 0, vencidos: 0 });
  const [loading, setLoading] = useState(true);
  const [tipos, setTipos] = useState<{id: number, nombre: string}[]>([]);
  const [showFiltros, setShowFiltros] = useState(false);

  // Filtros
  const [filtros, setFiltros] = useState({
    fechaInicio: "",
    fechaFin: "",
    estado: "TODOS",
    tipoDocumentalId: "TODOS"
  });

  useEffect(() => {
    // Cargar tipos documentales para el select de filtros
    fetch("/api/tipos")
      .then(res => res.json())
      .then(data => setTipos(data))
      .catch(err => console.error(err));
      
    // Fechas por defecto: último mes
    const hoy = new Date();
    const haceUnMes = new Date();
    haceUnMes.setMonth(hoy.getMonth() - 1);
    
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    setFiltros(f => ({ ...f, fechaInicio: fmt(haceUnMes), fechaFin: fmt(hoy) }));
  }, []);

  useEffect(() => {
    if (filtros.fechaInicio && filtros.fechaFin) {
      cargarReporte();
    }
  }, [filtros.fechaInicio, filtros.fechaFin, filtros.estado, filtros.tipoDocumentalId]);

  const cargarReporte = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        fechaInicio: filtros.fechaInicio,
        fechaFin: filtros.fechaFin,
        estado: filtros.estado,
        tipoDocumentalId: filtros.tipoDocumentalId
      });

      const res = await fetch(`/api/reportes/expedientes?${params.toString()}`);
      const data = await res.json();
      
      if (data.success) {
        setExpedientes(data.data);
        setKpis(data.kpis);
      }
    } catch (error) {
      console.error("Error al cargar reporte:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    cargarReporte();
  };

  const exportToExcel = () => {
    if (expedientes.length === 0) return;
    
    const dataToExport = expedientes.map(exp => ({
      'Código': exp.codigo,
      'Fecha Ingreso': new Date(exp.creadoEn).toLocaleString('es-PE'),
      'Tipo de Trámite': exp.tipoDocumental.nombre,
      'Asunto': exp.asunto,
      'Plazo (Días)': exp.tipoDocumental.plazoDias,
      'Remitente': `${exp.nombresRemitente} ${exp.apellidosRemitente}`,
      'DNI/RUC': exp.dniRemitente,
      'Estado': exp.estado,
      'Prioridad': exp.prioridad
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte_Expedientes");
    
    XLSX.writeFile(workbook, `Reporte_Muni_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = async () => {
    if (expedientes.length === 0) return;
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('tabla-reporte');
      
      const opt: any = {
        margin:       0.5,
        filename:     `Reporte_Expedientes_${new Date().toISOString().split('T')[0]}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
      };
      
      if (!element) return;
      html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Hubo un problema al generar el PDF.");
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'REGISTRADO': return { bg: '#e0f2fe', text: '#0284c7' };
      case 'EN_PROCESO': return { bg: '#fef3c7', text: '#d97706' };
      case 'OBSERVADO': return { bg: '#fee2e2', text: '#dc2626' };
      case 'FINALIZADO': return { bg: '#dcfce3', text: '#16a34a' };
      case 'ARCHIVADO': return { bg: '#f1f5f9', text: '#475569' };
      default: return { bg: '#f3f4f6', text: '#4b5563' };
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 0.5rem 0" }}>
            <BarChart3 size={24} />
            Reporte de Expedientes
          </h1>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>Visión global e indicadores de gestión documental</p>
        </div>
        <div>
          <button 
            type="button"
            onClick={() => setShowFiltros(!showFiltros)}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", backgroundColor: "transparent", color: "var(--primary)", border: "1px solid var(--primary)", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}
          >
            <SlidersHorizontal size={18} />
            Filtros
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <div className="solid-panel" style={{ padding: "1.5rem", borderLeft: "4px solid #3b82f6" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase" }}>Total Expedientes</div>
          <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--text-main)", marginTop: "0.5rem" }}>
            {loading ? <Loader2 size={24} className="spin" /> : kpis.total}
          </div>
        </div>
        
        <div className="solid-panel" style={{ padding: "1.5rem", borderLeft: "4px solid #f59e0b" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase" }}>En Proceso</div>
          <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#d97706", marginTop: "0.5rem" }}>
            {loading ? <Loader2 size={24} className="spin" /> : kpis.enProceso}
          </div>
        </div>

        <div className="solid-panel" style={{ padding: "1.5rem", borderLeft: "4px solid #ef4444" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase" }}>Vencidos (Fuera de Plazo)</div>
          <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#dc2626", marginTop: "0.5rem" }}>
            {loading ? <Loader2 size={24} className="spin" /> : kpis.vencidos}
          </div>
        </div>

        <div className="solid-panel" style={{ padding: "1.5rem", borderLeft: "4px solid #64748b" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase" }}>Archivados</div>
          <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#475569", marginTop: "0.5rem" }}>
            {loading ? <Loader2 size={24} className="spin" /> : kpis.archivados}
          </div>
        </div>
      </div>

      {/* FILTROS */}
      {showFiltros && (
        <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", marginBottom: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", animation: "fadeIn 0.2s ease-out" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-color)" }}>Fecha Desde</label>
            <input 
              type="date" 
              style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.875rem", outline: "none" }}
              value={filtros.fechaInicio}
              onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-color)" }}>Fecha Hasta</label>
            <input 
              type="date" 
              style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.875rem", outline: "none" }}
              value={filtros.fechaFin}
              onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-color)" }}>Estado</label>
            <select 
              style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.875rem", outline: "none" }}
              value={filtros.estado}
              onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
            >
              <option value="TODOS">Todos los estados</option>
              <option value="REGISTRADO">Registrado</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="OBSERVADO">Observado</option>
              <option value="FINALIZADO">Finalizado</option>
              <option value="ARCHIVADO">Archivado</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-color)" }}>Tipo de Trámite</label>
            <select 
              style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.875rem", outline: "none" }}
              value={filtros.tipoDocumentalId}
              onChange={(e) => setFiltros({...filtros, tipoDocumentalId: e.target.value})}
            >
              <option value="TODOS">Todos los tipos</option>
              {tipos.map(t => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
            <button 
              onClick={() => {
                setFiltros({ fechaInicio: "", fechaFin: "", estado: "TODOS", tipoDocumentalId: "TODOS" });
              }}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1rem", backgroundColor: "transparent", color: "var(--text-muted)", border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 }}
            >
              <X size={16} />
              Limpiar Filtros
            </button>
          </div>
        </div>
      )}

      {/* TABLA DE RESULTADOS */}
      <div className="solid-panel" style={{ overflow: "hidden" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--text-main)" }}>Resultados Detallados</h3>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button 
              onClick={exportToExcel}
              disabled={expedientes.length === 0}
              className={styles.btnSecondary} 
              style={{ width: "auto", margin: 0, padding: "0.5rem 1rem", opacity: expedientes.length === 0 ? 0.5 : 1 }}
            >
              <Download size={16} /> Exportar Excel
            </button>
            <button 
              onClick={exportToPDF}
              disabled={expedientes.length === 0}
              className={styles.btnSecondary} 
              style={{ width: "auto", margin: 0, padding: "0.5rem 1rem", opacity: expedientes.length === 0 ? 0.5 : 1, borderColor: "#dc2626", color: "#dc2626" }}
            >
              <FileOutput size={16} /> Exportar PDF
            </button>
          </div>
        </div>
        
        <div id="tabla-reporte" style={{ overflowX: "auto", backgroundColor: "white", padding: "1rem" }}>
          <h2 style={{ display: "none", color: "var(--primary)", marginBottom: "1rem" }} className="pdf-only-title">
            Reporte de Expedientes - Municipalidad
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "950px" }}>
            <thead style={{ backgroundColor: "rgba(0,0,0,0.02)", borderBottom: "1px solid var(--border-color)" }}>
              <tr>
                <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", color: "var(--text-muted)", width: "130px" }}>Código</th>
                <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", color: "var(--text-muted)", width: "120px" }}>Fecha Ingreso</th>
                <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", color: "var(--text-muted)" }}>Tipo y Asunto</th>
                <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", color: "var(--text-muted)", width: "100px" }}>Plazo de Ley</th>
                <th style={{ padding: "1rem", textAlign: "center", fontSize: "0.875rem", color: "var(--text-muted)", width: "130px" }}>Estado</th>
                <th style={{ padding: "1rem", textAlign: "right", fontSize: "0.875rem", color: "var(--text-muted)", width: "120px" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "3rem" }}>
                    <Loader2 size={32} className="spin" style={{ margin: "0 auto", color: "var(--primary)" }} />
                    <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>Generando reporte...</p>
                  </td>
                </tr>
              ) : expedientes.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                    No se encontraron expedientes con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                expedientes.map(exp => {
                  const style = getStatusColor(exp.estado);
                  return (
                    <tr key={exp.id} style={{ borderBottom: "1px solid var(--border-color)", transition: "background-color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.02)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                      <td style={{ padding: "1rem", fontWeight: 600, color: "var(--text-main)" }}>
                        {exp.codigo}
                        {exp.prioridad === 'ALTA' && <AlertCircle size={12} color="#dc2626" style={{ marginLeft: "4px", display: "inline" }} />}
                      </td>
                      <td style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                        {new Date(exp.creadoEn).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{exp.tipoDocumental.nombre}</div>
                        <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", maxWidth: "250px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {exp.asunto}
                        </div>
                      </td>
                      <td style={{ padding: "1rem", fontSize: "0.875rem" }}>
                        {exp.tipoDocumental.plazoDias} días
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <span style={{ 
                          padding: "0.25rem 0.75rem", 
                          backgroundColor: style.bg, 
                          color: style.text, 
                          borderRadius: "var(--radius-full)", 
                          fontSize: "0.75rem", 
                          fontWeight: 700 
                        }}>
                          {exp.estado}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <Link 
                            href="/dashboard/bandeja" 
                            style={{ background: "#f0fdf4", border: "none", color: "#166534", padding: "0.5rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                            title="Ir a bandeja"
                          >
                            <Eye size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
