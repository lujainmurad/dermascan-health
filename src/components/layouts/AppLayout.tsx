import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ClinicianSidebar } from '@/components/sidebars/ClinicianSidebar';
import { PatientSidebar } from '@/components/sidebars/PatientSidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { profile } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {profile?.role === 'clinician' ? <ClinicianSidebar /> : <PatientSidebar />}
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="h-14 flex items-center border-b border-border bg-card/50 backdrop-blur-sm px-4 lg:px-6">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          </header>
          <main className="flex-1 p-6 lg:p-10">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
