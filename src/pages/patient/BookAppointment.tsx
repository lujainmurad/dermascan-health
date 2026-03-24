import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Clinician {
  user_id: string;
  full_name: string | null;
  hospital_name: string | null;
}

const BookAppointment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [selectedClinician, setSelectedClinician] = useState(searchParams.get('clinician') || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingClinicians, setLoadingClinicians] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const fetchClinicians = async () => {
      const { data } = await supabase.from('profiles').select('user_id, full_name, hospital_name').eq('role', 'clinician').eq('verified', true);
      setClinicians((data as Clinician[]) || []);
      setLoadingClinicians(false);
    };
    fetchClinicians();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedClinician || !date || !time) return;
    setLoading(true);

    const appointmentDate = new Date(`${date}T${time}`).toISOString();
    const { error } = await supabase.from('appointments').insert({
      patient_id: user.id,
      clinician_id: selectedClinician,
      appointment_date: appointmentDate,
      notes: notes || null,
    });

    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setConfirmed(true);
    }
  };

  if (loadingClinicians) return <div className="min-h-screen bg-background"><Navbar /><LoadingSpinner /></div>;

  if (confirmed) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-3">Appointment Booked!</h1>
          <p className="text-muted-foreground mb-6">Your appointment has been scheduled. The clinician will confirm it shortly.</p>
          <Button onClick={() => navigate('/patient/appointments')}>View My Appointments</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">Book an Appointment</h1>
        <form onSubmit={handleSubmit} className="medical-card p-6 space-y-5">
          <div className="space-y-2">
            <Label>Select Clinician</Label>
            <Select value={selectedClinician} onValueChange={setSelectedClinician}>
              <SelectTrigger><SelectValue placeholder="Choose a specialist" /></SelectTrigger>
              <SelectContent>
                {clinicians.map(c => (
                  <SelectItem key={c.user_id} value={c.user_id}>
                    {c.full_name || 'Unnamed'} {c.hospital_name ? `— ${c.hospital_name}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Describe your concern..." rows={3} />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !selectedClinician}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Book Appointment
          </Button>
        </form>
      </div>
    </div>
  );
};

export default BookAppointment;
