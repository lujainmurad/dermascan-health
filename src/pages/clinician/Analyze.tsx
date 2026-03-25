import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, AlertTriangle, Download, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import AppLayout from '@/components/layouts/AppLayout';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://supreme-space-meme-x5wgrj6ppwr739qr4-8000.app.github.dev';

interface FeatureSummary {
  asymmetry: number;
  border_irregularity: number;
  n_colors: number;
  solidity: number;
  lesion_area_pct: number;
  major_axis: number;
  minor_axis: number;
  eccentricity: number;
  glcm_contrast: number;
  lbp_entropy: number;
}

interface AnalysisResult {
  prediction: string;
  confidence: number;
  overlay_image: string;
  features?: Record<string, any>;
  feature_summary?: FeatureSummary;
  report_pdf?: string;
  report_ready?: boolean;
}

const featureLabels: Record<keyof FeatureSummary, string> = {
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

const ClinicianAnalyze = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');
  const patientName = searchParams.get('patientName') || 'Patient';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setSaved(false);
    }
  };

  const handleAnalyze = async () => {
    if (!image || !user) return;
    if (!BACKEND_URL) {
      toast({ title: 'Backend not connected', description: 'Set VITE_BACKEND_URL to enable analysis.', variant: 'destructive' });
      return;
    }

    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', image);
      const response = await fetch(`${BACKEND_URL}/analyze/clinician`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Analysis failed');
      const data: AnalysisResult = await response.json();
      setResult(data);
    } catch (err: any) {
      toast({ title: 'Analysis Error', description: err.message, variant: 'destructive' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveCase = async () => {
    if (!result || !user || !image || !patientId) return;
    setSaving(true);

    try {
      const fileName = `${user.id}/${Date.now()}_${image.name}`;
      const { error: uploadError } = await supabase.storage.from('case-images').upload(fileName, image);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('case-images').getPublicUrl(fileName);

      const { error: insertError } = await supabase.from('cases').insert({
        clinician_id: user.id,
        patient_id: patientId,
        image_url: publicUrl,
        overlay_image_url: result.overlay_image || null,
        prediction_label: result.prediction,
        confidence: result.confidence,
        features_summary: result.feature_summary ? (result.feature_summary as any) : null,
        report_pdf: result.report_pdf || null,
        status: 'reviewed',
      });

      if (insertError) throw insertError;
      setSaved(true);
      toast({ title: 'Case saved', description: 'Analysis results have been saved to the patient record.' });
    } catch (err: any) {
      toast({ title: 'Save Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const downloadReport = () => {
    if (!result?.report_pdf) return;
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const link = document.createElement('a');
    link.href = result.report_pdf;
    link.download = `dermascan_report_${dateStr}.pdf`;
    link.click();
  };

  return (
    <AppLayout>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">Image Analysis</h1>
          {patientId && (
            <p className="text-sm text-muted-foreground mt-1">
              Analyzing for <span className="font-medium text-foreground">{patientName}</span>
            </p>
          )}
        </div>

        {!BACKEND_URL && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 flex gap-3 mb-6">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
            <div>
              <p className="font-medium text-sm text-foreground">Backend Not Connected</p>
              <p className="text-xs text-muted-foreground mt-1">Set VITE_BACKEND_URL to enable AI analysis.</p>
            </div>
          </div>
        )}

        <div className="clinical-card p-6">
          {!preview ? (
            <div className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-sm mb-2">Click to upload a dermoscopy image</p>
              <p className="text-xs text-muted-foreground">JPG, PNG accepted</p>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" onChange={handleFileSelect} className="hidden" />
            </div>
          ) : (
            <div className="space-y-4">
              {result ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Original</p>
                    <img src={preview} alt="Original" className="rounded-lg w-full object-contain bg-muted" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Segmentation</p>
                    <img src={result.overlay_image} alt="Segmentation overlay" className="rounded-lg w-full object-contain bg-muted" />
                  </div>
                </div>
              ) : (
                <img src={preview} alt="Preview" className="rounded-lg w-full max-h-96 object-contain bg-muted" />
              )}

              <div className="flex gap-3">
                <Button onClick={handleAnalyze} disabled={analyzing || !BACKEND_URL} className="flex-1">
                  {analyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : 'Analyze'}
                </Button>
                <Button variant="outline" onClick={() => { setPreview(null); setImage(null); setResult(null); setSaved(false); }}>Clear</Button>
              </div>

              {result && (
                <div className="space-y-4 mt-4">
                  <div className="rounded-xl bg-accent p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-display font-semibold text-foreground">{result.prediction}</p>
                      <p className="text-sm text-muted-foreground">Confidence: {(result.confidence * 100).toFixed(1)}%</p>
                    </div>
                    {result.features && (
                      <div className="mt-3 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Extracted Features:</p>
                        {Object.entries(result.features).map(([k, v]) => (
                          <p key={k}>{k}: {String(v)}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  {result.feature_summary && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Feature Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                          {(Object.keys(featureLabels) as (keyof FeatureSummary)[]).map((key) => (
                            <div key={key} className="rounded-lg bg-muted p-3 text-center">
                              <p className="text-xs text-muted-foreground mb-1">{featureLabels[key]}</p>
                              <p className="font-semibold text-foreground text-sm">
                                {typeof result.feature_summary![key] === 'number'
                                  ? result.feature_summary![key].toFixed(3)
                                  : String(result.feature_summary![key])}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Save Case */}
                  {patientId && (
                    <Button onClick={handleSaveCase} disabled={saving || saved} className="w-full">
                      {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                        : saved ? <><Save className="mr-2 h-4 w-4" /> Saved</>
                        : <><Save className="mr-2 h-4 w-4" /> Save Case</>}
                    </Button>
                  )}

                  {result.report_ready && result.report_pdf ? (
                    <Button variant="outline" className="w-full" onClick={downloadReport}>
                      <Download className="mr-2 h-4 w-4" /> Download Report
                    </Button>
                  ) : (
                    <Button variant="outline" disabled className="w-full">
                      <Download className="mr-2 h-4 w-4" /> Download Report — Coming Soon
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ClinicianAnalyze;
