import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Users, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

const PatientCases = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientNames, setPatientNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    const fetchCases = async () => {
      const { data } = await supabase
        .from('cases')
        .select('*')
        .eq('clinician_id', user.id)
        .order('created_at', { ascending: false });
      setCases(data || []);
      setLoading(false);
    };
    fetchCases();
  }, [user]);

  useEffect(() => {
    const ids = [...new Set(cases.map(c => c.patient_id))];
    if (ids.length === 0) return;
    supabase.from('profiles').select('user_id, full_name, email').in('user_id', ids).then(({ data }) => {
      const map: Record<string, string> = {};
      data?.forEach((p: any) => { map[p.user_id] = p.full_name || p.email || 'Unknown'; });
      setPatientNames(map);
    });
  }, [cases]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">Patient Cases</h1>
        {loading ? <LoadingSpinner /> : cases.length === 0 ? (
          <EmptyState icon={Users} title="No cases yet" description="Patient cases assigned to you will appear here." />
        ) : (
          <div className="medical-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Patient</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Prediction</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Confidence</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map(c => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                      <td className="p-4 text-sm text-foreground">{patientNames[c.patient_id] || 'Loading...'}</td>
                      <td className="p-4 text-sm text-muted-foreground">{format(new Date(c.created_at), 'PP')}</td>
                      <td className="p-4">
                        <Badge variant="outline" className={c.status === 'high_risk' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-success/10 text-success border-success/20'}>
                          {c.prediction_label || 'N/A'}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{c.confidence ? `${(c.confidence * 100).toFixed(1)}%` : 'N/A'}</td>
                      <td className="p-4">
                        <Link to={`/clinician/cases/${c.id}`} className="text-primary hover:underline text-sm inline-flex items-center gap-1">
                          View <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientCases;
