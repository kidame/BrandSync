import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { CommandCenterSidebar } from "./CommandCenterSidebar";

interface CommandCenterLayoutProps {
  children: React.ReactNode;
}

export function CommandCenterLayout({ children }: CommandCenterLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <CommandCenterSidebar />
        <SidebarInset className="flex-1">
          <header className="h-14 flex items-center border-b px-4 gap-4">
            <SidebarTrigger />
            <div className="flex-1" />
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
