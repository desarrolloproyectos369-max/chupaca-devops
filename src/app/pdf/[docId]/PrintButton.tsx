"use client";

import React from "react";
import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button 
      className="no-print"
      onClick={() => window.print()} 
      style={{
        position: "fixed", top: "2rem", right: "2rem",
        background: "var(--primary)", color: "white",
        border: "none", padding: "1rem 1.5rem", borderRadius: "8px",
        display: "flex", alignItems: "center", gap: "0.5rem",
        cursor: "pointer", fontSize: "1rem", fontWeight: "bold",
        boxShadow: "0 4px 6px rgba(0,0,0,0.3)", zIndex: 100
      }}
    >
      <Printer size={20} />
      Imprimir / Guardar como PDF
    </button>
  );
}
