import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ExternalLink, ScanSearch } from 'lucide-react';
import { format } from 'date-fns';
import AppLayout from '@/components/layouts/AppLayout';

const PatientCases = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  // Get unique patients for the "Analyze" button
  const uniquePatients = [...new Set(cases.map(c => c.patient_id))];

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">Patient Cases</h1>
          <p className="text-sm text-muted-foreground mt-1">View and manage all patient analysis records.</p>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : cases.length === 0 ? (
        <EmptyState icon={Users} title="No cases yet" description="Patient cases assigned to you will appear here." />
      ) : (
        <div className="clinical-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Patient</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Prediction</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Confidence</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map(c => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground font-medium">{patientNames[c.patient_id] || 'Loading...'}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-primary"
                          onClick={() => navigate(`/clinician/analyze?patientId=${c.patient_id}&patientName=${encodeURIComponent(patientNames[c.patient_id] || 'Patient')}`)}
                          title="Analyze new image for this patient"
                        >
                          <ScanSearch className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
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
    </AppLayout>
  );
};

export default PatientCases;
