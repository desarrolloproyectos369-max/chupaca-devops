"use client";

import React, { useState } from "react";
import { LifeBuoy, Send, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import styles from "../../page.module.css";

export default function SoportePage() {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState("MEDIA");
  
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{tipo: 'exito' | 'error', texto: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !descripcion.trim()) return;

    setLoading(true);
    setMensaje(null);

    try {
      const res = await fetch("/api/sistema/incidencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, descripcion, prioridad })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMensaje({ tipo: "exito", texto: "Tu reporte ha sido enviado al equipo de Soporte Técnico. Gracias." });
        setTitulo("");
        setDescripcion("");
        setPrioridad("MEDIA");
      } else {
        setMensaje({ tipo: "error", texto: data.error || "Ocurrió un error al enviar el reporte." });
      }
    } catch (error) {
      setMensaje({ tipo: "error", texto: "Error de conexión con el servidor." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 0.5rem 0" }}>
            <LifeBuoy size={24} />
            Soporte Técnico
          </h1>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>Reporta problemas del sistema o solicita asistencia técnica.</p>
        </div>
      </div>

      <div className="solid-panel" style={{ padding: "2rem" }}>
        {mensaje && (
          <div style={{ 
            backgroundColor: mensaje.tipo === 'exito' ? "#dcfce7" : "#fee2e2", 
            color: mensaje.tipo === 'exito' ? "#16a34a" : "#dc2626", 
            padding: "1rem", 
            borderRadius: "var(--radius-md)", 
            marginBottom: "1.5rem", 
            display: "flex", 
            alignItems: "center", 
            gap: "0.5rem" 
          }}>
            {mensaje.tipo === 'exito' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, color: "var(--text-main)" }}>
              Título del Problema <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input 
              type="text" 
              required
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ej: No puedo derivar el expediente EXP-0001"
              style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, color: "var(--text-main)" }}>
              Descripción Detallada <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <textarea 
              required
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Explica qué estabas haciendo y qué error te apareció..."
              style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", minHeight: "150px", resize: "vertical", fontFamily: "inherit" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, color: "var(--text-main)" }}>
              Nivel de Prioridad
            </label>
            <select 
              value={prioridad}
              onChange={e => setPrioridad(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", backgroundColor: "white" }}
            >
              <option value="BAJA">Baja - Inconveniente menor</option>
              <option value="MEDIA">Media - No me permite avanzar en una tarea</option>
              <option value="ALTA">Alta - Un proceso importante falló</option>
              <option value="CRITICA">Crítica - El sistema está caído o da error en todo</option>
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button 
              type="submit" 
              disabled={loading || !titulo.trim() || !descripcion.trim()}
              className={styles.btnPrimary} 
              style={{ margin: 0, padding: "0.75rem 2rem", width: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              {loading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
              Enviar Reporte
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
