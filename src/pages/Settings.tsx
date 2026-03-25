import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, LogOut, Clock } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 13 }, (_, i) => {
  const h = i + 7;
  return `${h.toString().padStart(2, '0')}:00`;
});

interface AvailabilityRow {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface DayConfig {
  enabled: boolean;
  start_time: string;
  end_time: string;
  id?: string;
}

const Settings = () => {
  const { profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    hospital_name: '',
    specialty: '',
    city: '',
  });

  const [weekGrid, setWeekGrid] = useState<DayConfig[]>(
    Array.from({ length: 7 }, () => ({ enabled: false, start_time: '09:00', end_time: '17:00' }))
  );
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [savingAvail, setSavingAvail] = useState(false);

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

    const rows = (data as AvailabilityRow[]) || [];
    const grid: DayConfig[] = Array.from({ length: 7 }, () => ({
      enabled: false,
      start_time: '09:00',
      end_time: '17:00',
    }));
    rows.forEach(r => {
      grid[r.day_of_week] = {
        enabled: true,
        start_time: r.start_time.slice(0, 5),
        end_time: r.end_time.slice(0, 5),
        id: r.id,
      };
    });
    setWeekGrid(grid);
    setLoadingAvail(false);
  };

  const saveAvailability = async () => {
    if (!profile) return;
    setSavingAvail(true);

    // Delete all existing, then insert enabled days
    await supabase.from('clinician_availability').delete().eq('clinician_id', profile.user_id);

    const inserts = weekGrid
      .map((day, i) => day.enabled ? {
        clinician_id: profile.user_id,
        day_of_week: i,
        start_time: day.start_time,
        end_time: day.end_time,
      } : null)
      .filter(Boolean);

    if (inserts.length > 0) {
      const { error } = await supabase.from('clinician_availability').insert(inserts);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        setSavingAvail(false);
        return;
      }
    }

    toast({ title: 'Availability saved' });
    fetchAvailability();
    setSavingAvail(false);
  };

  const updateDay = (index: number, updates: Partial<DayConfig>) => {
    setWeekGrid(prev => prev.map((d, i) => i === index ? { ...d, ...updates } : d));
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <AppLayout>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-display font-bold text-foreground mb-1 tracking-tight">Account Settings</h1>
        <p className="text-sm text-muted-foreground mb-8">Manage your profile and preferences.</p>

        <div className="clinical-card p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
              <Input value={profile?.email || ''} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Role</Label>
              <Input value={profile?.role === 'clinician' ? 'Clinician' : 'Patient'} disabled className="bg-muted capitalize" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
          </div>

          {profile?.role === 'clinician' && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hospital">Hospital</Label>
                  <Input id="hospital" value={form.hospital_name} onChange={e => setForm(f => ({ ...f, hospital_name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialty</Label>
                  <Input id="specialty" value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} />
                </div>
              </div>

              {!profile.verified && (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-foreground">Complete Your Profile</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fill in all fields to appear in patient search results.
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

        {/* Weekly Availability Grid */}
        {profile?.role === 'clinician' && (
          <div className="clinical-card p-6 mt-6 space-y-5">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-display font-semibold text-foreground tracking-tight">Weekly Availability</h2>
            </div>
            <p className="text-sm text-muted-foreground">Toggle days and set your working hours. Patients book 1-hour slots within these windows.</p>

            {loadingAvail ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-2">
                  {DAY_NAMES.map((name, i) => (
                    <div key={i} className={`rounded-lg border p-3 text-center transition-colors ${weekGrid[i].enabled ? 'border-primary bg-accent' : 'border-border bg-muted/50'}`}>
                      <p className="text-xs font-semibold text-foreground mb-2">{name}</p>
                      <Switch
                        checked={weekGrid[i].enabled}
                        onCheckedChange={(checked) => updateDay(i, { enabled: checked })}
                        className="mx-auto"
                      />
                      {weekGrid[i].enabled && (
                        <div className="mt-3 space-y-1.5">
                          <Select value={weekGrid[i].start_time} onValueChange={(v) => updateDay(i, { start_time: v })}>
                            <SelectTrigger className="h-7 text-[10px] px-1.5">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {HOURS.map(h => <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Select value={weekGrid[i].end_time} onValueChange={(v) => updateDay(i, { end_time: v })}>
                            <SelectTrigger className="h-7 text-[10px] px-1.5">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {HOURS.map(h => <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Button onClick={saveAvailability} disabled={savingAvail} className="w-full">
                  {savingAvail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Availability
                </Button>
              </>
            )}
          </div>
        )}

        {/* Sign Out */}
        <div className="mt-8 pb-4">
          <Button variant="outline" onClick={handleSignOut} className="w-full text-destructive hover:text-destructive hover:bg-destructive/5">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
