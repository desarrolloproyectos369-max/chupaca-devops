"use client";

import { useState } from "react";
import { Search, FileText, CheckCircle, Clock, AlertCircle, Calendar, ArrowRight, Building } from "lucide-react";
import Link from "next/link";

export default function ConsultaPublicaPage() {
  const [codigo, setCodigo] = useState("");
  const [dni, setDni] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo || !dni) {
      setError("Por favor, ingresa el código y tu DNI.");
      return;
    }

    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      const res = await fetch(`/api/public/consulta?codigo=${encodeURIComponent(codigo)}&dni=${encodeURIComponent(dni)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al consultar el expediente");
      }

      setResultado(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'REGISTRADO': return { bg: '#e0f2fe', text: '#0284c7', icon: <FileText size={20} /> };
      case 'EN_PROCESO': return { bg: '#fef3c7', text: '#d97706', icon: <Clock size={20} /> };
      case 'OBSERVADO': return { bg: '#fee2e2', text: '#dc2626', icon: <AlertCircle size={20} /> };
      case 'FINALIZADO': return { bg: '#dcfce7', text: '#16a34a', icon: <CheckCircle size={20} /> };
      case 'ARCHIVADO': return { bg: '#f3f4f6', text: '#4b5563', icon: <Building size={20} /> };
      default: return { bg: '#f3f4f6', text: '#4b5563', icon: <FileText size={20} /> };
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "var(--font-geist-sans)" }}>
      {/* Header Público */}
      <header style={{ backgroundColor: "white", padding: "1.25rem 2rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Building size={28} color="var(--primary)" />
          <div>
            <h1 style={{ margin: 0, fontSize: "1.25rem", color: "var(--primary)", fontWeight: 700 }}>Municipalidad Provincial</h1>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Trámite Documentario</p>
          </div>
        </div>
        <Link href="/login" style={{ fontSize: "0.875rem", color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
          Acceso Interno
        </Link>
      </header>

      <main style={{ maxWidth: "800px", margin: "3rem auto", padding: "0 1.5rem" }}>
        
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "2.5rem", color: "var(--text-color)", marginBottom: "1rem", fontWeight: 800, letterSpacing: "-0.5px" }}>Sigue tu Trámite</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", maxWidth: "500px", margin: "0 auto", lineHeight: 1.5 }}>
            Consulta el estado de tu expediente en tiempo real ingresando el código proporcionado y tu DNI por seguridad.
          </p>
        </div>

        {/* Buscador */}
        <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "1rem", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)", marginBottom: "2rem" }}>
          <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "1rem", alignItems: "end" }}>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-color)" }}>Código del Expediente</label>
              <div style={{ position: "relative" }}>
                <Search size={18} color="var(--text-muted)" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }} />
                <input 
                  type="text" 
                  placeholder="Ej: EXP-0001-2026" 
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)", fontSize: "1rem", outline: "none", boxSizing: "border-box" }}
                  required
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-color)" }}>DNI del Remitente</label>
              <div style={{ position: "relative" }}>
                <input 
                  type="text" 
                  placeholder="Tu número de DNI" 
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)", fontSize: "1rem", outline: "none", boxSizing: "border-box" }}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ padding: "0.75rem 2rem", backgroundColor: "var(--primary)", color: "white", borderRadius: "0.5rem", border: "none", fontWeight: 600, fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", gap: "0.5rem", height: "46px" }}
            >
              {loading ? "Buscando..." : "Consultar"}
            </button>
          </form>

          {error && (
            <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "#fef2f2", color: "#dc2626", borderRadius: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}
        </div>

        {/* Resultados */}
        {resultado && (
          <div style={{ animation: "fadeIn 0.4s ease-out" }}>
            <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "1rem", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.5rem", color: "var(--primary)" }}>{resultado.codigo}</h3>
                <p style={{ margin: 0, color: "var(--text-color)", fontWeight: 500 }}>{resultado.tipoDocumento} - {resultado.asunto}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><Calendar size={14} /> Ingreso: {new Date(resultado.creadoEn).toLocaleDateString()}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><FileText size={14} /> {resultado.folios} Folios</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "2rem", backgroundColor: getStatusColor(resultado.estado).bg, color: getStatusColor(resultado.estado).text, fontWeight: 700, fontSize: "0.875rem" }}>
                  {getStatusColor(resultado.estado).icon}
                  {resultado.estado}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <h4 style={{ fontSize: "1.25rem", color: "var(--text-color)", marginBottom: "1.5rem" }}>Ruta del Expediente</h4>
            
            <div style={{ position: "relative", paddingLeft: "2rem" }}>
              {/* Línea vertical */}
              <div style={{ position: "absolute", left: "7px", top: "10px", bottom: "10px", width: "2px", backgroundColor: "#e2e8f0" }}></div>
              
              {resultado.historial.map((mov: any, index: number) => {
                const isLast = index === resultado.historial.length - 1;
                return (
                  <div key={mov.id} style={{ position: "relative", marginBottom: isLast ? 0 : "2.5rem" }}>
                    {/* Punto */}
                    <div style={{ position: "absolute", left: "-2rem", top: "0.25rem", width: "16px", height: "16px", borderRadius: "50%", backgroundColor: isLast ? "var(--primary)" : "white", border: `3px solid ${isLast ? "var(--primary)" : "#cbd5e1"}`, zIndex: 1, transition: "all 0.3s" }}></div>
                    
                    <div style={{ backgroundColor: "white", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid var(--border-color)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                        <div style={{ fontWeight: 600, color: "var(--text-color)", fontSize: "1.1rem" }}>
                          {mov.estado === 'REGISTRADO' ? 'Ingreso por Mesa de Partes' : `Derivado a ${mov.unidadDestino}`}
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500, backgroundColor: "#f1f5f9", padding: "0.25rem 0.5rem", borderRadius: "0.25rem" }}>
                          {new Date(mov.fecha).toLocaleString()}
                        </span>
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "0.25rem", backgroundColor: getStatusColor(mov.estado).bg, color: getStatusColor(mov.estado).text }}>
                          {mov.estado}
                        </span>
                        {mov.instrucciones && (
                          <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                            • {mov.instrucciones}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
