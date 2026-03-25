import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, Trash2, Plus, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 11 }, (_, i) => {
  const h = i + 8;
  return `${h.toString().padStart(2, '0')}:00`;
});

interface AvailabilityRow {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

const Settings = () => {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    hospital_name: '',
    specialty: '',
    city: '',
  });

  // Availability state
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [newDay, setNewDay] = useState('1');
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('17:00');
  const [addingAvail, setAddingAvail] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        hospital_name: profile.hospital_name || '',
        specialty: profile.specialty || '',
        city: profile.city || '',
      });
      if (profile.role === 'clinician') {
        fetchAvailability();
      }
    }
  }, [profile]);

  const fetchAvailability = async () => {
    if (!profile) return;
    setLoadingAvail(true);
    const { data } = await supabase
      .from('clinician_availability')
      .select('*')
      .eq('clinician_id', profile.user_id)
      .order('day_of_week', { ascending: true });
    setAvailability((data as AvailabilityRow[]) || []);
    setLoadingAvail(false);
  };

  const addAvailability = async () => {
    if (!profile) return;
    setAddingAvail(true);
    const { error } = await supabase.from('clinician_availability').insert({
      clinician_id: profile.user_id,
      day_of_week: parseInt(newDay),
      start_time: newStart,
      end_time: newEnd,
    });
    setAddingAvail(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Availability added' });
      fetchAvailability();
    }
  };

  const deleteAvailability = async (id: string) => {
    const { error } = await supabase.from('clinician_availability').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setAvailability(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setLoading(true);

    const updateData: Record<string, any> = {
      full_name: form.full_name,
      phone: form.phone,
      city: form.city,
    };

    if (profile.role === 'clinician') {
      updateData.hospital_name = form.hospital_name;
      updateData.specialty = form.specialty;
      if (form.full_name && form.hospital_name && form.specialty && form.phone) {
        updateData.verified = true;
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', profile.user_id);

    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await refreshProfile();
      toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">Account Settings</h1>

        <div className="medical-card p-6 space-y-5">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile?.email || ''} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input value={profile?.role === 'clinician' ? 'Clinician' : 'Patient'} disabled className="bg-muted capitalize" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Dr. John Smith" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 555-0123" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="New York" />
          </div>

          {profile?.role === 'clinician' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="hospital">Hospital Name</Label>
                <Input id="hospital" value={form.hospital_name} onChange={e => setForm(f => ({ ...f, hospital_name: e.target.value }))} placeholder="City General Hospital" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty">Specialty</Label>
                <Input id="specialty" value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} placeholder="Dermatology" />
              </div>

              {!profile.verified && (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-foreground">Verify Your Account</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Complete all fields above (name, hospital, specialty, phone) to appear in patient search results.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
          </Button>
        </div>

        {/* Availability Management for Clinicians */}
        {profile?.role === 'clinician' && (
          <div className="medical-card p-6 mt-6 space-y-5">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-display font-semibold text-foreground">Weekly Availability</h2>
            </div>
            <p className="text-sm text-muted-foreground">Set your recurring weekly availability so patients can book 1-hour appointment slots.</p>

            {/* Add new availability */}
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Day</Label>
                <Select value={newDay} onValueChange={setNewDay}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAY_NAMES.map((name, i) => (
                      <SelectItem key={i} value={String(i)}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">From</Label>
                <Select value={newStart} onValueChange={setNewStart}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HOURS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To</Label>
                <Select value={newEnd} onValueChange={setNewEnd}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HOURS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addAvailability} disabled={addingAvail} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>

            {/* Current availability list */}
            {loadingAvail ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : availability.length === 0 ? (
              <p className="text-sm text-muted-foreground">No availability set. Add your working hours above.</p>
            ) : (
              <div className="space-y-2">
                {availability.map(a => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg bg-muted p-3">
                    <div className="text-sm">
                      <span className="font-medium text-foreground">{DAY_NAMES[a.day_of_week]}</span>
                      <span className="text-muted-foreground ml-2">
                        {a.start_time.slice(0, 5)} – {a.end_time.slice(0, 5)}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteAvailability(a.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
