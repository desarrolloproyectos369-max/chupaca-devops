"use client";

import { useState, useEffect } from "react";
import { Edit2, ShieldOff, ShieldCheck, Plus, UserX, UserCheck } from "lucide-react";
import styles from "../../page.module.css";

interface Rol {
  id: number;
  nombre: string;
}

interface Unidad {
  id: number;
  nombre: string;
}

interface Usuario {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  correo: string;
  activo: boolean;
  rolId: number;
  unidadId: number | null;
  rol: Rol;
  unidadOrganica: Unidad | null;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [dni, setDni] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [correo, setCorreo] = useState("");
  const [rolId, setRolId] = useState("");
  const [unidadId, setUnidadId] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  // Edit Modal
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editNombres, setEditNombres] = useState("");
  const [editApellidos, setEditApellidos] = useState("");
  const [editCorreo, setEditCorreo] = useState("");
  const [editRolId, setEditRolId] = useState("");
  const [editUnidadId, setEditUnidadId] = useState("");

  // Status toggle
  const [toggleLoading, setToggleLoading] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resUsr, resRol, resUni] = await Promise.all([
        fetch("/api/usuarios"),
        fetch("/api/roles"),
        fetch("/api/unidades")
      ]);
      
      if (resUsr.ok) setUsuarios(await resUsr.json());
      if (resRol.ok) setRoles(await resRol.json());
      if (resUni.ok) setUnidades(await resUni.json());
      
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError("");

    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          dni, nombres, apellidos, correo, rolId, unidadId 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear usuario");
      } else {
        setShowForm(false);
        setDni(""); setNombres(""); setApellidos(""); setCorreo(""); setRolId(""); setUnidadId("");
        fetchData();
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setSubmitLoading(false);
    }
  };

  const openEditModal = (usr: Usuario) => {
    setEditingUsuario(usr);
    setEditNombres(usr.nombres);
    setEditApellidos(usr.apellidos);
    setEditCorreo(usr.correo);
    setEditRolId(usr.rolId.toString());
    setEditUnidadId(usr.unidadId ? usr.unidadId.toString() : "");
    setEditError("");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUsuario) return;
    setEditLoading(true);
    setEditError("");

    try {
      const res = await fetch(`/api/usuarios/${editingUsuario.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          nombres: editNombres, 
          apellidos: editApellidos, 
          correo: editCorreo, 
          rolId: editRolId, 
          unidadId: editUnidadId 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditError(data.error || "Error al actualizar");
      } else {
        setEditingUsuario(null);
        fetchData();
      }
    } catch (err) {
      setEditError("Error de conexión");
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleStatus = async (usr: Usuario) => {
    if (!confirm(`¿Estás seguro de ${usr.activo ? 'desactivar' : 'activar'} a este usuario?`)) return;
    
    setToggleLoading(usr.id);
    try {
      const res = await fetch(`/api/usuarios/${usr.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !usr.activo })
      });
      
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Error al cambiar estado");
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setToggleLoading(null);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary)" }}>Gestión de Usuarios</h1>
          <p style={{ color: "var(--text-muted)" }}>Control de accesos y personal (RF-05, RF-06)</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={styles.btnPrimary} 
          style={{ width: "auto", padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          {showForm ? "Cancelar" : <><Plus size={18}/> Nuevo Usuario</>}
        </button>
      </div>

      {showForm && (
        <div className="solid-panel" style={{ padding: "2rem", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Registrar Nuevo Empleado</h2>
          <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", alignItems: "start" }}>
            
            <div className={styles.formGroup}>
              <label>DNI *</label>
              <input 
                type="text" 
                maxLength={8} 
                value={dni} 
                onChange={e => setDni(e.target.value)} 
                required 
                disabled={submitLoading} 
                placeholder="Servirá como clave inicial"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Nombres *</label>
              <input type="text" value={nombres} onChange={e => setNombres(e.target.value)} required disabled={submitLoading} />
            </div>
            
            <div className={styles.formGroup}>
              <label>Apellidos *</label>
              <input type="text" value={apellidos} onChange={e => setApellidos(e.target.value)} required disabled={submitLoading} />
            </div>
            
            <div className={styles.formGroup}>
              <label>Correo Institucional *</label>
              <input type="email" value={correo} onChange={e => setCorreo(e.target.value)} required disabled={submitLoading} />
            </div>

            <div className={styles.formGroup}>
              <label>Rol en el Sistema *</label>
              <select value={rolId} onChange={e => setRolId(e.target.value)} required disabled={submitLoading}>
                <option value="">-- Seleccionar Rol --</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Unidad Orgánica (Opcional)</label>
              <select value={unidadId} onChange={e => setUnidadId(e.target.value)} disabled={submitLoading}>
                <option value="">-- Ninguna --</option>
                {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
            </div>

            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", marginTop: "0.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
              <button type="submit" className={styles.btnPrimary} style={{ width: "auto", padding: "0.75rem 2rem" }} disabled={submitLoading}>
                {submitLoading ? "Registrando..." : "Registrar Usuario"}
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
              <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", color: "var(--text-muted)", width: "100px" }}>DNI</th>
              <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", color: "var(--text-muted)" }}>Empleado</th>
              <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", color: "var(--text-muted)" }}>Rol y Unidad</th>
              <th style={{ padding: "1rem", textAlign: "center", fontSize: "0.875rem", color: "var(--text-muted)", width: "120px" }}>Estado</th>
              <th style={{ padding: "1rem", textAlign: "right", fontSize: "0.875rem", color: "var(--text-muted)", width: "120px" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Cargando usuarios...</td></tr>
            ) : usuarios.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>No hay usuarios registrados.</td></tr>
            ) : (
              usuarios.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.2s", opacity: u.activo ? 1 : 0.6 }} className="table-row-hover">
                  <td style={{ padding: "1rem", fontWeight: 500 }}>{u.dni}</td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontWeight: 600 }}>{u.nombres} {u.apellidos}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{u.correo}</div>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontSize: "0.875rem" }}>{u.rol.nombre}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--primary)" }}>{u.unidadOrganica?.nombre || "Sin unidad asignada"}</div>
                  </td>
                  <td style={{ padding: "1rem", textAlign: "center" }}>
                    {u.activo ? (
                      <span style={{ padding: "0.25rem 0.5rem", backgroundColor: "#dcfce7", color: "#166534", borderRadius: "var(--radius-md)", fontSize: "0.75rem", fontWeight: 600 }}>Activo</span>
                    ) : (
                      <span style={{ padding: "0.25rem 0.5rem", backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: "var(--radius-md)", fontSize: "0.75rem", fontWeight: 600 }}>Inactivo</span>
                    )}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <button 
                      onClick={() => openEditModal(u)}
                      style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", padding: "0.25rem", marginRight: "0.5rem" }}
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(u)}
                      style={{ background: "none", border: "none", color: u.activo ? "#ef4444" : "#10b981", cursor: "pointer", padding: "0.25rem" }}
                      title={u.activo ? "Desactivar" : "Activar"}
                      disabled={toggleLoading === u.id}
                    >
                      {toggleLoading === u.id ? <div style={{width:18, height:18}}/> : (u.activo ? <UserX size={18} /> : <UserCheck size={18} />)}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Edición */}
      {editingUsuario && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="solid-panel" style={{ width: "100%", maxWidth: "600px", padding: "2rem", position: "relative" }}>
            <button 
              onClick={() => setEditingUsuario(null)}
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}
            >
              ×
            </button>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1.5rem", color: "var(--text-main)" }}>Editar Usuario: {editingUsuario.dni}</h2>
            <form onSubmit={handleEdit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              
              <div className={styles.formGroup}>
                <label>Nombres *</label>
                <input type="text" value={editNombres} onChange={e => setEditNombres(e.target.value)} required disabled={editLoading} />
              </div>
              <div className={styles.formGroup}>
                <label>Apellidos *</label>
                <input type="text" value={editApellidos} onChange={e => setEditApellidos(e.target.value)} required disabled={editLoading} />
              </div>
              <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
                <label>Correo Electrónico Institucional *</label>
                <input type="email" value={editCorreo} onChange={e => setEditCorreo(e.target.value)} required disabled={editLoading} />
              </div>
              <div className={styles.formGroup}>
                <label>Rol en el Sistema *</label>
                <select value={editRolId} onChange={e => setEditRolId(e.target.value)} required disabled={editLoading}>
                  <option value="">-- Seleccionar Rol --</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Unidad Orgánica</label>
                <select value={editUnidadId} onChange={e => setEditUnidadId(e.target.value)} disabled={editLoading}>
                  <option value="">-- Ninguna --</option>
                  {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                </select>
              </div>

              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setEditingUsuario(null)} className={styles.btnSecondary} style={{ width: "auto", margin: 0, padding: "0.75rem 1.5rem" }}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary} style={{ width: "auto", padding: "0.75rem 1.5rem" }} disabled={editLoading}>
                  {editLoading ? "Actualizando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
            {editError && <div className={styles.errorMessage} style={{ marginTop: "1rem" }}>{editError}</div>}
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .table-row-hover:hover { background-color: rgba(var(--primary-hue), 85%, 55%, 0.05); }
      `}} />
    </div>
  );
}
