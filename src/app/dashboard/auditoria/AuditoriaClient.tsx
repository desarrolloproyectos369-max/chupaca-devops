"use client";

import { useState, useEffect } from "react";
import { Search, Shield, Download, Filter, RefreshCw, AlertTriangle } from "lucide-react";

export default function AuditoriaClient() {
  const [registros, setRegistros] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  
  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [moduloFiltro, setModuloFiltro] = useState("TODOS");

  const cargarDatos = async () => {
    setCargando(true);
    setError("");
    try {
      const res = await fetch("/api/auditoria");
      if (!res.ok) throw new Error("No se pudieron cargar los registros");
      const data = await res.json();
      setRegistros(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const modulosUnicos = Array.from(new Set(registros.map(r => r.modulo)));

  const registrosFiltrados = registros.filter(r => {
    const coincideBusqueda = 
      (r.accion?.toLowerCase().includes(busqueda.toLowerCase())) ||
      (r.detalles?.toLowerCase().includes(busqueda.toLowerCase())) ||
      (r.usuario?.nombres?.toLowerCase().includes(busqueda.toLowerCase())) ||
      (r.usuario?.apellidos?.toLowerCase().includes(busqueda.toLowerCase()));
    
    const coincideModulo = moduloFiltro === "TODOS" || r.modulo === moduloFiltro;

    return coincideBusqueda && coincideModulo;
  });

  const exportarCSV = () => {
    const encabezados = ["ID", "Fecha", "Usuario", "Módulo", "Acción", "Detalles", "IP"];
    const filas = registrosFiltrados.map(r => [
      r.id,
      new Date(r.creadoEn).toLocaleString('es-PE'),
      r.usuario ? `${r.usuario.nombres} ${r.usuario.apellidos}` : "Sistema",
      r.modulo,
      r.accion,
      `"${(r.detalles || "").replace(/"/g, '""')}"`, // Escapar comillas
      r.ip || "N/A"
    ]);

    const csvContent = [encabezados.join(","), ...filas.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `auditoria_municipalidad_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: "1rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 0.5rem 0" }}>
            <Shield size={24} />
            Bitácora de Auditoría
          </h1>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>
            Registro inmutable de actividades y movimientos del sistema (Últimos 200 eventos).
          </p>
        </div>
        
        <button 
          onClick={exportarCSV}
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.75rem 1.25rem",
            backgroundColor: "white",
            color: "var(--text-color)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            fontWeight: 500,
            transition: "all 0.2s",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = "#f8fafc"}
          onMouseOut={e => e.currentTarget.style.backgroundColor = "white"}
        >
          <Download size={18} />
          Exportar CSV
        </button>
      </div>

      <div style={{ 
        backgroundColor: "var(--surface-color)", 
        borderRadius: "var(--radius-lg)", 
        border: "1px solid var(--border-color)",
        overflow: "hidden",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
      }}>
        
        {/* Barra de herramientas */}
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", backgroundColor: "#f8fafc" }}>
          
          <div style={{ flex: 1, minWidth: "250px", position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input 
              type="text"
              placeholder="Buscar por usuario, acción o detalles..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem 0.75rem 2.75rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                outline: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Filter size={18} color="var(--text-muted)" />
            <select
              value={moduloFiltro}
              onChange={(e) => setModuloFiltro(e.target.value)}
              style={{
                padding: "0.75rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                outline: "none",
                backgroundColor: "white",
                cursor: "pointer"
              }}
            >
              <option value="TODOS">Todos los Módulos</option>
              {modulosUnicos.map(mod => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={cargarDatos}
            style={{
              padding: "0.75rem",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "white"
            }}
            title="Refrescar datos"
          >
            <RefreshCw size={18} color="var(--text-muted)" style={{ animation: cargando ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>

        {/* Tabla */}
        <div style={{ overflowX: "auto" }}>
          {error && (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--danger)", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <AlertTriangle size={32} />
              <p>{error}</p>
            </div>
          )}

          {!error && (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f1f5f9", textAlign: "left" }}>
                  <th style={{ padding: "1rem 1.5rem", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.875rem", borderBottom: "1px solid var(--border-color)" }}>Fecha y Hora</th>
                  <th style={{ padding: "1rem 1.5rem", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.875rem", borderBottom: "1px solid var(--border-color)" }}>Usuario</th>
                  <th style={{ padding: "1rem 1.5rem", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.875rem", borderBottom: "1px solid var(--border-color)" }}>Módulo</th>
                  <th style={{ padding: "1rem 1.5rem", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.875rem", borderBottom: "1px solid var(--border-color)" }}>Acción</th>
                  <th style={{ padding: "1rem 1.5rem", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.875rem", borderBottom: "1px solid var(--border-color)" }}>Detalles</th>
                  <th style={{ padding: "1rem 1.5rem", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.875rem", borderBottom: "1px solid var(--border-color)" }}>IP</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                      Cargando bitácora inmutable...
                    </td>
                  </tr>
                ) : registrosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                      No se encontraron registros de auditoría que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  registrosFiltrados.map((r, i) => (
                    <tr 
                      key={r.id} 
                      style={{ 
                        borderBottom: "1px solid var(--border-color)",
                        backgroundColor: i % 2 === 0 ? "white" : "#fafafa",
                        transition: "background-color 0.2s"
                      }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = "#f0f9ff"}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? "white" : "#fafafa"}
                    >
                      <td style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", color: "var(--text-color)", whiteSpace: "nowrap" }}>
                        {new Date(r.creadoEn).toLocaleString('es-PE')}
                      </td>
                      <td style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", fontWeight: 500 }}>
                        {r.usuario ? `${r.usuario.nombres} ${r.usuario.apellidos}` : <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Sistema</span>}
                      </td>
                      <td style={{ padding: "1rem 1.5rem", fontSize: "0.875rem" }}>
                        <span style={{ 
                          backgroundColor: "#e2e8f0", 
                          padding: "0.2rem 0.6rem", 
                          borderRadius: "1rem", 
                          fontSize: "0.75rem", 
                          fontWeight: 600,
                          color: "#475569"
                        }}>
                          {r.modulo}
                        </span>
                      </td>
                      <td style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--primary)" }}>
                        {r.accion}
                      </td>
                      <td style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", color: "var(--text-muted)", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.detalles}>
                        {r.detalles}
                      </td>
                      <td style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                        {r.ip || "N/A"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Footer */}
        {!cargando && (
          <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border-color)", backgroundColor: "#f8fafc", fontSize: "0.875rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
            <span>Mostrando {registrosFiltrados.length} eventos inmutables.</span>
            <span>Seguridad Transaccional Activa <Shield size={14} style={{display: 'inline', verticalAlign: 'middle', marginLeft: '4px'}} /></span>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
