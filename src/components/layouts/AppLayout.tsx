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
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        {profile?.role === 'clinician' ? <ClinicianSidebar /> : <PatientSidebar />}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border bg-background/80 backdrop-blur-sm px-4 sticky top-0 z-10">
            <SidebarTrigger className="text-foreground" />
          </header>
          <main className="flex-1 p-6 lg:p-8 bg-background overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
