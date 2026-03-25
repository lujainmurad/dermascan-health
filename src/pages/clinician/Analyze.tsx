import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, AlertTriangle, Download } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://supreme-space-meme-x5wgrj6ppwr739qr4-8000.app.github.dev';

interface AnalysisResult {
  prediction: string;
  confidence: number;
  overlay_image: string; // base64 or URL
  features?: Record<string, any>;
}

const ClinicianAnalyze = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Image Analysis</h1>
        <p className="text-muted-foreground mb-6">Upload a dermoscopy image for AI-powered segmentation analysis.</p>

        {!BACKEND_URL && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 flex gap-3 mb-6">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
            <div>
              <p className="font-medium text-sm text-foreground">Backend Not Connected</p>
              <p className="text-xs text-muted-foreground mt-1">Set VITE_BACKEND_URL to enable AI analysis.</p>
            </div>
          </div>
        )}

        <div className="medical-card p-6">
          {!preview ? (
            <div className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">Click to upload a dermoscopy image</p>
              <p className="text-xs text-muted-foreground">JPG, PNG accepted</p>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" onChange={handleFileSelect} className="hidden" />
            </div>
          ) : (
            <div className="space-y-4">
              {result ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Original Image</p>
                    <img src={preview} alt="Original" className="rounded-lg w-full object-contain bg-muted" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Segmentation Overlay</p>
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
                <Button variant="outline" onClick={() => { setPreview(null); setImage(null); setResult(null); }}>Clear</Button>
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
                  <Button variant="outline" disabled className="w-full">
                    <Download className="mr-2 h-4 w-4" /> Download Report — Coming Soon
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClinicianAnalyze;
