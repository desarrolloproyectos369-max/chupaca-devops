"use client";

import { useState, useEffect } from "react";
import { Edit2, Trash2, AlertTriangle, Plus, X, ListChecks } from "lucide-react";
import styles from "../../page.module.css";

interface TipoDocumental {
  id: number;
  nombre: string;
  descripcion: string | null;
  plazoDias: number;
  requisitos: string[] | null;
  creadoEn: string;
}

export default function TiposDocumentalesPage() {
  const [tipos, setTipos] = useState<TipoDocumental[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create state
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [plazoDias, setPlazoDias] = useState<number | "">("");
  const [requisitos, setRequisitos] = useState<string[]>([]);
  const [nuevoRequisito, setNuevoRequisito] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  // Edit modal state
  const [editingTipo, setEditingTipo] = useState<TipoDocumental | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editPlazo, setEditPlazo] = useState<number | "">("");
  const [editRequisitos, setEditRequisitos] = useState<string[]>([]);
  const [editNuevoRequisito, setEditNuevoRequisito] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete modal state
  const [deletingTipo, setDeletingTipo] = useState<TipoDocumental | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchTipos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tipos");
      if (res.ok) {
        const data = await res.json();
        setTipos(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTipos();
  }, []);

  const handleAddRequisito = () => {
    if (nuevoRequisito.trim() !== "") {
      setRequisitos([...requisitos, nuevoRequisito.trim()]);
      setNuevoRequisito("");
    }
  };

  const handleAddEditRequisito = () => {
    if (editNuevoRequisito.trim() !== "") {
      setEditRequisitos([...editRequisitos, editNuevoRequisito.trim()]);
      setEditNuevoRequisito("");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError("");

    try {
      const res = await fetch("/api/tipos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          nombre, 
          descripcion, 
          plazoDias: plazoDias === "" ? 30 : plazoDias,
          requisitos
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear el tipo de trámite");
      } else {
        setNombre("");
        setDescripcion("");
        setPlazoDias("");
        setRequisitos([]);
        setShowForm(false);
        fetchTipos();
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setSubmitLoading(false);
    }
  };

  const openEditModal = (tipo: TipoDocumental) => {
    setEditingTipo(tipo);
    setEditNombre(tipo.nombre);
    setEditDescripcion(tipo.descripcion || "");
    setEditPlazo(tipo.plazoDias);
    setEditRequisitos(tipo.requisitos || []);
    setEditNuevoRequisito("");
    setEditError("");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTipo) return;
    
    setEditLoading(true);
    setEditError("");

    try {
      const res = await fetch(`/api/tipos/${editingTipo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          nombre: editNombre, 
          descripcion: editDescripcion,
          plazoDias: editPlazo === "" ? 30 : editPlazo,
          requisitos: editRequisitos
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditError(data.error || "Error al actualizar");
      } else {
        setEditingTipo(null);
        fetchTipos();
      }
    } catch (err) {
      setEditError("Error de conexión");
    } finally {
      setEditLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!deletingTipo) return;
    setDeleteLoading(true);
    setDeleteError("");
    
    try {
      const res = await fetch(`/api/tipos/${deletingTipo.id}`, { method: "DELETE" });
      const data = await res.json();
      
      if (!res.ok) {
        setDeleteError(data.error || "Error al eliminar");
      } else {
        setDeletingTipo(null);
        fetchTipos();
      }
    } catch (err) {
      setDeleteError("Error de conexión al eliminar");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary)" }}>Tipos Documentales</h1>
          <p style={{ color: "var(--text-muted)" }}>Catálogo de documentos permitidos (RF-08) y Validación de Requisitos (RF-11)</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={styles.btnPrimary} 
          style={{ width: "auto", padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          {showForm ? "Cancelar" : <><Plus size={18}/> Nuevo Tipo</>}
        </button>
      </div>

      {showForm && (
        <div className="solid-panel" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>Registrar Tipo de Documento</h2>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div className={styles.formGroup} style={{ flex: 2, minWidth: "200px" }}>
                <label>Nombre del Documento *</label>
                <input 
                  type="text" 
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej. Licencia de Funcionamiento" 
                  required 
                  disabled={submitLoading}
                />
              </div>
              <div className={styles.formGroup} style={{ flex: 3, minWidth: "250px" }}>
                <label>Descripción (Opcional)</label>
                <textarea 
                  rows={2}
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Propósito del documento" 
                  disabled={submitLoading}
                  style={{ width: "100%", height: "42px", resize: "vertical" }}
                />
              </div>
              <div className={styles.formGroup} style={{ flex: 1, minWidth: "120px" }}>
                <label>Plazo (Días)</label>
                <input 
                  type="number" 
                  min="1"
                  max="365"
                  value={plazoDias}
                  onChange={e => setPlazoDias(e.target.value ? parseInt(e.target.value) : "")}
                  placeholder="30" 
                  disabled={submitLoading}
                />
              </div>
            </div>

            {/* SECCIÓN REQUISITOS RF-11 */}
            <div style={{ backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "0.9rem", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <ListChecks size={18} /> Requisitos Obligatorios (Opcional)
              </h3>
              
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <input 
                  type="text" 
                  value={nuevoRequisito}
                  onChange={e => setNuevoRequisito(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddRequisito(); } }}
                  placeholder="Ej: Copia legalizada de DNI..."
                  style={{ flex: 1, padding: "0.5rem 1rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }}
                  disabled={submitLoading}
                />
                <button 
                  type="button" 
                  onClick={handleAddRequisito}
                  className={styles.btnSecondary}
                  style={{ margin: 0, padding: "0.5rem 1rem", width: "auto" }}
                  disabled={submitLoading || nuevoRequisito.trim() === ""}
                >
                  Agregar
                </button>
              </div>

              {requisitos.length > 0 && (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {requisitos.map((req, idx) => (
                    <li key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "white", padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                      <span style={{ fontSize: "0.875rem", color: "var(--text-main)" }}>{idx + 1}. {req}</span>
                      <button 
                        type="button"
                        onClick={() => setRequisitos(requisitos.filter((_, i) => i !== idx))}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}
                      >
                        <X size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className={styles.btnPrimary} style={{ width: "auto", padding: "0.75rem 2rem" }} disabled={submitLoading}>
                {submitLoading ? "Guardando..." : "Guardar Tipo Documental"}
              </button>
            </div>
          </form>
          {error && <div className={styles.errorMessage} style={{ marginTop: "1rem" }}>{error}</div>}
        </div>
      )}

      {/* Tabla */}
      <div className="solid-panel" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: "rgba(0,0,0,0.02)", borderBottom: "1px solid var(--border-color)" }}>
            <tr>
              <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", color: "var(--text-muted)" }}>Tipo de Documento</th>
              <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", color: "var(--text-muted)" }}>Descripción</th>
              <th style={{ padding: "1rem", textAlign: "center", fontSize: "0.875rem", color: "var(--text-muted)" }}>Requisitos</th>
              <th style={{ padding: "1rem", textAlign: "center", fontSize: "0.875rem", color: "var(--text-muted)", width: "120px" }}>Plazo</th>
              <th style={{ padding: "1rem", textAlign: "right", fontSize: "0.875rem", color: "var(--text-muted)", width: "100px" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Cargando tipos de documentos...</td></tr>
            ) : tipos.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>No hay documentos registrados.</td></tr>
            ) : (
              tipos.map(t => (
                <tr key={t.id} style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.2s" }} className="table-row-hover">
                  <td style={{ padding: "1rem", fontWeight: 500 }}>{t.nombre}</td>
                  <td style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                    {t.descripcion || "-"}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "center" }}>
                    {t.requisitos && t.requisitos.length > 0 ? (
                      <span style={{ padding: "0.25rem 0.75rem", backgroundColor: "#e0e7ff", color: "#3730a3", borderRadius: "var(--radius-full)", fontSize: "0.75rem", fontWeight: 600 }}>
                        {t.requisitos.length} exigidos
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Ninguno</span>
                    )}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "center" }}>
                    <span style={{ padding: "0.25rem 0.5rem", backgroundColor: "var(--surface-hover)", borderRadius: "var(--radius-md)", fontSize: "0.75rem", border: "1px solid var(--border-color)" }}>
                      {t.plazoDias} días
                    </span>
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <button 
                      onClick={() => openEditModal(t)}
                      style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", padding: "0.25rem", marginRight: "0.5rem" }}
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => { setDeletingTipo(t); setDeleteError(""); }}
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "0.25rem" }}
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Edición */}
      {editingTipo && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="solid-panel" style={{ width: "100%", maxWidth: "600px", padding: "2rem", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
            <button 
              onClick={() => setEditingTipo(null)}
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}
            >
              ×
            </button>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1.5rem", color: "var(--text-main)", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>Editar Tipo de Documento</h2>
            <form onSubmit={handleEdit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "1rem" }}>
                <div className={styles.formGroup} style={{ flex: 2 }}>
                  <label>Nombre del Documento *</label>
                  <input 
                    type="text" 
                    value={editNombre}
                    onChange={e => setEditNombre(e.target.value)}
                    required 
                    disabled={editLoading}
                    style={{ width: "100%" }}
                  />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Plazo (días)</label>
                  <input 
                    type="number" 
                    min="1"
                    max="365"
                    value={editPlazo}
                    onChange={e => setEditPlazo(e.target.value ? parseInt(e.target.value) : "")}
                    disabled={editLoading}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label>Descripción</label>
                <textarea 
                  rows={2}
                  value={editDescripcion}
                  onChange={e => setEditDescripcion(e.target.value)}
                  disabled={editLoading}
                  style={{ width: "100%" }}
                />
              </div>

              {/* EDICION DE REQUISITOS */}
              <div style={{ backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid #e2e8f0", marginTop: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "0.5rem", display: "block" }}>Requisitos Obligatorios</label>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                  <input 
                    type="text" 
                    value={editNuevoRequisito}
                    onChange={e => setEditNuevoRequisito(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddEditRequisito(); } }}
                    placeholder="Nuevo requisito..."
                    style={{ flex: 1, padding: "0.5rem 1rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }}
                    disabled={editLoading}
                  />
                  <button 
                    type="button" 
                    onClick={handleAddEditRequisito}
                    className={styles.btnSecondary}
                    style={{ margin: 0, padding: "0.5rem 1rem", width: "auto" }}
                    disabled={editLoading || editNuevoRequisito.trim() === ""}
                  >
                    Agregar
                  </button>
                </div>
                {editRequisitos.length > 0 && (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {editRequisitos.map((req, idx) => (
                      <li key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "white", padding: "0.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                        <span style={{ fontSize: "0.875rem", color: "var(--text-main)" }}>{idx + 1}. {req}</span>
                        <button 
                          type="button"
                          onClick={() => setEditRequisitos(editRequisitos.filter((_, i) => i !== idx))}
                          style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}
                        >
                          <X size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1.5rem" }}>
                <button type="button" onClick={() => setEditingTipo(null)} className={styles.btnSecondary} style={{ width: "auto", margin: 0, padding: "0.75rem 1.5rem" }}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary} style={{ width: "auto", padding: "0.75rem 1.5rem" }} disabled={editLoading}>
                  {editLoading ? "Actualizando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
            {editError && <div className={styles.errorMessage} style={{ marginTop: "1rem" }}>{editError}</div>}
          </div>
        </div>
      )}

      {/* Modal de Eliminación */}
      {deletingTipo && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="solid-panel" style={{ width: "100%", maxWidth: "450px", padding: "2rem", position: "relative", textAlign: "center" }}>
            <div style={{ color: "#f59e0b", display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
              <AlertTriangle size={48} />
            </div>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem", color: "var(--text-main)" }}>¿Eliminar Tipo Documental?</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Estás a punto de eliminar permanentemente: <br/>
              <strong style={{ color: "var(--text-main)", fontSize: "1.1rem" }}>{deletingTipo.nombre}</strong>
            </p>
            
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
              <button 
                type="button" 
                onClick={() => setDeletingTipo(null)} 
                className={styles.btnSecondary} 
                style={{ width: "120px", margin: 0, padding: "0.75rem 1.5rem" }}
                disabled={deleteLoading}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={executeDelete} 
                style={{ width: "120px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "var(--radius-md)", fontWeight: "500", cursor: "pointer", transition: "background-color 0.2s" }} 
                disabled={deleteLoading}
              >
                {deleteLoading ? "Procesando..." : "Sí, Eliminar"}
              </button>
            </div>
            {deleteError && <div className={styles.errorMessage} style={{ marginTop: "1.5rem" }}>{deleteError}</div>}
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .table-row-hover:hover { background-color: rgba(var(--primary-hue), 85%, 55%, 0.05); }
      `}} />
    </div>
  );
}
