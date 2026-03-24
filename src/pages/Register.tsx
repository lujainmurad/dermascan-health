import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Stethoscope } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'clinician'>('patient');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'Password too short', description: 'Use at least 6 characters', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, role);
    setLoading(false);
    if (error) {
      toast({ title: 'Registration failed', description: error.message, variant: 'destructive' });
    } else {
      navigate('/verify-email');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl medical-gradient flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-lg">D</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Create your account</h1>
          <p className="text-muted-foreground text-sm mt-1">Join DermaScan AI</p>
        </div>
        <form onSubmit={handleSubmit} className="medical-card p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="At least 6 characters" />
          </div>
          <div className="space-y-3">
            <Label>I am a...</Label>
            <RadioGroup value={role} onValueChange={(v) => setRole(v as 'patient' | 'clinician')} className="grid grid-cols-2 gap-3">
              <Label
                htmlFor="role-patient"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  role === 'patient' ? 'border-primary bg-accent' : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value="patient" id="role-patient" className="sr-only" />
                <Shield className="h-6 w-6 text-primary" />
                <span className="font-medium text-sm text-foreground">Patient</span>
              </Label>
              <Label
                htmlFor="role-clinician"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  role === 'clinician' ? 'border-primary bg-accent' : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value="clinician" id="role-clinician" className="sr-only" />
                <Stethoscope className="h-6 w-6 text-primary" />
                <span className="font-medium text-sm text-foreground">Clinician</span>
              </Label>
            </RadioGroup>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Account
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
