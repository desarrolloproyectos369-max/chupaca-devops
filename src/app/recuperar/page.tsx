"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "../page.module.css";

export default function RecuperarPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Mock API call since we don't have SMTP configured yet
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (!email.includes("@")) throw new Error("Correo inválido");
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginContent}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <h1 style={{ fontSize: "1.75rem", color: "var(--primary)" }}>Recuperar Acceso</h1>
            <p>Se enviará un enlace seguro a tu correo institucional (RF-03)</p>
          </div>
          
          {success ? (
            <div style={{ textAlign: "center", padding: "1rem" }}>
              <div style={{ color: "#059669", marginBottom: "1rem", fontSize: "3rem" }}>✓</div>
              <p style={{ marginBottom: "1.5rem" }}>Hemos enviado las instrucciones a <strong>{email}</strong>.</p>
              <Link href="/" className={styles.btnSecondary}>Volver al login</Link>
            </div>
          ) : (
            <form className={styles.loginForm} onSubmit={handleRecuperar}>
              {error && <div className={styles.errorMessage}>{error}</div>}
              
              <div className={styles.formGroup}>
                <label htmlFor="email">Correo institucional</label>
                <input 
                  type="email" 
                  id="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@chupaca.gob.pe" 
                  required 
                  disabled={loading}
                />
              </div>
              
              <button type="submit" className={styles.btnPrimary} disabled={loading}>
                {loading ? "Procesando..." : "Enviar enlace de recuperación"}
              </button>

              <div style={{ textAlign: "center", marginTop: "1rem" }}>
                 <Link href="/" style={{ color: "var(--text-muted)", fontSize: "0.875rem", textDecoration: "underline" }}>
                   Cancelar y volver
                 </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
