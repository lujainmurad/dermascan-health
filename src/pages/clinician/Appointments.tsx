import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Check, X } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  confirmed: 'bg-success/10 text-success border-success/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

const ClinicianAppointments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientNames, setPatientNames] = useState<Record<string, string>>({});

  const fetchAppointments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('clinician_id', user.id)
      .order('appointment_date', { ascending: false });
    setAppointments(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAppointments(); }, [user]);

  useEffect(() => {
    const ids = [...new Set(appointments.map(a => a.patient_id))];
    if (ids.length === 0) return;
    supabase.from('profiles').select('user_id, full_name, email').in('user_id', ids).then(({ data }) => {
      const map: Record<string, string> = {};
      data?.forEach((p: any) => { map[p.user_id] = p.full_name || p.email || 'Unknown'; });
      setPatientNames(map);
    });
  }, [appointments]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Appointment ${status}` });
      fetchAppointments();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">Appointments</h1>
        {loading ? <LoadingSpinner /> : appointments.length === 0 ? (
          <EmptyState icon={Calendar} title="No appointments" description="Patient appointment requests will appear here." />
        ) : (
          <div className="space-y-3">
            {appointments.map(a => (
              <div key={a.id} className="medical-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{patientNames[a.patient_id] || 'Loading...'}</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(a.appointment_date), 'PPP p')}</p>
                  {a.notes && <p className="text-xs text-muted-foreground mt-1">{a.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={statusColors[a.status] || ''}>{a.status}</Badge>
                  {a.status === 'pending' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, 'confirmed')}>
                        <Check className="h-3 w-3 mr-1" /> Confirm
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, 'cancelled')} className="text-destructive hover:text-destructive">
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicianAppointments;
