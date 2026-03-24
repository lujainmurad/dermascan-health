import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  confirmed: 'bg-success/10 text-success border-success/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

const PatientAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: false });
      setAppointments(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  // Fetch clinician names
  const [clinicianNames, setClinicianNames] = useState<Record<string, string>>({});
  useEffect(() => {
    const ids = [...new Set(appointments.map(a => a.clinician_id))];
    if (ids.length === 0) return;
    supabase.from('profiles').select('user_id, full_name').in('user_id', ids).then(({ data }) => {
      const map: Record<string, string> = {};
      data?.forEach((p: any) => { map[p.user_id] = p.full_name || 'Unnamed'; });
      setClinicianNames(map);
    });
  }, [appointments]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">My Appointments</h1>
        {loading ? <LoadingSpinner /> : appointments.length === 0 ? (
          <EmptyState icon={Calendar} title="No appointments" description="You haven't booked any appointments yet." />
        ) : (
          <div className="space-y-3">
            {appointments.map(a => (
              <div key={a.id} className="medical-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{clinicianNames[a.clinician_id] || 'Loading...'}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(a.appointment_date), 'PPP p')}
                  </p>
                  {a.notes && <p className="text-xs text-muted-foreground mt-1">{a.notes}</p>}
                </div>
                <Badge variant="outline" className={statusColors[a.status] || ''}>
                  {a.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientAppointments;
