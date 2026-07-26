"use client";

import React, { useState } from "react";
import { Database, Download, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import styles from "../../page.module.css";

export default function BackupPage() {
  const [downloading, setDownloading] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  const handleDownloadBackup = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/sistema/backup');
      if (!res.ok) throw new Error('Error al descargar');
      
      // Convertir la respuesta a blob para forzar la descarga en el navegador
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_muni_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      setLastBackup(new Date().toLocaleString('es-PE'));
    } catch (error) {
      console.error(error);
      alert("Hubo un error al intentar generar la copia de seguridad.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 0.5rem 0" }}>
            <Database size={24} />
            Copias de Seguridad (Backups)
          </h1>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>Gestione los respaldos de la base de datos del sistema para prevención de pérdida de información.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
        
        {/* Panel Principal de Acción */}
        <div className="solid-panel" style={{ padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ padding: "1.5rem", backgroundColor: "#f0fdf4", borderRadius: "50%", color: "#16a34a", marginBottom: "1.5rem" }}>
            <ShieldCheck size={48} />
          </div>
          <h2 style={{ fontSize: "1.25rem", margin: "0 0 1rem 0", color: "var(--text-main)" }}>Copia de Seguridad Manual</h2>
          <p style={{ color: "var(--text-color)", marginBottom: "2rem", lineHeight: "1.5" }}>
            Genera un archivo JSON con la totalidad de los registros de expedientes, usuarios, auditorías y configuraciones. Este archivo sirve como respaldo "en frío" para restauraciones.
          </p>
          
          <button 
            onClick={handleDownloadBackup}
            disabled={downloading}
            className={styles.btnPrimary}
            style={{ width: "100%", padding: "1rem", fontSize: "1rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
          >
            {downloading ? (
              <>
                <Loader2 size={20} className="spin" /> Procesando volcado de datos...
              </>
            ) : (
              <>
                <Download size={20} /> Generar y Descargar Backup
              </>
            )}
          </button>

          {lastBackup && (
            <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#16a34a", fontWeight: 500 }}>
              Último backup exitoso: {lastBackup}
            </p>
          )}
        </div>

        {/* Panel de Información Adicional */}
        <div className="solid-panel" style={{ padding: "2rem", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#334155", margin: "0 0 1.5rem 0" }}>
            <AlertTriangle size={20} color="#f59e0b" /> Recomendaciones
          </h3>
          
          <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
            <li style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--primary)", marginTop: "0.4rem", flexShrink: 0 }}></div>
              <p style={{ margin: 0, fontSize: "0.95rem", color: "#475569", lineHeight: "1.5" }}>
                <strong>Frecuencia:</strong> Se recomienda realizar esta copia de seguridad manual al menos una vez por semana.
              </p>
            </li>
            <li style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--primary)", marginTop: "0.4rem", flexShrink: 0 }}></div>
              <p style={{ margin: 0, fontSize: "0.95rem", color: "#475569", lineHeight: "1.5" }}>
                <strong>Almacenamiento:</strong> Guarde el archivo descargado en un disco externo o servicio en la nube seguro ajeno al servidor actual.
              </p>
            </li>
            <li style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--primary)", marginTop: "0.4rem", flexShrink: 0 }}></div>
              <p style={{ margin: 0, fontSize: "0.95rem", color: "#475569", lineHeight: "1.5" }}>
                <strong>Seguridad:</strong> El archivo contiene datos confidenciales de los expedientes. El acceso a este módulo es estrictamente monitoreado.
              </p>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}
