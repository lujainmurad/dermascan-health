import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider } from '@/components/ui/sidebar';
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
        <main className="flex-1 p-6 lg:p-8 bg-background overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
