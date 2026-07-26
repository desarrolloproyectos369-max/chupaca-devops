"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FileText, 
  Inbox, 
  ShieldCheck, 
  Activity, 
  LogOut,
  Menu,
  Settings,
  BarChart3,
  Shield,
  Database,
  Key,
  Server,
  LifeBuoy,
  Wrench
} from "lucide-react";
import styles from "./dashboard.module.css";
import NotificationBell from "@/components/NotificationBell";
import { createContext, useContext } from "react";

export const UserContext = createContext<any>(null);

export default function ClientLayout({
  children,
  user,
}: {
  children: React.ReactNode;
  user: any;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [sysVersion, setSysVersion] = useState<string>("v1.0.0");

  // Reloj en tiempo real
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Obtener versión del sistema
    fetch('/api/sistema/version')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.version) {
          setSysVersion(`v${data.data.version}`);
        }
      })
      .catch(err => console.error("Error al obtener la versión del sistema:", err));
      
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (e) {
      console.error(e);
    } finally {
      setLoggingOut(false);
    }
  };

  const iconSize = 18;
  const allNavItems = [
    { name: "Panel Principal", icon: <LayoutDashboard size={iconSize} />, path: "/dashboard", roles: ["Todos"] },
    
    // Módulo de Administración (Solo Administrador Funcional)
    { name: "Usuarios", icon: <Users size={iconSize} />, path: "/dashboard/usuarios", roles: ["Administrador funcional"] },
    { name: "Unidades Orgánicas", icon: <Building2 size={iconSize} />, path: "/dashboard/unidades", roles: ["Administrador funcional"] },
    { name: "Tipos de Trámite", icon: <FileText size={iconSize} />, path: "/dashboard/tipos", roles: ["Administrador funcional"] },
    { name: "Parámetros del Sistema", icon: <Settings size={iconSize} />, path: "/dashboard/configuracion", roles: ["Administrador funcional"] },
    
    // Módulo de Reportes
    { name: "Reportes y Estadísticas", icon: <BarChart3 size={iconSize} />, path: "/dashboard/reportes", roles: ["Administrador funcional", "Jefe o responsable de área", "Personal administrativo"] },
    
    // Herramientas del Sistema (FASE 3)
    { name: "Trazabilidad Histórica", icon: <Shield size={iconSize} />, path: "/dashboard/trazabilidad", roles: ["Administrador funcional"] },
    { name: "Estado del Servidor", icon: <Server size={iconSize} />, path: "/dashboard/monitoreo", roles: ["Administrador funcional"] },
    { name: "Copias de Seguridad", icon: <Database size={iconSize} />, path: "/dashboard/backup", roles: ["Administrador funcional"] },
    { name: "API Interoperabilidad", icon: <Key size={iconSize} />, path: "/dashboard/api-keys", roles: ["Administrador funcional"] },
    { name: "Gestión de Incidencias", icon: <Wrench size={iconSize} />, path: "/dashboard/incidencias", roles: ["Administrador funcional"] },

    // Futuros módulos visuales para probar los roles
    { name: "Mesa de Partes", icon: <Inbox size={iconSize} />, path: "/dashboard/recepcion", roles: ["Operador de mesa de partes", "Administrador funcional"] },
    { name: "Mi Bandeja", icon: <Inbox size={iconSize} />, path: "/dashboard/bandeja", roles: ["Personal administrativo", "Jefe o responsable de área", "Funcionario firmante", "Administrador funcional", "Operador de mesa de partes"] },
    { name: "Bitácora de Auditoría", icon: <ShieldCheck size={iconSize} />, path: "/dashboard/auditoria", roles: ["Auditor o control institucional", "Administrador funcional"] },
    { name: "Monitoreo DevOps", icon: <Activity size={iconSize} />, path: "/dashboard/monitoreo", roles: ["Administrador técnico / DevOps"] },
    
    // Ayuda general
    { name: "Soporte Técnico", icon: <LifeBuoy size={iconSize} />, path: "/dashboard/soporte", roles: ["Administrador funcional", "Operador de mesa de partes", "Personal administrativo", "Jefe o responsable de área", "Auditor o control institucional"] },
  ];

  const userRole = user?.rolNombre || "Usuario";
  
  // Filtramos las opciones según el rol del usuario autenticado
  const navItems = allNavItems.filter(item => 
    item.roles.includes("Todos") || item.roles.includes(userRole)
  );

  const dateStr = mounted ? currentTime.toLocaleDateString("es-PE", { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  }) : "";
  const timeStr = mounted ? currentTime.toLocaleTimeString("es-PE", {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }) : "";

  return (
    <UserContext.Provider value={user}>
      <div className={styles.dashboardContainer}>
        {/* Sidebar */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}>
        <div className={styles.sidebarHeader}>
          {!collapsed && (
            <div>
              <h2 className="text-primary" style={{ margin: 0, fontSize: "1.5rem" }}>MuniDevOps</h2>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>
                Panel de Gestión
              </span>
            </div>
          )}
          {collapsed && <h2 className="text-primary" style={{ margin: 0 }}>MD</h2>}
        </div>
        
        <nav className={styles.sidebarNav}>
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path));
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                title={collapsed ? item.name : ""}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {!collapsed && <span className={styles.navText}>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
        
        <div className={styles.sidebarFooter}>
          <button 
            onClick={handleLogout} 
            disabled={loggingOut}
            className={styles.btnLogout}
            title={collapsed ? "Cerrar sesión" : ""}
          >
            <span className={styles.navIcon}><LogOut size={iconSize} /></span>
            {!collapsed && <span className={styles.navText}>{loggingOut ? "Cerrando..." : "Cerrar sesión"}</span>}
          </button>
          
          {/* Version y Copyright */}
          {!collapsed && (
            <div style={{
              marginTop: "1rem",
              paddingTop: "0.5rem",
              textAlign: "center",
              borderTop: "1px solid var(--border-color)",
              color: "var(--text-muted)",
              fontSize: "0.75rem",
              letterSpacing: "0.2px",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem"
            }}>
              <span style={{ fontWeight: 600 }}>Municipalidad DevOps {sysVersion}</span>
              <span>© {new Date().getFullYear()} Todos los derechos reservados.</span>
            </div>
          )}
        </div>
      </aside>


        {/* Main Content Area */}
        <div className={styles.mainWrapper}>
          {/* Top Header */}
          <header className={styles.topHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <button 
                className={styles.btnToggle} 
                onClick={() => setCollapsed(!collapsed)}
                title="Alternar menú"
              >
                <Menu size={20} />
              </button>
              <h1 style={{ fontSize: "1.25rem", margin: 0, color: "var(--primary)" }}>
                Municipalidad Provincial de Chupaca
              </h1>
            </div>
            
            <div className={styles.headerWidgets}>
              <NotificationBell />
              
              <div className={styles.timeWidget}>
                <span style={{ fontWeight: 600, color: "var(--primary)" }}>{timeStr}</span>
                <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                  {dateStr}
                </span>
              </div>
              
              <div className={styles.userProfile}>
                <div className={styles.avatar}>{user?.nombres?.charAt(0) || "U"}</div>
                <div className={styles.userInfo}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                    {user?.nombres ? `${user.nombres} ${user.apellidos}` : "Usuario"}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {user?.rolNombre || "Rol no asignado"}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className={styles.mainContent}>
            <div className={styles.contentWrapper}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </UserContext.Provider>
  );
}
