import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Stethoscope, CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInYears } from 'date-fns';
import { cn } from '@/lib/utils';
import logo from '@/assets/dermascan-logo.png';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'clinician'>('patient');
  const [dob, setDob] = useState<Date | undefined>();
  const [sex, setSex] = useState('');
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
    if (role === 'patient') {
      if (!dob) {
        toast({ title: 'Date of birth required', description: 'Please select your date of birth', variant: 'destructive' });
        return;
      }
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
    const { error } = await signUp(email, password, role, role === 'patient' ? { date_of_birth: format(dob!, 'yyyy-MM-dd'), sex } : undefined);
    setLoading(false);
    if (error) {
      toast({ title: 'Registration failed', description: error.message, variant: 'destructive' });
    } else {
      navigate('/verify-email');
    }
  };

  const maxDate = new Date();
  const minDate = new Date(maxDate.getFullYear() - 120, 0, 1);

  return (
    <div className="min-h-screen flex">
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
            Join thousands of patients and clinicians using AI-powered skin analysis for better, faster outcomes.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 bg-background">
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
                      <Label>Date of Birth</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dob && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dob ? format(dob, 'PPP') : 'Select your date of birth'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dob}
                            onSelect={setDob}
                            disabled={(d) => d > maxDate || d < minDate}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                            captionLayout="dropdown-buttons"
                            fromYear={1905}
                            toYear={new Date().getFullYear()}
                          />
                        </PopoverContent>
                      </Popover>
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
