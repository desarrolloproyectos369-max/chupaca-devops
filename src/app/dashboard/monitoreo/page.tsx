"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Activity, Server, Database, Cpu, HardDrive, Clock, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import styles from "../../page.module.css";

export default function MonitoreoPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchMetrics = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const res = await fetch('/api/sistema/monitoreo');
      const data = await res.json();
      if (res.ok && data.success) {
        setMetrics(data.data);
        setError(null);
        setLastUpdate(new Date());
      } else {
        setError(data.error || "Error al obtener métricas");
      }
    } catch (err) {
      console.error(err);
      setError("Fallo de conexión con el servidor");
    } finally {
      setLoading(false);
      if (manual) {
        setTimeout(() => setIsRefreshing(false), 500); // Visual delay for spinner
      }
    }
  }, []);

  // Auto-refresh cada 10 segundos
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(() => fetchMetrics(), 10000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const getStatusColor = (percentage: number, isLatency: boolean = false) => {
    if (isLatency) {
      if (percentage < 100) return "#10b981"; // Green (Fast)
      if (percentage < 500) return "#f59e0b"; // Orange (Warning)
      return "#ef4444"; // Red (Slow)
    }
    if (percentage < 70) return "#10b981";
    if (percentage < 90) return "#f59e0b";
    return "#ef4444";
  };

  if (loading && !metrics) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh", flexDirection: "column", gap: "1rem" }}>
        <RefreshCw className="spin" size={32} color="var(--primary)" />
        <p style={{ color: "var(--text-muted)" }}>Conectando a los sensores del servidor...</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 0.5rem 0" }}>
            <Activity size={24} />
            Estado del Servidor
          </h1>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>Monitoreo en tiempo real del consumo y salud operativa.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </span>
          <button 
            onClick={() => fetchMetrics(true)} 
            className={styles.btnSecondary}
            style={{ margin: 0, padding: "0.5rem 1rem", width: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={isRefreshing ? "spin" : ""} />
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: "#fee2e2", color: "#dc2626", padding: "1rem", borderRadius: "var(--radius-md)", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <AlertTriangle size={20} />
          {error}
        </div>
      )}

      {metrics && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          
          {/* CPU Card */}
          <div className="solid-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: "-10px", top: "-10px", opacity: 0.05, transform: "scale(2)" }}>
              <Cpu size={100} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", zIndex: 1 }}>
              <div style={{ padding: "0.75rem", backgroundColor: "#f1f5f9", borderRadius: "0.5rem", color: "#475569" }}>
                <Cpu size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--text-main)" }}>Carga de Procesador</h3>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{metrics.servidor.nucleos} Núcleos lógicos</span>
              </div>
            </div>
            <div style={{ marginTop: "0.5rem", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                <span style={{ fontSize: "2.5rem", fontWeight: 700, color: getStatusColor(metrics.servidor.cpuPorcentaje) }}>
                  {metrics.servidor.cpuPorcentaje}%
                </span>
                <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>carga avg</span>
              </div>
              <div style={{ width: "100%", height: "8px", backgroundColor: "#e2e8f0", borderRadius: "4px", marginTop: "0.5rem", overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, Math.max(0, metrics.servidor.cpuPorcentaje))}%`, height: "100%", backgroundColor: getStatusColor(metrics.servidor.cpuPorcentaje), transition: "width 0.5s ease-in-out" }}></div>
              </div>
            </div>
          </div>

          {/* RAM Card */}
          <div className="solid-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: "-10px", top: "-10px", opacity: 0.05, transform: "scale(2)" }}>
              <HardDrive size={100} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", zIndex: 1 }}>
              <div style={{ padding: "0.75rem", backgroundColor: "#f1f5f9", borderRadius: "0.5rem", color: "#475569" }}>
                <HardDrive size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--text-main)" }}>Consumo de Memoria</h3>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Proceso Node.js (V8)</span>
              </div>
            </div>
            <div style={{ marginTop: "0.5rem", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                <span style={{ fontSize: "2.5rem", fontWeight: 700, color: getStatusColor(metrics.servidor.memoriaPorcentaje) }}>
                  {metrics.servidor.memoriaUsadaMB}
                </span>
                <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>MB / {metrics.servidor.memoriaTotalMB} MB</span>
              </div>
              <div style={{ width: "100%", height: "8px", backgroundColor: "#e2e8f0", borderRadius: "4px", marginTop: "0.5rem", overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, Math.max(0, metrics.servidor.memoriaPorcentaje))}%`, height: "100%", backgroundColor: getStatusColor(metrics.servidor.memoriaPorcentaje), transition: "width 0.5s ease-in-out" }}></div>
              </div>
            </div>
          </div>

          {/* Database Card */}
          <div className="solid-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: "-10px", top: "-10px", opacity: 0.05, transform: "scale(2)" }}>
              <Database size={100} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", zIndex: 1 }}>
              <div style={{ padding: "0.75rem", backgroundColor: metrics.baseDeDatos.estado === 'ok' ? "#dcfce7" : "#fee2e2", borderRadius: "0.5rem", color: metrics.baseDeDatos.estado === 'ok' ? "#16a34a" : "#dc2626" }}>
                <Database size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--text-main)" }}>Base de Datos</h3>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>PostgreSQL Connection</span>
              </div>
            </div>
            <div style={{ marginTop: "0.5rem", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {metrics.baseDeDatos.estado === 'ok' ? (
                  <><CheckCircle size={24} color="#16a34a" /> <span style={{ fontSize: "1.25rem", fontWeight: 600, color: "#16a34a" }}>En línea</span></>
                ) : (
                  <><AlertTriangle size={24} color="#dc2626" /> <span style={{ fontSize: "1.25rem", fontWeight: 600, color: "#dc2626" }}>Error de conexión</span></>
                )}
              </div>
              <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                Latencia (Ping): 
                <strong style={{ color: getStatusColor(metrics.baseDeDatos.latenciaMs, true) }}>
                  {metrics.baseDeDatos.latenciaMs} ms
                </strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info adicional del sistema */}
      {metrics && (
        <div className="solid-panel" style={{ padding: "1.5rem", backgroundColor: "#f8fafc", display: "flex", flexWrap: "wrap", gap: "2rem", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Clock size={20} color="#64748b" />
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Tiempo en línea (Uptime)</div>
              <div style={{ color: "#334155", fontWeight: 500 }}>{formatUptime(metrics.servidor.uptimeSegundos)}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Server size={20} color="#64748b" />
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Plataforma</div>
              <div style={{ color: "#334155", fontWeight: 500 }}>{metrics.servidor.plataforma} (Node {metrics.servidor.versionNode})</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
