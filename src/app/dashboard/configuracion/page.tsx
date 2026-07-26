"use client";

import { useState, useEffect } from "react";
import { Settings, Save } from "lucide-react";
import styles from "../../page.module.css";

interface Configuracion {
  id: number;
  clave: string;
  valor: string;
  descripcion: string | null;
}

export default function ConfiguracionPage() {
  const [configs, setConfigs] = useState<Configuracion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/configuracion");
      if (res.ok) {
        setConfigs(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleChange = (clave: string, valor: string) => {
    setConfigs(prev => prev.map(c => c.clave === clave ? { ...c, valor } : c));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      // Enviamos solo las claves y valores
      const payload = configs.map(c => ({ clave: c.clave, valor: c.valor }));
      
      const res = await fetch("/api/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage({ text: "Parámetros actualizados exitosamente", type: "success" });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      } else {
        const data = await res.json();
        setMessage({ text: data.error || "Error al actualizar", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Error de conexión", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Settings size={24} /> Parámetros del Sistema
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Configuración global de la plataforma (RF-35)
          </p>
        </div>
      </div>

      <div className="solid-panel" style={{ padding: "2rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Cargando parámetros...</div>
        ) : (
          <form onSubmit={handleSave}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {configs.map(config => (
                <div key={config.id} className={styles.formGroup}>
                  <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "0.25rem" }}>
                    {config.clave.replace(/_/g, ' ')}
                  </label>
                  {config.descripcion && (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem", display: "block" }}>
                      {config.descripcion}
                    </span>
                  )}
                  <input 
                    type="text" 
                    value={config.valor} 
                    onChange={e => handleChange(config.clave, e.target.value)}
                    disabled={saving}
                    style={{ backgroundColor: "var(--surface-color)" }}
                  />
                </div>
              ))}
            </div>

            {message.text && (
              <div style={{ 
                marginTop: "1.5rem", 
                padding: "1rem", 
                borderRadius: "var(--radius-md)", 
                backgroundColor: message.type === "success" ? "#dcfce7" : "#fee2e2",
                color: message.type === "success" ? "#166534" : "#991b1b",
                fontWeight: 500,
                textAlign: "center"
              }}>
                {message.text}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border-color)" }}>
              <button 
                type="submit" 
                className={styles.btnPrimary} 
                style={{ width: "auto", padding: "0.75rem 2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
                disabled={saving}
              >
                <Save size={18} />
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
