import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, AlertTriangle, Download, Save, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import AppLayout from '@/components/layouts/AppLayout';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

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
  recommendation: string;
  overlay_image: string;
  features?: Record<string, any>;
  feature_summary?: FeatureSummary;
  report_pdf?: string;
  report_ready?: boolean;
  probabilities?: { Nevus: number; Melanoma: number; 'Seborrheic Keratosis': number };
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

const predictionColors: Record<string, string> = {
  Melanoma: 'bg-destructive text-destructive-foreground',
  'Seborrheic Keratosis': 'bg-warning text-warning-foreground',
  Nevus: 'bg-success text-success-foreground',
};

interface PatientOption {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

const ClinicianAnalyze = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get('patientId');
  const patientNameFromUrl = searchParams.get('patientName') || '';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Patient selector for walk-in or linking
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patientIdFromUrl || '');
  const [saveToPatient, setSaveToPatient] = useState(!!patientIdFromUrl);

  // If coming from a patient record, auto-link
  const isFromPatientRecord = !!patientIdFromUrl;

  useEffect(() => {
    // Fetch patients the clinician has appointments with
    if (!user) return;
    const fetchPatients = async () => {
      const { data: appts } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('clinician_id', user.id);
      const ids = [...new Set((appts || []).map(a => a.patient_id))];
      if (ids.length === 0) return;
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', ids);
      setPatients((profiles as PatientOption[]) || []);
    };
    fetchPatients();
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setSaved(false);
    }
  };

  const effectivePatientId = selectedPatientId || null;

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

      const headers: Record<string, string> = {};
      if (effectivePatientId) {
        const { data: patientProfile } = await supabase
          .from('profiles')
          .select('date_of_birth, sex')
          .eq('user_id', effectivePatientId)
          .single();
        if (patientProfile) {
          if ((patientProfile as any).date_of_birth) {
            headers['X-Patient-DOB'] = (patientProfile as any).date_of_birth;
          }
          if ((patientProfile as any).sex) {
            headers['X-Patient-Sex'] = (patientProfile as any).sex;
          }
        }
      }

      const response = await fetch(`${BACKEND_URL}/analyze/clinician`, {
        method: 'POST',
        body: formData,
        headers,
      });
      if (!response.ok) throw new Error('Analysis failed');
      const data: AnalysisResult = await response.json();
      setResult(data);

      // Auto-save if from patient record
      if (isFromPatientRecord && patientIdFromUrl) {
        await saveCase(data, patientIdFromUrl);
      }
    } catch (err: any) {
      toast({ title: 'Analysis Error', description: err.message, variant: 'destructive' });
    } finally {
      setAnalyzing(false);
    }
  };

  const dataUrlToBlob = (dataUrl: string): Blob | null => {
    try {
      const [header, b64] = dataUrl.split(',');
      const mimeMatch = header.match(/data:([^;]+);base64/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new Blob([bytes], { type: mime });
    } catch {
      return null;
    }
  };

  const uploadToBucket = async (blob: Blob, path: string): Promise<string | null> => {
    const { error } = await supabase.storage
      .from('case-images')
      .upload(path, blob, { contentType: blob.type, upsert: false });
    if (error) {
      console.warn('Storage upload failed:', error.message);
      return null;
    }
    const { data: { publicUrl } } = supabase.storage.from('case-images').getPublicUrl(path);
    return publicUrl;
  };

  const saveCase = async (analysisResult: AnalysisResult, patientId: string | null) => {
    if (!user || !image) return;
    setSaving(true);
    try {
      const ts = Date.now();

      // 1. Upload original image
      let imageUrl: string | null = null;
      const origPath = `${user.id}/${ts}_original_${image.name}`;
      imageUrl = await uploadToBucket(image, origPath);

      // 2. Upload overlay image (convert base64 → blob)
      let overlayUrl: string | null = null;
      if (analysisResult.overlay_image?.startsWith('data:')) {
        const overlayBlob = dataUrlToBlob(analysisResult.overlay_image);
        if (overlayBlob) {
          const overlayPath = `${user.id}/${ts}_overlay.png`;
          overlayUrl = await uploadToBucket(overlayBlob, overlayPath);
        }
      } else if (analysisResult.overlay_image) {
        overlayUrl = analysisResult.overlay_image;
      }

      // 3. Only store PDF if under 1MB (base64 size)
      let reportPdf: string | null = null;
      if (analysisResult.report_pdf) {
        const pdfBytes = analysisResult.report_pdf.length * 0.75; // approx base64 → bytes
        if (pdfBytes < 1024 * 1024) {
          reportPdf = analysisResult.report_pdf;
        } else {
          console.warn('Report PDF exceeds 1MB, skipping DB storage');
        }
      }

      const insertData: Record<string, any> = {
        clinician_id: user.id,
        image_url: imageUrl,
        overlay_image_url: overlayUrl,
        prediction_label: analysisResult.prediction,
        confidence: analysisResult.confidence,
        features_summary: analysisResult.feature_summary ?? null,
        report_pdf: reportPdf,
        recommendation: analysisResult.recommendation || null,
        status: 'reviewed',
      };
      if (patientId) insertData.patient_id = patientId;

      const { error: insertError, data: insertedData } = await supabase
        .from('cases')
        .insert(insertData as any)
        .select();

      if (insertError) {
        console.error('Case insert error:', insertError);
        toast({
          title: 'Save Failed',
          description: `${insertError.message}${insertError.code ? ` (${insertError.code})` : ''}`,
          variant: 'destructive',
        });
        return;
      }
      console.log('Case saved successfully:', insertedData);
      setSaved(true);
      toast({ title: 'Case saved', description: patientId ? 'Saved to patient record.' : 'Saved as standalone case.' });
    } catch (err: any) {
      console.error('Save error:', err);
      toast({ title: 'Save Error', description: err.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleManualSave = () => {
    if (!result) return;
    saveCase(result, saveToPatient ? selectedPatientId : null);
  };

  const downloadReport = () => {
    if (!result?.report_pdf) return;
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const link = document.createElement('a');
    link.href = result.report_pdf;
    link.download = `dermascan_report_${dateStr}.pdf`;
    link.click();
  };

  const predClass = result?.prediction || '';
  const badgeColor = predictionColors[predClass] || 'bg-muted text-muted-foreground';

  const displayPatientName = isFromPatientRecord
    ? patientNameFromUrl
    : patients.find(p => p.user_id === selectedPatientId)?.full_name || '';

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Image Analysis</h1>
          {isFromPatientRecord ? (
            <p className="text-sm text-muted-foreground mt-1">
              Analyzing for <span className="font-semibold text-foreground">{patientNameFromUrl}</span> — results auto-save to their record.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              Analyze a dermoscopy image. Optionally link to a patient record.
            </p>
          )}
        </div>

        {!BACKEND_URL && (
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 flex gap-3 mb-6">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm text-foreground">Backend Not Connected</p>
              <p className="text-xs text-muted-foreground mt-1">Set VITE_BACKEND_URL to enable AI analysis.</p>
            </div>
          </div>
        )}

        {/* Patient selector (only when NOT from patient record) */}
        {!isFromPatientRecord && (
          <div className="clinical-card p-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="linkPatient"
                  checked={saveToPatient}
                  onChange={e => setSaveToPatient(e.target.checked)}
                  className="rounded border-border"
                />
                <Label htmlFor="linkPatient" className="text-sm font-medium cursor-pointer">Link to patient record</Label>
              </div>
              {saveToPatient && (
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Select patient..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(p => (
                      <SelectItem key={p.user_id} value={p.user_id}>
                        {p.full_name || p.email || 'Unknown'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}

        <div className="clinical-card p-6">
          {!preview ? (
            <div className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-sm mb-2">Click to upload a dermoscopy image</p>
              <p className="text-xs text-muted-foreground mb-4">JPG, PNG accepted</p>
              <div className="flex gap-3 justify-center">
                <Button type="button" variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}>
                  <Camera className="mr-2 h-4 w-4" /> Use Camera
                </Button>
                <Button type="button" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  <Upload className="mr-2 h-4 w-4" /> Upload File
                </Button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" onChange={handleFileSelect} className="hidden" />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
            </div>
          ) : (
            <div className="space-y-4">
              {result ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Original</p>
                    <img src={preview} alt="Original" className="rounded-xl w-full object-contain bg-muted" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Segmentation</p>
                    <img src={result.overlay_image} alt="Segmentation overlay" className="rounded-xl w-full object-contain bg-muted" />
                  </div>
                </div>
              ) : (
                <img src={preview} alt="Preview" className="rounded-xl w-full max-h-96 object-contain bg-muted" />
              )}

              <div className="flex gap-3">
                <Button onClick={handleAnalyze} disabled={analyzing || !BACKEND_URL} className="flex-1 gradient-primary text-primary-foreground shadow-md hover:shadow-lg active:scale-[0.98] transition-all">
                  {analyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : 'Analyze'}
                </Button>
                <Button variant="outline" onClick={() => { setPreview(null); setImage(null); setResult(null); setSaved(false); }}>Clear</Button>
              </div>

              {result && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mt-4">
                  {/* Prediction Badge */}
                  <div className="rounded-xl bg-card border border-border p-6 text-center">
                    <Badge className={`${badgeColor} text-lg px-6 py-2 font-bold mb-3`}>
                      {result.prediction}
                    </Badge>
                    <p className="text-2xl font-bold text-foreground">{(result.confidence * 100).toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Confidence</p>
                    {result.recommendation && (
                      <p className="text-sm text-foreground mt-4 bg-muted rounded-lg p-3">{result.recommendation}</p>
                    )}
                  </div>

                  {/* Probabilities */}
                  {result.probabilities && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold">Class Probabilities</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {Object.entries(result.probabilities).map(([cls, prob]) => {
                          const pct = (prob * 100).toFixed(1);
                          const barColor = cls === 'Melanoma' ? 'bg-destructive' : cls === 'Seborrheic Keratosis' ? 'bg-warning' : 'bg-success';
                          return (
                            <div key={cls}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-foreground">{cls}</span>
                                <span className="text-muted-foreground">{pct}%</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  )}

                  {/* Feature Summary */}
                  {result.feature_summary && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold">Feature Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                          {(Object.keys(featureLabels) as (keyof FeatureSummary)[]).map((key) => (
                            <div key={key} className="rounded-xl bg-muted p-3 text-center">
                              <p className="text-xs text-muted-foreground mb-1">{featureLabels[key]}</p>
                              <p className="font-bold text-foreground text-sm">
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

                  {/* Save Case (manual, when not auto-saved) */}
                  {!isFromPatientRecord && !saved && (
                    <Button onClick={handleManualSave} disabled={saving || saved} className="w-full gradient-primary text-primary-foreground shadow-md">
                      {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                        : <><Save className="mr-2 h-4 w-4" /> Save Case{saveToPatient && selectedPatientId ? ` to ${displayPatientName}` : ' (standalone)'}</>}
                    </Button>
                  )}

                  {saved && (
                    <div className="text-center text-sm text-success font-medium py-2">
                      ✓ Case saved successfully
                    </div>
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
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default ClinicianAnalyze;
