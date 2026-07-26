"use client";

import { useState, useEffect } from "react";
import styles from "../../page.module.css";

interface Unidad {
  id: number;
  nombre: string;
  siglas: string | null;
  creadoEn: string;
}

export default function UnidadesPage() {
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create state
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [siglas, setSiglas] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  // Edit modal state
  const [editingUnidad, setEditingUnidad] = useState<Unidad | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editSiglas, setEditSiglas] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete modal state
  const [deletingUnidad, setDeletingUnidad] = useState<Unidad | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchUnidades = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/unidades");
      if (res.ok) {
        const data = await res.json();
        setUnidades(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnidades();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError("");

    try {
      const res = await fetch("/api/unidades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, siglas }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear la unidad");
      } else {
        setNombre("");
        setSiglas("");
        setShowForm(false);
        fetchUnidades();
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setSubmitLoading(false);
    }
  };

  const openEditModal = (unidad: Unidad) => {
    setEditingUnidad(unidad);
    setEditNombre(unidad.nombre);
    setEditSiglas(unidad.siglas || "");
    setEditError("");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnidad) return;
    
    setEditLoading(true);
    setEditError("");

    try {
      const res = await fetch(`/api/unidades/${editingUnidad.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: editNombre, siglas: editSiglas }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditError(data.error || "Error al actualizar");
      } else {
        setEditingUnidad(null);
        fetchUnidades();
      }
    } catch (err) {
      setEditError("Error de conexión");
    } finally {
      setEditLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!deletingUnidad) return;
    setDeleteLoading(true);
    setDeleteError("");
    
    try {
      const res = await fetch(`/api/unidades/${deletingUnidad.id}`, { method: "DELETE" });
      const data = await res.json();
      
      if (!res.ok) {
        setDeleteError(data.error || "Error al eliminar");
      } else {
        setDeletingUnidad(null);
        fetchUnidades();
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
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary)" }}>Catálogo de Unidades Orgánicas</h1>
          <p style={{ color: "var(--text-muted)" }}>Gestiona la estructura de la municipalidad (RF-07)</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={styles.btnPrimary} 
          style={{ width: "auto", padding: "0.5rem 1rem" }}
        >
          {showForm ? "Cancelar" : "+ Nueva Unidad"}
        </button>
      </div>

      {showForm && (
        <div className="solid-panel" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Registrar Nueva Unidad</h2>
          <form onSubmit={handleCreate} style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className={styles.formGroup} style={{ flex: 2, minWidth: "250px" }}>
              <label>Nombre del Área *</label>
              <input 
                type="text" 
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej. Gerencia de Infraestructura" 
                required 
                disabled={submitLoading}
              />
            </div>
            <div className={styles.formGroup} style={{ flex: 1, minWidth: "100px" }}>
              <label>Siglas (Opcional)</label>
              <input 
                type="text" 
                value={siglas}
                onChange={e => setSiglas(e.target.value)}
                placeholder="Ej. GI" 
                disabled={submitLoading}
              />
            </div>
            <button type="submit" className={styles.btnPrimary} style={{ width: "auto", padding: "0.75rem 1.5rem" }} disabled={submitLoading}>
              {submitLoading ? "Guardando..." : "Guardar"}
            </button>
          </form>
          {error && <div className={styles.errorMessage} style={{ marginTop: "1rem" }}>{error}</div>}
        </div>
      )}

      {/* Tabla */}
      <div className="solid-panel" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: "rgba(0,0,0,0.02)", borderBottom: "1px solid var(--border-color)" }}>
            <tr>
              <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", color: "var(--text-muted)" }}>ID</th>
              <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", color: "var(--text-muted)" }}>Nombre del Área / Dependencia</th>
              <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", color: "var(--text-muted)" }}>Siglas</th>
              <th style={{ padding: "1rem", textAlign: "right", fontSize: "0.875rem", color: "var(--text-muted)" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Cargando unidades...</td></tr>
            ) : unidades.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>No hay unidades registradas.</td></tr>
            ) : (
              unidades.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.2s" }} className="table-row-hover">
                  <td style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>#{u.id}</td>
                  <td style={{ padding: "1rem", fontWeight: 500 }}>{u.nombre}</td>
                  <td style={{ padding: "1rem" }}>
                    {u.siglas ? <span style={{ padding: "0.25rem 0.5rem", backgroundColor: "var(--surface-hover)", borderRadius: "var(--radius-md)", fontSize: "0.75rem", border: "1px solid var(--border-color)" }}>{u.siglas}</span> : <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>-</span>}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <button 
                      onClick={() => openEditModal(u)}
                      style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: "1.1rem", padding: "0.25rem", marginRight: "0.5rem" }}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => { setDeletingUnidad(u); setDeleteError(""); }}
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1.1rem", padding: "0.25rem" }}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Edición */}
      {editingUnidad && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="solid-panel" style={{ width: "100%", maxWidth: "500px", padding: "2rem", position: "relative" }}>
            <button 
              onClick={() => setEditingUnidad(null)}
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}
            >
              ×
            </button>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1.5rem", color: "var(--text-main)" }}>Editar Unidad Orgánica</h2>
            <form onSubmit={handleEdit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className={styles.formGroup}>
                <label>Nombre del Área *</label>
                <input 
                  type="text" 
                  value={editNombre}
                  onChange={e => setEditNombre(e.target.value)}
                  required 
                  disabled={editLoading}
                  style={{ width: "100%" }}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Siglas</label>
                <input 
                  type="text" 
                  value={editSiglas}
                  onChange={e => setEditSiglas(e.target.value)}
                  disabled={editLoading}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setEditingUnidad(null)} className={styles.btnSecondary} style={{ width: "auto", margin: 0, padding: "0.75rem 1.5rem" }}>Cancelar</button>
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
      {deletingUnidad && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="solid-panel" style={{ width: "100%", maxWidth: "450px", padding: "2rem", position: "relative", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem", color: "var(--text-main)" }}>¿Eliminar Unidad Orgánica?</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Estás a punto de eliminar permanentemente la unidad: <br/>
              <strong style={{ color: "var(--text-main)", fontSize: "1.1rem" }}>{deletingUnidad.nombre}</strong>
            </p>
            
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
              <button 
                type="button" 
                onClick={() => setDeletingUnidad(null)} 
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
