import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { lovable } from '@/integrations/lovable/index';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Stethoscope } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInYears } from 'date-fns';
import logo from '@/assets/dermascan-logo.png';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'clinician'>('patient');
  const [dobStr, setDobStr] = useState('');
  const [sex, setSex] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result?.error) {
      toast({ title: 'Google sign-in failed', description: String(result.error), variant: 'destructive' });
    }
    setGoogleLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'Password too short', description: 'Use at least 6 characters', variant: 'destructive' });
      return;
    }
    if (role === 'patient') {
      if (!dobStr) {
        toast({ title: 'Date of birth required', description: 'Please enter your date of birth', variant: 'destructive' });
        return;
      }
      const dob = new Date(dobStr + 'T00:00:00');
      const age = differenceInYears(new Date(), dob);
      if (age < 1 || age > 120) {
        toast({ title: 'Invalid age', description: 'Age must be between 1 and 120', variant: 'destructive' });
        return;
      }
      if (!sex) {
        toast({ title: 'Sex required', description: 'Please select your sex', variant: 'destructive' });
        return;
      }
    }
    setLoading(true);
    const { error } = await signUp(email, password, role, role === 'patient' ? { date_of_birth: dobStr, sex } : undefined);
    setLoading(false);
    if (error) {
      toast({ title: 'Registration failed', description: error.message, variant: 'destructive' });
    } else {
      navigate('/verify-email');
    }
  };

  // Compute max date (today) for the native date input
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-white/5 filter blur-3xl animate-float" />
        <div className="max-w-md relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <img src={logo} alt="DermaScan" className="w-12 h-12 rounded-xl" />
            <span className="text-white font-bold text-xl">DermaScan</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight tracking-tight">
            Take control of your skin health
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            Join patients and clinicians using AI-powered skin analysis for better, faster outcomes.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2.5 mb-8 lg:hidden">
              <img src={logo} alt="DermaScan" className="w-8 h-8 rounded-lg" />
              <span className="font-bold text-lg text-foreground tracking-tight">DermaScan</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Create your account</h1>
            <p className="text-muted-foreground text-sm mt-1">Get started with DermaScan</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selection */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">I am a...</Label>
              <RadioGroup value={role} onValueChange={(v) => setRole(v as 'patient' | 'clinician')} className="grid grid-cols-2 gap-3">
                <Label
                  htmlFor="role-patient"
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    role === 'patient' ? 'border-primary bg-secondary' : 'border-border hover:border-primary/40'
                  }`}
                >
                  <RadioGroupItem value="patient" id="role-patient" className="sr-only" />
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-sm text-foreground">Patient</span>
                </Label>
                <Label
                  htmlFor="role-clinician"
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    role === 'clinician' ? 'border-primary bg-secondary' : 'border-border hover:border-primary/40'
                  }`}
                >
                  <RadioGroupItem value="clinician" id="role-clinician" className="sr-only" />
                  <Stethoscope className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-sm text-foreground">Clinician</span>
                </Label>
              </RadioGroup>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={role} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="At least 6 characters" />
                </div>
                {role === 'patient' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={dobStr}
                        onChange={e => setDobStr(e.target.value)}
                        max={today}
                        className="block w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sex</Label>
                      <Select value={sex} onValueChange={setSex}>
                        <SelectTrigger><SelectValue placeholder="Select sex" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
            <Button type="submit" className="w-full h-10 gradient-primary text-primary-foreground shadow-md hover:shadow-lg active:scale-[0.98] transition-all" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Account
            </Button>
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div>
            </div>
            <Button type="button" variant="outline" className="w-full h-10" disabled={googleLoading} onClick={handleGoogleSignIn}>
              {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              )}
              Continue with Google
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
