import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from '@/components/NavLink';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { LayoutDashboard, ScanSearch, Search, Calendar, Settings } from 'lucide-react';

const navItems = [
  { title: 'Dashboard', url: '/patient/dashboard', icon: LayoutDashboard },
  { title: 'Check a Spot', url: '/patient/analyze', icon: ScanSearch },
  { title: 'Find Specialist', url: '/patient/find-specialist', icon: Search },
  { title: 'My Appointments', url: '/patient/appointments', icon: Calendar },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function PatientSidebar() {
  const { profile } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const navigate = useNavigate();
  const location = useLocation();

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() || 'P';

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate('/patient/dashboard')}
        >
          <div className="w-9 h-9 rounded-lg clinical-gradient flex items-center justify-center flex-shrink-0">
            <span className="text-sidebar-primary-foreground font-bold text-sm tracking-tight">Cl</span>
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-base text-sidebar-accent-foreground tracking-tight">
              Claritas
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === '/settings'}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                        }`}
                      >
                        <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div
          className="flex items-center gap-3 rounded-lg px-2 py-2 cursor-pointer hover:bg-sidebar-accent/50 transition-colors"
          onClick={() => navigate('/settings')}
        >
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-accent-foreground truncate">
                {profile?.full_name || 'Patient'}
              </p>
              <p className="text-[11px] text-sidebar-foreground truncate">Patient</p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
