import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, CalendarIcon } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import AppLayout from '@/components/layouts/AppLayout';

interface Clinician {
  user_id: string;
  full_name: string | null;
  hospital_name: string | null;
  email: string | null;
}

interface AvailSlot {
  start_time: string;
  end_time: string;
  day_of_week: number;
}

const BookAppointment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [selectedClinician, setSelectedClinician] = useState(searchParams.get('clinician') || '');
  const [date, setDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingClinicians, setLoadingClinicians] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [availability, setAvailability] = useState<AvailSlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const fetchClinicians = async () => {
      const { data } = await supabase.from('profiles').select('user_id, full_name, hospital_name, email').eq('role', 'clinician').eq('verified', true);
      setClinicians((data as Clinician[]) || []);
      setLoadingClinicians(false);
    };
    fetchClinicians();
  }, []);

  useEffect(() => {
    if (!selectedClinician) { setAvailability([]); return; }
    supabase.from('clinician_availability').select('start_time, end_time, day_of_week').eq('clinician_id', selectedClinician).then(({ data }) => {
      setAvailability((data as AvailSlot[]) || []);
    });
  }, [selectedClinician]);

  useEffect(() => {
    if (!date || !selectedClinician) { setBookedSlots([]); return; }
    setLoadingSlots(true);
    setSelectedSlot(null);
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
    supabase.from('appointments')
      .select('appointment_date')
      .eq('clinician_id', selectedClinician)
      .in('status', ['pending', 'confirmed'])
      .gte('appointment_date', dayStart.toISOString())
      .lte('appointment_date', dayEnd.toISOString())
      .then(({ data }) => {
        setBookedSlots((data || []).map((a: any) => new Date(a.appointment_date).toISOString()));
        setLoadingSlots(false);
      });
  }, [date, selectedClinician]);

  const generateSlots = (): { time: string; iso: string; booked: boolean }[] => {
    if (!date) return [];
    const dayOfWeek = date.getDay();
    const dayAvail = availability.filter(a => a.day_of_week === dayOfWeek);
    if (dayAvail.length === 0) return [];
    const slots: { time: string; iso: string; booked: boolean }[] = [];
    dayAvail.forEach(a => {
      const startHour = parseInt(a.start_time.split(':')[0]);
      const endHour = parseInt(a.end_time.split(':')[0]);
      for (let h = startHour; h < endHour; h++) {
        const slotDate = new Date(date); slotDate.setHours(h, 0, 0, 0);
        const iso = slotDate.toISOString();
        const booked = bookedSlots.some(b => new Date(b).getHours() === h);
        slots.push({ time: `${h.toString().padStart(2, '0')}:00`, iso, booked });
      }
    });
    return slots;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedClinician || !selectedSlot) return;
    setLoading(true);
    const { error, data: insertData } = await supabase.from('appointments').insert({
      patient_id: user.id,
      clinician_id: selectedClinician,
      appointment_date: selectedSlot,
      notes: notes || null,
    }).select('id').single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    const clinician = clinicians.find(c => c.user_id === selectedClinician);
    if (clinician?.email && insertData?.id) {
      const slotDate = new Date(selectedSlot);
      supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'booking-notification',
          recipientEmail: clinician.email,
          idempotencyKey: `booking-notify-${insertData.id}`,
          templateData: {
            patientName: user.user_metadata?.full_name || user.email || 'A patient',
            date: format(slotDate, 'PPP'),
            time: format(slotDate, 'p'),
            notes: notes || 'No additional notes',
          },
        },
      }).catch(() => {});
    }

    setLoading(false);
    setConfirmed(true);
  };

  const slots = generateSlots();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const availableDays = new Set(availability.map(a => a.day_of_week));
  const isDateDisabled = (d: Date) => {
    if (d < today) return true;
    return !availableDays.has(d.getDay());
  };

  if (loadingClinicians) return <AppLayout><LoadingSpinner /></AppLayout>;

  if (confirmed) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-7 w-7 text-success" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-3 tracking-tight">Appointment Booked!</h1>
          <p className="text-muted-foreground text-sm mb-6">Your appointment has been scheduled. The clinician will confirm it shortly.</p>
          <Button onClick={() => navigate('/patient/appointments')}>View My Appointments</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-lg">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6 tracking-tight">Book an Appointment</h1>
        <form onSubmit={handleSubmit} className="clinical-card p-6 space-y-5">
          <div className="space-y-2">
            <Label>Select Clinician</Label>
            <Select value={selectedClinician} onValueChange={(v) => { setSelectedClinician(v); setDate(undefined); setSelectedSlot(null); }}>
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

          {selectedClinician && availability.length === 0 && (
            <p className="text-sm text-muted-foreground">This clinician has not set up availability yet. Please contact them directly.</p>
          )}

          {selectedClinician && availability.length > 0 && (
            <div className="space-y-2">
              <Label>Select Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} disabled={isDateDisabled} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {date && (
            <div className="space-y-2">
              <Label>Select Time Slot</Label>
              {loadingSlots ? (
                <p className="text-sm text-muted-foreground">Loading slots...</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">No available slots on this date.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map(s => (
                    <Button
                      key={s.iso}
                      type="button"
                      variant={selectedSlot === s.iso ? 'default' : 'outline'}
                      size="sm"
                      disabled={s.booked}
                      onClick={() => setSelectedSlot(s.iso)}
                      className={s.booked ? 'opacity-40 line-through' : ''}
                    >
                      {s.time}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Describe your concern..." rows={3} />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !selectedClinician || !selectedSlot}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Book Appointment
          </Button>
        </form>
      </div>
    </AppLayout>
  );
};

export default BookAppointment;
