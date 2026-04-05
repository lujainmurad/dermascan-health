import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Search, MapPin, Stethoscope, Building2, Phone, Globe, Star, AlertTriangle, RotateCw, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import AppLayout from '@/components/layouts/AppLayout';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const MAPS_API_KEY = 'AIzaSyDu7FFrIAWyscOUj906OEpLunErqQH-oqw';
const DEFAULT_LAT = 31.9539;
const DEFAULT_LNG = 35.9106;

interface Specialist {
  name: string;
  specialty?: string;
  clinic?: string;
  address?: string;
  phone?: string;
  website?: string;
  distance_km?: number;
  rating?: number;
}

interface RegisteredClinician {
  user_id: string;
  full_name: string | null;
  email: string | null;
  hospital_name: string | null;
  specialty: string | null;
  city: string | null;
  phone: string | null;
  verified: boolean | null;
  hasAvailability?: boolean;
}

const FindSpecialist = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('registered');
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [registeredClinicians, setRegisteredClinicians] = useState<RegisteredClinician[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [coords, setCoords] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });

  // Fetch registered clinicians from Supabase
  useEffect(() => {
    const fetchRegistered = async () => {
      setLoading(true);
      const { data: clinicians } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, hospital_name, specialty, city, phone, verified')
        .eq('role', 'clinician');

      const list = (clinicians || []) as RegisteredClinician[];

      // Check which clinicians have availability set
      if (list.length > 0) {
        const { data: avail } = await supabase
          .from('clinician_availability')
          .select('clinician_id')
          .in('clinician_id', list.map(c => c.user_id));
        const availIds = new Set((avail || []).map((a: any) => a.clinician_id));
        list.forEach(c => { c.hasAvailability = availIds.has(c.user_id); });
      }

      setRegisteredClinicians(list);
      setLoading(false);
    };
    fetchRegistered();
  }, []);

  // Fetch nearby specialists from backend
  const fetchNearby = () => {
    setLoadingNearby(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        fetchSpecialists(c.lat, c.lng);
      },
      () => {
        fetchSpecialists(DEFAULT_LAT, DEFAULT_LNG);
      }
    );
  };

  useEffect(() => {
    if (tab === 'nearby') fetchNearby();
  }, [tab]);

  const fetchSpecialists = async (lat: number, lng: number) => {
    if (!BACKEND_URL) {
      setError('Backend not connected.');
      setLoadingNearby(false);
      return;
    }
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/specialists?lat=${lat}&lng=${lng}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSpecialists(Array.isArray(data) ? data : data.specialists || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingNearby(false);
    }
  };

  const filteredRegistered = registeredClinicians.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.specialty?.toLowerCase().includes(q) ||
      c.hospital_name?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q)
    );
  });

  const filteredNearby = specialists.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.specialty?.toLowerCase().includes(q) || s.clinic?.toLowerCase().includes(q);
  });

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">Find a Specialist</h1>
        <p className="text-muted-foreground text-sm mb-6">Browse registered clinicians or find nearby dermatologists.</p>
      </motion.div>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="registered">Registered Clinicians</TabsTrigger>
          <TabsTrigger value="nearby">Nearby Specialists</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, specialty, or location..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {tab === 'registered' && (
        <>
          {loading ? <LoadingSpinner /> : filteredRegistered.length === 0 ? (
            <div className="text-center py-12">
              <Stethoscope className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="font-semibold text-foreground mb-1">No clinicians found</p>
              <p className="text-sm text-muted-foreground">No registered clinicians match your search.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRegistered.map((c, i) => (
                <motion.div key={c.user_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                  className="clinical-card p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Stethoscope className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground truncate">{c.full_name || 'Unnamed Clinician'}</h3>
                      {c.specialty && <p className="text-xs text-primary font-semibold">{c.specialty}</p>}
                    </div>
                  </div>
                  {c.hospital_name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Building2 className="h-3.5 w-3.5 flex-shrink-0" /> <span className="truncate">{c.hospital_name}</span>
                    </div>
                  )}
                  {c.city && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" /> <span>{c.city}</span>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                      <a href={`tel:${c.phone}`} className="text-primary hover:underline">{c.phone}</a>
                    </div>
                  )}
                  <div className="mt-4">
                    <Button
                      size="sm"
                      className="w-full gradient-primary text-primary-foreground"
                      onClick={() => navigate(`/patient/book-appointment?clinician=${c.user_id}`)}
                    >
                      <Calendar className="h-4 w-4 mr-2" /> Book Appointment
                    </Button>
                    {!c.hasAvailability && (
                      <p className="text-xs text-muted-foreground text-center mt-1">
                        No online slots — you can also contact directly
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'nearby' && (
        <>
          {/* Google Maps embed */}
          <div className="rounded-xl overflow-hidden border border-border mb-6 h-64">
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/search?key=${MAPS_API_KEY}&q=dermatologist+Amman+Jordan&center=${coords.lat},${coords.lng}&zoom=13`}
              allowFullScreen
            />
          </div>

          {loadingNearby ? <LoadingSpinner /> : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
              <p className="text-foreground font-semibold mb-2">Something went wrong</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchNearby} variant="outline">
                <RotateCw className="h-4 w-4 mr-2" /> Retry
              </Button>
            </div>
          ) : filteredNearby.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNearby.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }} className="clinical-card p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Stethoscope className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground truncate">{s.name}</h3>
                      {s.specialty && <p className="text-xs text-primary font-semibold">{s.specialty}</p>}
                    </div>
                    {s.rating && (
                      <div className="flex items-center gap-1 bg-warning/10 text-warning px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0">
                        <Star className="h-3 w-3 fill-current" /> {s.rating}
                      </div>
                    )}
                  </div>
                  {s.clinic && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Building2 className="h-3.5 w-3.5 flex-shrink-0" /> <span className="truncate">{s.clinic}</span>
                    </div>
                  )}
                  {s.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" /> <span className="truncate">{s.address}</span>
                    </div>
                  )}
                  {s.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                      <a href={`tel:${s.phone}`} className="text-primary hover:underline">{s.phone}</a>
                    </div>
                  )}
                  {s.website && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                      <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{s.website.replace(/^https?:\/\//, '')}</a>
                    </div>
                  )}
                  {s.distance_km != null && (
                    <p className="text-xs text-muted-foreground mt-2 font-semibold">
                      📍 {s.distance_km.toFixed(1)} km away
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="font-semibold text-foreground mb-1">No specialists found</p>
              <p className="text-sm text-muted-foreground">{searchQuery ? 'Try adjusting your search.' : 'No nearby specialists available.'}</p>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
};

export default FindSpecialist;
