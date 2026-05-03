import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ScanSearch, Calendar, Search, MessageSquare, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import AppLayout from '@/components/layouts/AppLayout';

const PatientDashboard = () => {
  const { profile } = useAuth();
  const [upcomingAppts, setUpcomingAppts] = useState<any[]>([]);
  const [clinicianNames, setClinicianNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!profile) return;
    const fetchAppts = async () => {
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', profile.user_id)
        .gte('appointment_date', new Date().toISOString())
        .in('status', ['pending', 'confirmed'])
        .order('appointment_date', { ascending: true })
        .limit(5);
      setUpcomingAppts(data || []);
    };
    fetchAppts();
  }, [profile]);

  useEffect(() => {
    const ids = [...new Set(upcomingAppts.map(a => a.clinician_id))];
    if (ids.length === 0) return;
    supabase.from('profiles').select('user_id, full_name').in('user_id', ids).then(({ data }) => {
      const map: Record<string, string> = {};
      data?.forEach((p: any) => { map[p.user_id] = p.full_name || 'Doctor'; });
      setClinicianNames(map);
    });
  }, [upcomingAppts]);

  const cards = [
    { icon: ScanSearch, title: 'Check a Spot', desc: 'Upload or capture an image for AI analysis', to: '/patient/analyze', color: 'bg-primary/10 text-primary' },
    { icon: MessageSquare, title: 'AI Assistant', desc: 'Chat with our AI about your skin concerns', to: '/patient/assistant', color: 'bg-secondary text-secondary-foreground' },
    { icon: Calendar, title: 'My Appointments', desc: 'View and manage your appointments', to: '/patient/appointments', color: 'bg-accent/10 text-accent' },
    { icon: Search, title: 'Find a Specialist', desc: 'Search for verified dermatologists near you', to: '/patient/find-specialist', color: 'bg-success/10 text-success' },
  ];

  const statusColors: Record<string, string> = {
    pending: 'bg-warning/10 text-warning border-warning/20',
    confirmed: 'bg-success/10 text-success border-success/20',
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-foreground mb-1 tracking-tight">
          Hey{profile?.full_name ? `, ${profile.full_name}` : ''}
        </h1>
        <p className="text-muted-foreground text-sm mb-8">What would you like to do today?</p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map((card, i) => (
          <motion.div key={card.to} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
            <Link to={card.to} className="clinical-card p-6 block hover:shadow-md transition-all duration-200 group">
              <div className={`w-11 h-11 rounded-xl ${card.color} flex items-center justify-center mb-4`}>
                <card.icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{card.title}</h3>
              <p className="text-sm text-muted-foreground">{card.desc}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Upcoming Appointments</h2>
          </div>
          <div className="space-y-2">
            {upcomingAppts.map(a => (
              <div key={a.id} className="clinical-card p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-foreground">{clinicianNames[a.clinician_id] || 'Doctor'}</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(a.appointment_date), 'PPP p')}</p>
                </div>
                <Badge variant="outline" className={statusColors[a.status] || ''}>{a.status}</Badge>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AppLayout>
  );
};

export default PatientDashboard;
