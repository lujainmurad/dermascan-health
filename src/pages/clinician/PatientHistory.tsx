import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  confirmed: 'bg-success/10 text-success border-success/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

const featureLabels: Record<string, string> = {
  asymmetry: 'Asymmetry',
  border_irregularity: 'Border Irregularity',
  n_colors: 'Number of Colors',
  solidity: 'Solidity',
  lesion_area_pct: 'Lesion Area %',
  major_axis: 'Major Axis',
  minor_axis: 'Minor Axis',
  eccentricity: 'Eccentricity',
  glcm_contrast: 'GLCM Contrast',
  lbp_entropy: 'LBP Entropy',
};

const PatientHistory = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !patientId) return;
    const fetchAll = async () => {
      const [{ data: profile }, { data: appts }, { data: patientCases }] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', patientId).single(),
        supabase.from('appointments').select('*').eq('clinician_id', user.id).eq('patient_id', patientId).order('appointment_date', { ascending: false }),
        supabase.from('cases').select('*').eq('clinician_id', user.id).eq('patient_id', patientId).order('created_at', { ascending: false }),
      ]);
      setPatient(profile);
      setAppointments(appts || []);
      setCases(patientCases || []);
      setLoading(false);
    };
    fetchAll();
  }, [user, patientId]);

  const downloadReport = (reportPdf: string, createdAt: string) => {
    const dateStr = format(new Date(createdAt), 'yyyy-MM-dd');
    const link = document.createElement('a');
    link.href = reportPdf;
    link.download = `dermascan_report_${dateStr}.pdf`;
    link.click();
  };

  if (loading) return <div className="min-h-screen bg-background"><Navbar /><LoadingSpinner /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/clinician/appointments')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Appointments
        </Button>

        {/* Patient Header */}
        <div className="medical-card p-6 mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">{patient?.full_name || 'Unknown Patient'}</h1>
          <p className="text-sm text-muted-foreground">{patient?.email}</p>
          {patient?.phone && <p className="text-sm text-muted-foreground">{patient.phone}</p>}
          {patient?.city && <p className="text-sm text-muted-foreground">{patient.city}</p>}
        </div>

        {/* Appointments Section */}
        <h2 className="text-lg font-display font-semibold text-foreground mb-3 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" /> Appointment History
        </h2>
        {appointments.length === 0 ? (
          <EmptyState icon={Calendar} title="No appointments" description="No appointment history with this patient." />
        ) : (
          <div className="space-y-2 mb-8">
            {appointments.map(a => (
              <div key={a.id} className="medical-card p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{format(new Date(a.appointment_date), 'PPP p')}</p>
                  {a.notes && <p className="text-xs text-muted-foreground mt-1">{a.notes}</p>}
                </div>
                <Badge variant="outline" className={statusColors[a.status] || ''}>{a.status}</Badge>
              </div>
            ))}
          </div>
        )}

        {/* Cases Section */}
        <h2 className="text-lg font-display font-semibold text-foreground mb-3 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> Analysis Cases
        </h2>
        {cases.length === 0 ? (
          <EmptyState icon={FileText} title="No cases" description="No analysis cases linked to this patient." />
        ) : (
          <div className="space-y-4">
            {cases.map(c => {
              const summary = c.features_summary as Record<string, number> | null;
              return (
                <Card key={c.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {c.prediction_label || 'Analysis'} — {format(new Date(c.created_at), 'PPP')}
                      </CardTitle>
                      {c.confidence != null && (
                        <span className="text-sm text-muted-foreground">Confidence: {(c.confidence * 100).toFixed(1)}%</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Images */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {c.image_url && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Original Image</p>
                          <img src={c.image_url} alt="Original" className="rounded-lg w-full object-contain bg-muted max-h-64" />
                        </div>
                      )}
                      {c.overlay_image_url && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Segmentation Overlay</p>
                          <img src={c.overlay_image_url} alt="Overlay" className="rounded-lg w-full object-contain bg-muted max-h-64" />
                        </div>
                      )}
                    </div>

                    {/* Feature Summary */}
                    {summary && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                        {Object.entries(featureLabels).map(([key, label]) => (
                          summary[key] != null && (
                            <div key={key} className="rounded-lg bg-muted p-2 text-center">
                              <p className="text-xs text-muted-foreground">{label}</p>
                              <p className="font-semibold text-sm text-foreground">{Number(summary[key]).toFixed(3)}</p>
                            </div>
                          )
                        ))}
                      </div>
                    )}

                    {/* Download Report */}
                    {c.report_pdf ? (
                      <Button variant="outline" size="sm" onClick={() => downloadReport(c.report_pdf, c.created_at)}>
                        <Download className="h-4 w-4 mr-2" /> Download Report
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        <Download className="h-4 w-4 mr-2" /> No report available
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientHistory;
