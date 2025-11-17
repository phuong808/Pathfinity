import "../globals.css";
import { SidebarProvider } from "../components/ui/sidebar";
import { ChatSidebar } from "../components/sidebar/sidebar";
import { getSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";

export default async function WithSidebarLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-side session check. If no active session, redirect to landing page.
  const session = await getSession();
  if (!session) redirect("/");

  return (
    <SidebarProvider>
      <ChatSidebar />
      <main className="flex-1 overflow-hidden scrollbar-hide">
        {children}
      </main>
    </SidebarProvider>
  );
}
