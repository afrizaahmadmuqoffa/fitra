import type { ReactNode } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { getNotifications, getTeacher } from "@/db/queries";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const teacher = await getTeacher();
  const notifications = await getNotifications();

  return (
    <div className="flex min-h-[100dvh] bg-background">
      <aside className="sticky top-0 hidden h-[100dvh] shrink-0 lg:block">
        <DashboardSidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader teacher={teacher} notifications={notifications} />
        <main id="konten-utama" className="flex-1 px-4 pt-6 pb-24 md:px-6 md:pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}