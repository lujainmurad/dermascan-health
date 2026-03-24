import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, Loader2, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface AnalysisResult {
  prediction: string;
  confidence: number;
  recommendation: string;
  high_risk: boolean;
}

const PatientAnalyze = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!image || !user) return;

    if (!BACKEND_URL) {
      toast({ title: 'Backend not connected', description: 'The AI analysis backend URL is not configured. Set VITE_BACKEND_URL.', variant: 'destructive' });
      return;
    }

    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await fetch(`${BACKEND_URL}/analyze/patient`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Analysis failed');
      const data: AnalysisResult = await response.json();
      setResult(data);

      // Save case to Supabase
      const { error } = await supabase.from('cases').insert({
        patient_id: user.id,
        prediction_label: data.prediction,
        confidence: data.confidence,
        recommendation: data.recommendation,
        status: data.high_risk ? 'high_risk' : 'low_risk',
      });
      if (error) console.error('Failed to save case:', error);
    } catch (err: any) {
      toast({ title: 'Analysis Error', description: err.message || 'Failed to analyze image', variant: 'destructive' });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Analyze a Lesion</h1>
        <p className="text-muted-foreground mb-6">Upload or capture an image for AI-powered skin analysis.</p>

        {!BACKEND_URL && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 flex gap-3 mb-6">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-foreground">Backend Not Connected</p>
              <p className="text-xs text-muted-foreground mt-1">
                The AI analysis backend is not configured. Set the VITE_BACKEND_URL environment variable to enable analysis.
              </p>
            </div>
          </div>
        )}

        <div className="medical-card p-6">
          {!preview ? (
            <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <Camera className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Capture or upload an image of the skin lesion</p>
                <div className="flex gap-3">
                  <Button onClick={() => cameraInputRef.current?.click()} variant="outline">
                    <Camera className="mr-2 h-4 w-4" /> Use Camera
                  </Button>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Upload File
                  </Button>
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-muted">
                <img src={preview} alt="Lesion preview" className="w-full max-h-96 object-contain" />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleAnalyze} disabled={analyzing || !BACKEND_URL} className="flex-1">
                  {analyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : 'Analyze'}
                </Button>
                <Button variant="outline" onClick={() => { setPreview(null); setImage(null); setResult(null); }}>
                  Clear
                </Button>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-4">
              <div className={`rounded-xl p-5 ${result.high_risk ? 'bg-destructive/10 border border-destructive/20' : 'bg-success/10 border border-success/20'}`}>
                <div className="flex items-center gap-3 mb-3">
                  {result.high_risk ? (
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  ) : (
                    <CheckCircle className="h-6 w-6 text-success" />
                  )}
                  <div>
                    <p className="font-display font-semibold text-foreground">{result.prediction}</p>
                    <p className="text-sm text-muted-foreground">Confidence: {(result.confidence * 100).toFixed(1)}%</p>
                  </div>
                </div>
                <p className="text-sm text-foreground">{result.recommendation}</p>
              </div>

              {result.high_risk && (
                <Button asChild className="w-full" size="lg">
                  <Link to="/patient/find-specialist">
                    <Calendar className="mr-2 h-4 w-4" /> Book an Appointment
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientAnalyze;
