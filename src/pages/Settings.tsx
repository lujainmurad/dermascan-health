import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';

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

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        hospital_name: profile.hospital_name || '',
        specialty: profile.specialty || '',
        city: profile.city || '',
      });
    }
  }, [profile]);

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
      // Auto-verify if all fields filled
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
      </div>
    </div>
  );
};

export default Settings;
