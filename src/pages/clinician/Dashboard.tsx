import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Users, Calendar, Activity, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import AppLayout from '@/components/layouts/AppLayout';

const ClinicianDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ cases: 0, pendingAppointments: 0 });
  const [upcomingAppts, setUpcomingAppts] = useState<any[]>([]);
  const [patientNames, setPatientNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!profile) return;
    const fetchData = async () => {
      const [casesRes, apptRes, upcomingRes] = await Promise.all([
        supabase.from('cases').select('id', { count: 'exact', head: true }).eq('clinician_id', profile.user_id),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('clinician_id', profile.user_id).eq('status', 'pending'),
        supabase.from('appointments').select('*').eq('clinician_id', profile.user_id).gte('appointment_date', new Date().toISOString()).in('status', ['pending', 'confirmed']).order('appointment_date', { ascending: true }).limit(5),
      ]);
      setStats({ cases: casesRes.count || 0, pendingAppointments: apptRes.count || 0 });
      setUpcomingAppts(upcomingRes.data || []);
    };
    fetchData();
  }, [profile]);

  useEffect(() => {
    const ids = [...new Set(upcomingAppts.map(a => a.patient_id))];
    if (ids.length === 0) return;
    supabase.from('profiles').select('user_id, full_name, email').in('user_id', ids).then(({ data }) => {
      const map: Record<string, string> = {};
      data?.forEach((p: any) => { map[p.user_id] = p.full_name || p.email || 'Patient'; });
      setPatientNames(map);
    });
  }, [upcomingAppts]);

  const statCards = [
    { icon: Activity, label: 'Total Cases', value: stats.cases, color: 'bg-primary/10 text-primary' },
    { icon: Calendar, label: 'Pending Appointments', value: stats.pendingAppointments, color: 'bg-warning/10 text-warning' },
  ];

  const actionCards = [
    { icon: Users, title: 'Patient Cases', desc: 'Browse and manage patient records', to: '/clinician/cases' },
    { icon: Calendar, title: 'Appointments', desc: 'Manage patient appointments', to: '/clinician/appointments' },
  ];

  const statusColors: Record<string, string> = {
    pending: 'bg-warning/10 text-warning border-warning/20',
    confirmed: 'bg-success/10 text-success border-success/20',
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground mb-1 tracking-tight">
          Welcome{profile?.full_name ? `, Dr. ${profile.full_name}` : ''}
        </h1>
        <p className="text-muted-foreground text-sm mb-8">Clinician Dashboard</p>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
            className="clinical-card p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${s.color} flex items-center justify-center`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <h2 className="font-bold text-base text-foreground mb-4">Quick Actions</h2>
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {actionCards.map((card, i) => (
          <motion.div key={card.to} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + 0.1 * i }}>
            <Link to={card.to} className="clinical-card p-5 block hover:shadow-md transition-all duration-200 group">
              <card.icon className="h-5 w-5 text-primary mb-3" />
              <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{card.title}</h3>
              <p className="text-sm text-muted-foreground">{card.desc}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Upcoming Appointments</h2>
          </div>
          <div className="space-y-2">
            {upcomingAppts.map(a => (
              <Link key={a.id} to={`/clinician/patient/${a.patient_id}`} className="clinical-card p-4 flex items-center justify-between block hover:shadow-md transition-all">
                <div>
                  <p className="font-semibold text-sm text-foreground">{patientNames[a.patient_id] || 'Patient'}</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(a.appointment_date), 'PPP p')}</p>
                </div>
                <Badge variant="outline" className={statusColors[a.status] || ''}>{a.status}</Badge>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </AppLayout>
  );
};

export default ClinicianDashboard;
