"use client";

import { useState, useEffect } from "react";
import { Inbox, FileText, User, Upload, CheckCircle2, FileUp, AlertCircle, ArrowRight } from "lucide-react";
import styles from "../../page.module.css";
import Link from "next/link";

interface TipoDocumental {
  id: number;
  nombre: string;
  requisitos: string[] | null;
}

export default function RecepcionPage() {
  const [tipos, setTipos] = useState<TipoDocumental[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Datos del Documento
  const [tipoDocumentalId, setTipoDocumentalId] = useState("");
  const [selectedTipo, setSelectedTipo] = useState<TipoDocumental | null>(null);
  const [checkedRequisitos, setCheckedRequisitos] = useState<boolean[]>([]);
  const [asunto, setAsunto] = useState("");
  const [folios, setFolios] = useState("1");
  
  // Datos del Remitente
  const [dniRemitente, setDniRemitente] = useState("");
  const [nombresRemitente, setNombresRemitente] = useState("");
  const [apellidosRemitente, setApellidosRemitente] = useState("");
  const [correoRemitente, setCorreoRemitente] = useState("");
  const [telefonoRemitente, setTelefonoRemitente] = useState("");
  
  // Archivo
  const [archivo, setArchivo] = useState<File | null>(null);

  // Success State
  const [codigoGenerado, setCodigoGenerado] = useState("");

  useEffect(() => {
    fetch("/api/tipos")
      .then(res => res.json())
      .then(data => {
        setTipos(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setArchivo(file);
      } else {
        alert("Por favor, suba únicamente archivos PDF.");
        e.target.value = "";
        setArchivo(null);
      }
    }
  };

  const handleTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setTipoDocumentalId(val);
    const tipo = tipos.find(t => t.id.toString() === val);
    setSelectedTipo(tipo || null);
    if (tipo && tipo.requisitos && tipo.requisitos.length > 0) {
      setCheckedRequisitos(new Array(tipo.requisitos.length).fill(false));
    } else {
      setCheckedRequisitos([]);
    }
  };

  const handleCheckboxChange = (index: number) => {
    const newChecked = [...checkedRequisitos];
    newChecked[index] = !newChecked[index];
    setCheckedRequisitos(newChecked);
  };

  const isFormValid = () => {
    if (!selectedTipo) return false;
    if (selectedTipo.requisitos && selectedTipo.requisitos.length > 0) {
      // Todos deben estar en true
      return checkedRequisitos.every(v => v === true);
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const formData = new FormData();
      formData.append("tipoDocumentalId", tipoDocumentalId);
      formData.append("asunto", asunto);
      formData.append("folios", folios);
      formData.append("dniRemitente", dniRemitente);
      formData.append("nombresRemitente", nombresRemitente);
      formData.append("apellidosRemitente", apellidosRemitente);
      if (correoRemitente) formData.append("correoRemitente", correoRemitente);
      if (telefonoRemitente) formData.append("telefonoRemitente", telefonoRemitente);
      if (archivo) formData.append("archivo", archivo);

      const res = await fetch("/api/expedientes", {
        method: "POST",
        body: formData // No se envía Content-Type, el navegador lo calcula automáticamente para multipart/form-data
      });

      const data = await res.json();

      if (res.ok) {
        setCodigoGenerado(data.codigo);
        // Limpiar formulario
        setTipoDocumentalId("");
        setAsunto("");
        setFolios("1");
        setDniRemitente("");
        setNombresRemitente("");
        setApellidosRemitente("");
        setCorreoRemitente("");
        setTelefonoRemitente("");
        setArchivo(null);
        setSelectedTipo(null);
        setCheckedRequisitos([]);
      } else {
        alert(data.error || "Ocurrió un error al registrar el expediente.");
      }
    } catch (err) {
      alert("Error de conexión al servidor.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (codigoGenerado) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <CheckCircle2 size={80} color="#10b981" style={{ marginBottom: "1.5rem" }} />
        <h1 style={{ fontSize: "2rem", color: "var(--text-main)", marginBottom: "0.5rem" }}>¡Expediente Registrado!</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", marginBottom: "2rem" }}>
          Por favor anote el siguiente código en el documento físico del ciudadano:
        </p>
        <div style={{ backgroundColor: "#f0fdf4", border: "2px dashed #166534", padding: "1.5rem 3rem", borderRadius: "var(--radius-lg)", marginBottom: "2rem" }}>
          <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "#166534", letterSpacing: "2px" }}>
            {codigoGenerado}
          </span>
        </div>
        
        <Link 
          href="/dashboard/bandeja" 
          className={styles.btnPrimary} 
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "1rem 2rem", fontSize: "1.1rem" }}
        >
          Ir a Mi Bandeja para Derivar <ArrowRight size={20} />
        </Link>
        
        <button 
          onClick={() => setCodigoGenerado("")} 
          className={styles.btnSecondary} 
          style={{ marginTop: "1.5rem", border: "none", backgroundColor: "transparent", color: "var(--primary)" }}
        >
          Registrar otro expediente
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Inbox size={24} /> Recepción de Expedientes (Mesa de Partes)
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "0.25rem" }}>
          Registro oficial de documentos entrantes (RF-09)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="solid-panel" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        
        {/* BLOQUE 1: Datos del Documento */}
        <section>
          <h2 style={{ fontSize: "1.1rem", color: "var(--primary)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
            <FileText size={20} /> 1. Datos del Documento
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", alignItems: "start" }}>
            <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
              <label>Tipo de Documento *</label>
              <select value={tipoDocumentalId} onChange={handleTipoChange} required disabled={submitLoading || loading}>
                <option value="">-- Seleccionar Tipo --</option>
                {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>

            {selectedTipo && selectedTipo.requisitos && selectedTipo.requisitos.length > 0 && (
              <div style={{ gridColumn: "1 / -1", backgroundColor: "#fffbeb", border: "1px solid #f59e0b", padding: "1.5rem", borderRadius: "var(--radius-md)" }}>
                <h3 style={{ fontSize: "1rem", color: "#b45309", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <AlertCircle size={20} /> Validar Requisitos Obligatorios
                </h3>
                <p style={{ fontSize: "0.875rem", color: "#92400e", marginBottom: "1rem" }}>
                  Para registrar este trámite, el ciudadano debió adjuntar físicamente los siguientes documentos. Marque cada casilla para confirmar la recepción:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {selectedTipo.requisitos.map((req, idx) => (
                    <label key={idx} style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", padding: "0.5rem", backgroundColor: "white", borderRadius: "var(--radius-md)", border: "1px solid #fcd34d" }}>
                      <input 
                        type="checkbox" 
                        checked={checkedRequisitos[idx]} 
                        onChange={() => handleCheckboxChange(idx)} 
                        style={{ width: "1.25rem", height: "1.25rem", accentColor: "#f59e0b" }}
                      />
                      <span style={{ fontSize: "0.9rem", color: "var(--text-main)", fontWeight: checkedRequisitos[idx] ? 600 : 400 }}>
                        {req}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
              <label>Asunto (Resumen del trámite) *</label>
              <textarea 
                value={asunto} 
                onChange={e => setAsunto(e.target.value)} 
                required 
                disabled={submitLoading} 
                rows={3}
                placeholder="Escriba de manera clara y concisa el motivo del documento..."
              />
            </div>
            <div className={styles.formGroup}>
              <label>Cantidad de Folios (Hojas) *</label>
              <input type="number" min="1" value={folios} onChange={e => setFolios(e.target.value)} required disabled={submitLoading} />
            </div>
          </div>
        </section>

        {/* BLOQUE 2: Datos del Remitente */}
        <section>
          <h2 style={{ fontSize: "1.1rem", color: "var(--primary)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
            <User size={20} /> 2. Datos del Remitente (Ciudadano / Entidad)
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", alignItems: "start" }}>
            <div className={styles.formGroup}>
              <label>DNI / RUC *</label>
              <input type="text" maxLength={11} value={dniRemitente} onChange={e => setDniRemitente(e.target.value)} required disabled={submitLoading} />
            </div>
            <div className={styles.formGroup}>
              <label>Nombres / Razón Social *</label>
              <input type="text" value={nombresRemitente} onChange={e => setNombresRemitente(e.target.value)} required disabled={submitLoading} />
            </div>
            <div className={styles.formGroup}>
              <label>Apellidos * (Dejar vacío si es empresa)</label>
              <input type="text" value={apellidosRemitente} onChange={e => setApellidosRemitente(e.target.value)} required disabled={submitLoading} />
            </div>
            <div className={styles.formGroup}>
              <label>Correo Electrónico</label>
              <input type="email" value={correoRemitente} onChange={e => setCorreoRemitente(e.target.value)} disabled={submitLoading} placeholder="Para notificaciones" />
            </div>
            <div className={styles.formGroup}>
              <label>Teléfono / Celular</label>
              <input type="text" value={telefonoRemitente} onChange={e => setTelefonoRemitente(e.target.value)} disabled={submitLoading} />
            </div>
          </div>
        </section>

        {/* BLOQUE 3: Archivo Adjunto */}
        <section>
          <h2 style={{ fontSize: "1.1rem", color: "var(--primary)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
            <Upload size={20} /> 3. Archivo Adjunto Digitalizado (Opcional)
          </h2>
          <div className={styles.formGroup}>
            <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "2px dashed var(--border-color)", borderRadius: "var(--radius-lg)", padding: "3rem", cursor: "pointer", backgroundColor: "#fafafa", transition: "all 0.2s" }} className="file-drop-area">
              <FileUp size={40} color="var(--text-muted)" style={{ marginBottom: "1rem" }} />
              <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-main)" }}>
                {archivo ? archivo.name : "Seleccionar documento PDF"}
              </span>
              <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                {archivo ? `${(archivo.size / 1024 / 1024).toFixed(2)} MB` : "Click para buscar en sus archivos (Max. 10MB)"}
              </span>
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={handleFileChange} 
                style={{ display: "none" }} 
                disabled={submitLoading}
              />
            </label>
          </div>
        </section>

        <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
          <button 
            type="submit" 
            className={styles.btnPrimary} 
            style={{ fontSize: "1.1rem", padding: "1rem 4rem", width: "100%", maxWidth: "400px", opacity: !isFormValid() ? 0.5 : 1, cursor: !isFormValid() ? "not-allowed" : "pointer" }} 
            disabled={submitLoading || !isFormValid()}
          >
            {submitLoading ? "Registrando y generando código..." : "Registrar Expediente Oficial"}
          </button>
        </div>

      </form>
      
      <style dangerouslySetInnerHTML={{__html: `
        .file-drop-area:hover {
          border-color: var(--primary) !important;
          background-color: #f0fdf4 !important;
        }
      `}} />
    </div>
  );
}
