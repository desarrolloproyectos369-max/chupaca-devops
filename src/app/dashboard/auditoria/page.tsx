import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AuditoriaClient from "./AuditoriaClient";

export const metadata = {
  title: "Bitácora de Auditoría | MuniDevOps",
};

export default async function AuditoriaPage() {
  const session = await getSession();
  
  // Seguridad: Sólo roles permitidos
  const rolesPermitidos = ["Administrador funcional", "Auditor o control institucional"];
  if (!session || !rolesPermitidos.includes(session.rolNombre)) {
    redirect("/dashboard");
  }

  return <AuditoriaClient />;
}
