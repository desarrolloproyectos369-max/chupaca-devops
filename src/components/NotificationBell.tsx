"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, FileText, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotificationBell() {
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchNotificaciones = async () => {
    try {
      const res = await fetch("/api/notificaciones");
      if (res.ok) {
        const data = await res.json();
        setNotificaciones(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
    const interval = setInterval(fetchNotificaciones, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarcarLeida = async (id: number, codigoExpediente?: string) => {
    try {
      await fetch(`/api/notificaciones/${id}/leer`, { method: "PATCH" });
      setNotificaciones(prev => prev.filter(n => n.id !== id));
      
      if (codigoExpediente) {
        setIsOpen(false);
        // Redirigir y buscar el expediente en la bandeja
        router.push(`/dashboard/bandeja`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ position: "relative" }} ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: "var(--surface-color, #ffffff)", 
          border: "1px solid var(--border-color, #e2e8f0)", 
          cursor: "pointer", 
          position: "relative",
          padding: "0.6rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          transition: "background 0.2s",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
        }}
        onMouseOver={e => e.currentTarget.style.background = "#f1f5f9"}
        onMouseOut={e => e.currentTarget.style.background = "var(--surface-color, #ffffff)"}
      >
        <Bell size={22} color="#0f172a" />
        {notificaciones.filter(n => !n.leido).length > 0 && (
          <span style={{
            position: "absolute",
            top: "-4px",
            right: "-4px",
            background: "#dc2626", // Un rojo más intenso
            color: "#ffffff",
            fontSize: "0.75rem",
            fontWeight: 800,
            borderRadius: "9999px",
            minWidth: "20px",
            height: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #ffffff",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            animation: "pulse 2s infinite"
          }}>
            {notificaciones.filter(n => !n.leido).length > 9 ? "9+" : notificaciones.filter(n => !n.leido).length}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: "absolute",
          top: "100%",
          right: "0",
          marginTop: "0.5rem",
          width: "350px",
          background: "white",
          borderRadius: "0.5rem",
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
          border: "1px solid var(--border-color)",
          zIndex: 50,
          overflow: "hidden"
        }}>
          <div style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--text-color)" }}>Notificaciones</h3>
            <span style={{ fontSize: "0.75rem", background: "var(--primary)", color: "white", padding: "0.1rem 0.5rem", borderRadius: "10px", fontWeight: "bold" }}>
              {notificaciones.filter(n => !n.leido).length} nuevas
            </span>
          </div>

          <div style={{ maxHeight: "350px", overflowY: "auto" }}>
            {notificaciones.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                <CheckCircle size={32} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: "0.875rem" }}>No tienes notificaciones</p>
              </div>
            ) : (
              notificaciones.map(notif => (
                <div 
                  key={notif.id}
                  style={{
                    padding: "1rem",
                    borderBottom: "1px solid var(--border-color)",
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "flex-start",
                    cursor: "pointer",
                    transition: "background 0.2s",
                    background: notif.leido 
                      ? "white" 
                      : (notif.tipo === "URGENTE" ? "#fff5f5" : "#f0f9ff"),
                    opacity: notif.leido ? 0.7 : 1
                  }}
                  onClick={() => !notif.leido && handleMarcarLeida(notif.id, notif.expediente?.codigo)}
                  onMouseOver={e => e.currentTarget.style.background = "#f1f5f9"}
                  onMouseOut={e => e.currentTarget.style.background = notif.leido 
                    ? "white" 
                    : (notif.tipo === "URGENTE" ? "#fff5f5" : "#f0f9ff")
                  }
                >
                  <div style={{ flexShrink: 0, marginTop: "0.25rem", color: notif.tipo === "URGENTE" ? "var(--danger)" : "var(--primary)" }}>
                    {notif.tipo === "URGENTE" ? <AlertCircle size={20} /> : <FileText size={20} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.875rem", color: notif.leido ? "var(--text-muted)" : "var(--text-color)", lineHeight: 1.4, fontWeight: notif.leido ? 400 : 600 }}>
                      {notif.mensaje}
                    </p>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {new Date(notif.creadoEn).toLocaleString('es-PE')}
                    </span>
                  </div>
                  {notif.leido && (
                    <div style={{ flexShrink: 0, color: "var(--text-muted)", fontSize: "0.75rem" }}>
                      Leída
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
