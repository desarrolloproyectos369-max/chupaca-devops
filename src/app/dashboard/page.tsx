"use client";

import React, { useState, useEffect } from "react";
import { Loader2, TrendingUp, Users, AlertCircle, CheckCircle, FileText, BarChart3, Clock, LayoutDashboard, PieChart as PieChartIcon } from "lucide-react";
import { 
  PieChart, Pie, Cell, Tooltip as PieTooltip, Legend as PieLegend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip, Legend as BarLegend 
} from "recharts";
import styles from "../page.module.css";

// Colors for the pie chart states
const COLORS = {
  'REGISTRADO': '#3b82f6', // blue
  'EN PROCESO': '#f59e0b', // amber
  'OBSERVADO': '#ef4444',  // red
  'FINALIZADO': '#10b981', // green
  'ARCHIVADO': '#64748b'   // slate
};

export default function DashboardIndex() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error cargando stats:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "calc(100vh - 200px)" }}>
        <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
          <Loader2 size={40} className="spin" style={{ margin: "0 auto 1rem", color: "var(--primary)" }} />
          <p>Cargando panel de indicadores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 0.5rem 0" }}>
            <LayoutDashboard size={24} />
            Panel Gerencial
          </h1>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>Visión general y métricas de desempeño del sistema de Trámites Documentarios</p>
        </div>
      </div>

      {data?.error && (
        <div style={{ backgroundColor: "#fee2e2", color: "#dc2626", padding: "1rem", borderRadius: "var(--radius-md)", marginBottom: "2rem" }}>
          Error al cargar datos: {data.error}
        </div>
      )}

      {/* Tarjetas KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <div className="solid-panel" style={{ padding: "1.5rem", borderLeft: "4px solid #3b82f6", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ padding: "1rem", backgroundColor: "#eff6ff", borderRadius: "50%", color: "#3b82f6" }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase" }}>Total Ingresados</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text-main)" }}>{data?.kpis?.total || 0}</div>
          </div>
        </div>

        <div className="solid-panel" style={{ padding: "1.5rem", borderLeft: "4px solid #f59e0b", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ padding: "1rem", backgroundColor: "#fef3c7", borderRadius: "50%", color: "#d97706" }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase" }}>En Proceso</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#d97706" }}>{data?.kpis?.enProceso || 0}</div>
          </div>
        </div>

        <div className="solid-panel" style={{ padding: "1.5rem", borderLeft: "4px solid #ef4444", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ padding: "1rem", backgroundColor: "#fee2e2", borderRadius: "50%", color: "#dc2626" }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase" }}>Fuera de Plazo</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#dc2626" }}>{data?.kpis?.vencidos || 0}</div>
          </div>
        </div>

        <div className="solid-panel" style={{ padding: "1.5rem", borderLeft: "4px solid #64748b", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ padding: "1rem", backgroundColor: "#f1f5f9", borderRadius: "50%", color: "#475569" }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase" }}>Archivados</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#475569" }}>{data?.kpis?.archivados || 0}</div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
        
        {/* Gráfico de Torta (Estados) */}
        <div className="solid-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.125rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <PieChartIcon size={20} className="text-primary" />
            Distribución por Estado
          </h3>
          <div style={{ height: "300px", width: "100%" }}>
            {data?.porEstado && data.porEstado.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.porEstado}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.porEstado.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <PieTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <PieLegend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: "100%", display: "flex", justifyContent: "center", alignItems: "center", color: "var(--text-muted)" }}>
                No hay datos suficientes
              </div>
            )}
          </div>
        </div>

        {/* Gráfico de Barras (Últimos 7 días) */}
        <div className="solid-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.125rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <BarChart3 size={20} className="text-primary" />
            Ingresos (Últimos 7 días)
          </h3>
          <div style={{ height: "300px", width: "100%" }}>
            {data?.porDia && data.porDia.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.porDia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <BarTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="cantidad" name="Expedientes" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: "100%", display: "flex", justifyContent: "center", alignItems: "center", color: "var(--text-muted)" }}>
                No hay datos suficientes
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
