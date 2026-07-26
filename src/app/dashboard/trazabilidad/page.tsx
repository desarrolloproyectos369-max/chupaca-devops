"use client";

import React, { useState } from "react";
import { Search, Loader2, Shield, Clock, FileText, User, ArrowRight, Activity, MapPin, AlertCircle } from "lucide-react";
import styles from "../../page.module.css";

interface TimelineEvent {
  id: string;
  fecha: string;
  tipo: 'CREACION' | 'DERIVACION' | 'AUDITORIA';
  titulo: string;
  responsable: string;
  detalles: string;
}

export default function TrazabilidadPage() {
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expedienteInfo, setExpedienteInfo] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) return;

    setLoading(true);
    setError(null);
    setExpedienteInfo(null);
    setTimeline([]);

    try {
      const res = await fetch(`/api/sistema/trazabilidad?codigo=${encodeURIComponent(codigo)}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setExpedienteInfo(data.expediente);
        setTimeline(data.timeline);
      } else {
        setError(data.error || "Ocurrió un error al buscar la trazabilidad.");
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (tipo: string) => {
    switch (tipo) {
      case 'CREACION': return <FileText size={20} color="white" />;
      case 'DERIVACION': return <ArrowRight size={20} color="white" />;
      case 'AUDITORIA': return <Activity size={20} color="white" />;
      default: return <Clock size={20} color="white" />;
    }
  };

  const getEventColor = (tipo: string) => {
    switch (tipo) {
      case 'CREACION': return '#10b981'; // Green
      case 'DERIVACION': return '#3b82f6'; // Blue
      case 'AUDITORIA': return '#f59e0b'; // Amber
      default: return '#64748b'; // Gray
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 0.5rem 0" }}>
            <Shield size={24} />
            Trazabilidad Histórica (Auditoría)
          </h1>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>Consulte la línea de tiempo inalterable y registros de auditoría de un expediente.</p>
        </div>
      </div>

      <div className="solid-panel" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 300px", maxWidth: "400px" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-color)" }}>
              Código de Expediente
            </label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                <Search size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Ej. EXP-0001-2026"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", fontSize: "1rem", outline: "none", textTransform: "uppercase" }}
                required
              />
            </div>
          </div>
          <button 
            type="submit" 
            className={styles.btnPrimary} 
            style={{ margin: 0, padding: "0.75rem 1.5rem", width: "auto", whiteSpace: "nowrap" }}
            disabled={loading}
          >
            {loading ? <Loader2 size={18} className="spin" /> : "Rastrear Documento"}
          </button>
        </form>
      </div>

      {error && (
        <div style={{ backgroundColor: "#fee2e2", color: "#dc2626", padding: "1rem", borderRadius: "var(--radius-md)", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {expedienteInfo && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
          
          {/* Info Resumen */}
          <div className="solid-panel" style={{ padding: "1.5rem", backgroundColor: "var(--bg-color)" }}>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", color: "var(--text-main)" }}>Información del Expediente</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Código</span>
                <div style={{ fontWeight: 600 }}>{expedienteInfo.codigo}</div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Estado Actual</span>
                <div style={{ fontWeight: 600 }}>{expedienteInfo.estado}</div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Remitente</span>
                <div style={{ fontWeight: 600 }}>{expedienteInfo.remitente}</div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Asunto</span>
                <div style={{ fontWeight: 600 }}>{expedienteInfo.asunto}</div>
              </div>
            </div>
          </div>

          {/* Línea de Tiempo */}
          <div className="solid-panel" style={{ padding: "2rem" }}>
            <h3 style={{ margin: "0 0 2rem 0", fontSize: "1.25rem", color: "var(--text-main)" }}>Línea de Tiempo Integral</h3>
            
            <div style={{ position: "relative", paddingLeft: "2rem" }}>
              {/* Línea vertical */}
              <div style={{ position: "absolute", left: "15px", top: 0, bottom: 0, width: "2px", backgroundColor: "var(--border-color)" }}></div>
              
              {timeline.map((event, index) => (
                <div key={event.id} style={{ position: "relative", marginBottom: index === timeline.length - 1 ? 0 : "2rem" }}>
                  {/* Círculo del evento */}
                  <div style={{ 
                    position: "absolute", 
                    left: "-2rem", 
                    top: "0.25rem",
                    width: "36px", 
                    height: "36px", 
                    borderRadius: "50%", 
                    backgroundColor: getEventColor(event.tipo),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 0 4px white, 0 2px 4px rgba(0,0,0,0.1)",
                    zIndex: 1
                  }}>
                    {getEventIcon(event.tipo)}
                  </div>
                  
                  {/* Contenido del evento */}
                  <div style={{ 
                    marginLeft: "1rem", 
                    backgroundColor: "white", 
                    padding: "1.25rem", 
                    borderRadius: "var(--radius-md)", 
                    border: "1px solid var(--border-color)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <h4 style={{ margin: 0, fontSize: "1.05rem", color: "var(--text-main)" }}>{event.titulo}</h4>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", backgroundColor: "var(--bg-color)", padding: "0.25rem 0.75rem", borderRadius: "1rem" }}>
                        {new Date(event.fecha).toLocaleString('es-PE')}
                      </span>
                    </div>
                    
                    <p style={{ margin: "0 0 1rem 0", color: "var(--text-color)", fontSize: "0.95rem" }}>
                      {event.detalles}
                    </p>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      <User size={14} />
                      <strong>Responsable:</strong> {event.responsable}
                    </div>
                  </div>
                </div>
              ))}
              
              {timeline.length === 0 && (
                <div style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                  No se encontraron registros en la línea de tiempo.
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
