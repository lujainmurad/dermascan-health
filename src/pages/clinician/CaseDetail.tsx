import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import AppLayout from '@/components/layouts/AppLayout';

const CaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [caseData, setCaseData] = useState<any>(null);
  const [patientName, setPatientName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchCase = async () => {
      const { data } = await supabase.from('cases').select('*').eq('id', id).single();
      setCaseData(data);
      if (data?.patient_id) {
        const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('user_id', data.patient_id).single();
        setPatientName(profile?.full_name || profile?.email || 'Unknown');
      }
      setLoading(false);
    };
    fetchCase();
  }, [id]);

  if (loading) return <AppLayout><LoadingSpinner /></AppLayout>;
  if (!caseData) return <AppLayout><p className="text-muted-foreground">Case not found.</p></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-4xl">
        <Button asChild variant="ghost" className="mb-4 -ml-2">
          <Link to="/clinician/cases"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Cases</Link>
        </Button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">Case Detail</h1>
          <Badge variant="outline" className={caseData.status === 'high_risk' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-success/10 text-success border-success/20'}>
            {caseData.status}
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {caseData.image_url && (
            <div className="clinical-card p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Original Image</p>
              <img src={caseData.image_url} alt="Case" className="rounded-lg w-full object-contain bg-muted" />
            </div>
          )}
          {caseData.overlay_image_url && (
            <div className="clinical-card p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Segmentation Overlay</p>
              <img src={caseData.overlay_image_url} alt="Overlay" className="rounded-lg w-full object-contain bg-muted" />
            </div>
          )}
        </div>

        <div className="clinical-card p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Patient</p>
              <p className="font-medium text-foreground">{patientName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Date</p>
              <p className="font-medium text-foreground">{format(new Date(caseData.created_at), 'PPP p')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Prediction</p>
              <p className="font-medium text-foreground">{caseData.prediction_label || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Confidence</p>
              <p className="font-medium text-foreground">{caseData.confidence ? `${(caseData.confidence * 100).toFixed(1)}%` : 'N/A'}</p>
            </div>
          </div>
          {caseData.recommendation && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Recommendation</p>
              <p className="text-sm text-foreground mt-1">{caseData.recommendation}</p>
            </div>
          )}
          {caseData.features_summary && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Features Summary</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {Object.entries(caseData.features_summary as Record<string, any>).map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-muted p-2 text-center">
                    <p className="text-[10px] text-muted-foreground">{k.replace(/_/g, ' ')}</p>
                    <p className="font-semibold text-sm text-foreground">{typeof v === 'number' ? v.toFixed(3) : String(v)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {caseData.notes && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Notes</p>
              <p className="text-sm text-foreground mt-1">{caseData.notes}</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default CaseDetail;
