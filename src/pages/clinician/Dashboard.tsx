import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Users, Calendar, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import AppLayout from '@/components/layouts/AppLayout';

const ClinicianDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ cases: 0, pendingAppointments: 0 });

  useEffect(() => {
    if (!profile) return;
    const fetchStats = async () => {
      const [casesRes, apptRes] = await Promise.all([
        supabase.from('cases').select('id', { count: 'exact', head: true }).eq('clinician_id', profile.user_id),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('clinician_id', profile.user_id).eq('status', 'pending'),
      ]);
      setStats({ cases: casesRes.count || 0, pendingAppointments: apptRes.count || 0 });
    };
    fetchStats();
  }, [profile]);

  const statCards = [
    { icon: Activity, label: 'Total Cases', value: stats.cases, color: 'bg-primary/10 text-primary' },
    { icon: Calendar, label: 'Pending Appointments', value: stats.pendingAppointments, color: 'bg-warning/10 text-warning' },
  ];

  const actionCards = [
    { icon: Users, title: 'Patient Cases', desc: 'Browse and manage patient records', to: '/clinician/cases' },
    { icon: Calendar, title: 'Appointments', desc: 'Manage patient appointments', to: '/clinician/appointments' },
  ];

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground mb-1 tracking-tight">
          Welcome{profile?.full_name ? `, Dr. ${profile.full_name}` : ''}
        </h1>
        <p className="text-muted-foreground text-sm mb-8">Clinician Dashboard</p>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
            className="clinical-card p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-lg ${s.color} flex items-center justify-center`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <h2 className="font-display font-semibold text-base text-foreground mb-4">Quick Actions</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {actionCards.map((card, i) => (
          <motion.div key={card.to} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + 0.1 * i }}>
            <Link to={card.to} className="clinical-card p-5 block hover:shadow-md transition-shadow group">
              <card.icon className="h-5 w-5 text-primary mb-3" />
              <h3 className="font-display font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{card.title}</h3>
              <p className="text-sm text-muted-foreground">{card.desc}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </AppLayout>
  );
};

export default ClinicianDashboard;
