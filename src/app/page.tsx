"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ocurrió un error al iniciar sesión");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginContent}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <h1>MuniDevOps</h1>
            <p>Gestión de Trámites Documentarios</p>
          </div>
          
          <form className={styles.loginForm} onSubmit={handleLogin}>
            {error && <div className={styles.errorMessage}>{error}</div>}
            
            <div className={styles.formGroup}>
              <label htmlFor="email">Usuario institucional</label>
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
            
            <div className={styles.formGroup}>
              <label htmlFor="password">Contraseña</label>
              <input 
                type="password" 
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required 
                disabled={loading}
              />
            </div>
            
            <div className={styles.formOptions}>
              <label className={styles.checkboxContainer}>
                <input type="checkbox" />
                <span>Recordarme</span>
              </label>
              <Link href="/recuperar" className={styles.forgotPassword}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? "Validando credenciales..." : "Ingresar al sistema"}
            </button>
          </form>
          
          <div className={styles.publicAccess}>
            <p>¿Eres ciudadano?</p>
            <Link href="/seguimiento" className={styles.btnSecondary}>
              Consultar estado de trámite
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
