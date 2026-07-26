import { getSession } from "@/lib/auth";
import ClientLayout from "./ClientLayout";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  if (!session) {
    redirect("/");
  }

  return <ClientLayout user={session}>{children}</ClientLayout>;
}
