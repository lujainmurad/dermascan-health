import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Search, MapPin, Stethoscope, Building2, Clock, MessageSquare } from 'lucide-react';

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Clinician {
  id: string;
  user_id: string;
  full_name: string | null;
  hospital_name: string | null;
  specialty: string | null;
  city: string | null;
}

interface AvailRow {
  clinician_id: string;
  day_of_week: number;
}

const FindSpecialist = () => {
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [availMap, setAvailMap] = useState<Record<string, number[]>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [{ data: profiles }, { data: avail }] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'clinician').eq('verified', true),
      supabase.from('clinician_availability').select('clinician_id, day_of_week'),
    ]);
    setClinicians((profiles as Clinician[]) || []);

    const map: Record<string, number[]> = {};
    (avail as AvailRow[] || []).forEach(a => {
      if (!map[a.clinician_id]) map[a.clinician_id] = [];
      if (!map[a.clinician_id].includes(a.day_of_week)) {
        map[a.clinician_id].push(a.day_of_week);
      }
    });
    setAvailMap(map);
    setLoading(false);
  };

  const filtered = clinicians.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.hospital_name?.toLowerCase().includes(q) ||
      c.specialty?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Find a Specialist</h1>
        <p className="text-muted-foreground mb-6">Search for verified dermatology specialists in your area.</p>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by city, name, or specialty..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(c => {
              const days = availMap[c.user_id];
              const hasAvailability = days && days.length > 0;

              return (
                <div key={c.id} className="medical-card p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Stethoscope className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground">{c.full_name || 'Unnamed'}</h3>
                      {c.specialty && <p className="text-xs text-primary font-medium">{c.specialty}</p>}
                    </div>
                  </div>
                  {c.hospital_name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Building2 className="h-3.5 w-3.5" /> {c.hospital_name}
                    </div>
                  )}
                  {c.city && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-3.5 w-3.5" /> {c.city}
                    </div>
                  )}

                  {hasAvailability ? (
                    <>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Clock className="h-3.5 w-3.5" />
                        Available: {days.sort((a, b) => a - b).map(d => DAY_NAMES_SHORT[d]).join(', ')}
                      </div>
                      <Button asChild className="w-full" size="sm">
                        <Link to={`/patient/book-appointment?clinician=${c.user_id}`}>Book Appointment</Link>
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Contact to schedule
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <EmptyState
              icon={Search}
              title="No specialists found"
              description={searchQuery ? 'Try adjusting your search terms.' : 'No verified clinicians are available yet.'}
            />
            <div className="medical-card p-6 max-w-md mx-auto mt-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Need help finding a dermatologist? Contact us at <strong>support@dermascan.ai</strong>
              </p>
              <div className="rounded-lg bg-muted p-8 text-center text-sm text-muted-foreground">
                Map loads here
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindSpecialist;
