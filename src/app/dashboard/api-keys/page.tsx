"use client";

import React, { useState, useEffect } from "react";
import { Key, Shield, Copy, Save, Loader2, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import styles from "../../page.module.css";

export default function ApiKeysPage() {
  const [token, setToken] = useState("");
  const [originalToken, setOriginalToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error', texto: string } | null>(null);

  useEffect(() => {
    fetchToken();
  }, []);

  const fetchToken = async () => {
    try {
      const res = await fetch("/api/configuracion");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        const tokenConfig = data.find((c: any) => c.clave === "API_INTEROPERABILIDAD_TOKEN");
        if (tokenConfig) {
          setToken(tokenConfig.valor);
          setOriginalToken(tokenConfig.valor);
        }
      }
    } catch (error) {
      console.error("Error al cargar token", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMensaje(null);
    try {
      const res = await fetch("/api/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ clave: "API_INTEROPERABILIDAD_TOKEN", valor: token }])
      });
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        data = {};
      }
      
      if (res.ok) {
        setOriginalToken(token);
        setMensaje({ tipo: 'exito', texto: "Token de API guardado y activado correctamente." });
      } else {
        setMensaje({ tipo: 'error', texto: data.error || "Ocurrió un error al guardar." });
      }
    } catch (error) {
      console.error(error);
      setMensaje({ tipo: 'error', texto: "Error de conexión." });
    } finally {
      setSaving(false);
    }
  };

  const generarToken = () => {
    const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setToken(`MUNI-${randomString.toUpperCase()}`);
  };

  const copiarPortapapeles = () => {
    navigator.clipboard.writeText(token);
    alert("Token copiado al portapapeles");
  };

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><Loader2 className="spin" size={32} /></div>;
  }

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 0.5rem 0" }}>
            <Key size={24} />
            API de Interoperabilidad
          </h1>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>Gestione el Token de acceso para que sistemas externos puedan consultar datos.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
        
        {/* Panel Configuración */}
        <div className="solid-panel" style={{ padding: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", margin: "0 0 1.5rem 0", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Shield size={20} color="#3b82f6" />
            Seguridad y Autenticación
          </h2>
          
          <div style={{ backgroundColor: "#f8fafc", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid #e2e8f0", marginBottom: "2rem" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-color)" }}>
              Token Bearer (Clave Maestra)
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input 
                type="text" 
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Ej. MUNI-SEC-2026-XYZ"
                style={{ flex: 1, padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "1rem", outline: "none", letterSpacing: "1px" }}
              />
              <button 
                onClick={generarToken}
                style={{ padding: "0.75rem", backgroundColor: "#e2e8f0", color: "#475569", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 500 }}
                title="Generar nuevo token aleatorio"
              >
                <RefreshCw size={18} /> Generar
              </button>
              <button 
                onClick={copiarPortapapeles}
                style={{ padding: "0.75rem", backgroundColor: "white", color: "#475569", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 500 }}
              >
                <Copy size={18} /> Copiar
              </button>
            </div>
            <p style={{ margin: "0.75rem 0 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Este token debe ser enviado en el Header <code style={{ backgroundColor: "#e2e8f0", padding: "0.1rem 0.3rem", borderRadius: "3px" }}>Authorization: Bearer [TOKEN]</code> en todas las peticiones externas.
            </p>
          </div>

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

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button 
              onClick={handleSave}
              disabled={saving || token === originalToken || !token.trim()}
              className={styles.btnPrimary} 
              style={{ margin: 0, padding: "0.75rem 2rem", width: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
              Guardar Cambios
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
