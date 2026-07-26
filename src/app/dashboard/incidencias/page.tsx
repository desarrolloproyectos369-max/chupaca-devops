"use client";

import React, { useState, useEffect } from "react";
import { Wrench, CheckCircle, Clock, AlertTriangle, Loader2 } from "lucide-react";
import styles from "../../page.module.css";

export default function IncidenciasPage() {
  const [incidencias, setIncidencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchIncidencias();
  }, []);

  const fetchIncidencias = async () => {
    try {
      const res = await fetch("/api/sistema/incidencias");
      const data = await res.json();
      if (res.ok && data.success) {
        setIncidencias(data.data);
      }
    } catch (error) {
      console.error("Error al cargar incidencias", error);
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (id: number, nuevoEstado: string) => {
    setActionLoading(id);
    try {
      const res = await fetch("/api/sistema/incidencias", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, estado: nuevoEstado })
      });
      if (res.ok) {
        setIncidencias(incidencias.map(inc => inc.id === id ? { ...inc, estado: nuevoEstado } : inc));
      }
    } catch (error) {
      console.error("Error al cambiar estado", error);
    } finally {
      setActionLoading(null);
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case "BAJA": return "#10b981"; // green
      case "MEDIA": return "#3b82f6"; // blue
      case "ALTA": return "#f59e0b"; // orange
      case "CRITICA": return "#ef4444"; // red
      default: return "#64748b";
    }
  };

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><Loader2 className="spin" size={32} /></div>;
  }

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 0.5rem 0" }}>
            <Wrench size={24} />
            Gestión de Incidencias Técnicas
          </h1>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>Panel para atender y resolver problemas reportados por los usuarios.</p>
        </div>
      </div>

      <div style={{ display: "grid", gap: "1rem" }}>
        {incidencias.length === 0 ? (
          <div className="solid-panel" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <CheckCircle size={48} style={{ margin: "0 auto 1rem auto", opacity: 0.5 }} />
            <h3 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem 0", color: "var(--text-main)" }}>¡Todo bajo control!</h3>
            <p style={{ margin: 0 }}>No hay incidencias reportadas en el sistema.</p>
          </div>
        ) : (
          incidencias.map(inc => (
            <div key={inc.id} className="solid-panel" style={{ padding: "1.5rem", display: "flex", gap: "1.5rem", borderLeft: `4px solid ${getPrioridadColor(inc.prioridad)}` }}>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "1rem", backgroundColor: `${getPrioridadColor(inc.prioridad)}20`, color: getPrioridadColor(inc.prioridad) }}>
                    {inc.prioridad}
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Reportado por: <strong>{inc.reportadoPor?.nombres} {inc.reportadoPor?.apellidos}</strong> el {new Date(inc.creadoEn).toLocaleDateString()}
                  </span>
                </div>
                <h3 style={{ fontSize: "1.1rem", margin: "0 0 0.5rem 0", color: "var(--text-main)" }}>{inc.titulo}</h3>
                <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--text-muted)", whiteSpace: "pre-wrap" }}>
                  {inc.descripcion}
                </p>
              </div>

              <div style={{ width: "200px", display: "flex", flexDirection: "column", gap: "0.5rem", borderLeft: "1px solid var(--border-color)", paddingLeft: "1.5rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "0.25rem" }}>Estado actual:</span>
                
                {inc.estado === "PENDIENTE" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#f59e0b", fontWeight: 500, fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                    <AlertTriangle size={18} /> Pendiente
                  </div>
                )}
                {inc.estado === "EN_PROCESO" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#3b82f6", fontWeight: 500, fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                    <Clock size={18} /> En revisión
                  </div>
                )}
                {inc.estado === "RESUELTO" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#10b981", fontWeight: 500, fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                    <CheckCircle size={18} /> Resuelto
                  </div>
                )}

                {/* Acciones */}
                {actionLoading === inc.id ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "0.5rem" }}><Loader2 size={18} className="spin" /></div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    {inc.estado !== "EN_PROCESO" && inc.estado !== "RESUELTO" && (
                      <button onClick={() => cambiarEstado(inc.id, "EN_PROCESO")} style={{ padding: "0.4rem", fontSize: "0.8rem", borderRadius: "var(--radius-sm)", backgroundColor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", cursor: "pointer", fontWeight: 500 }}>
                        Marcar en Revisión
                      </button>
                    )}
                    {inc.estado !== "RESUELTO" && (
                      <button onClick={() => cambiarEstado(inc.id, "RESUELTO")} style={{ padding: "0.4rem", fontSize: "0.8rem", borderRadius: "var(--radius-sm)", backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", cursor: "pointer", fontWeight: 500 }}>
                        Marcar como Resuelto
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}
