import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '@/assets/dermascan-logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, profile, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && profile) {
      navigate(profile.role === 'clinician' ? '/clinician/dashboard' : '/patient/dashboard', { replace: true });
    }
  }, [user, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-white/5 filter blur-3xl animate-float" />
        <div className="absolute bottom-20 -right-20 w-72 h-72 rounded-full bg-white/5 filter blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        <div className="max-w-md relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <img src={logo} alt="DermaScan" className="w-12 h-12 rounded-xl" />
            <span className="text-white font-bold text-xl">DermaScan</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight tracking-tight">
            Your skin health companion
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            AI-powered skin analysis, trusted by patients and clinicians. Get instant assessments and connect with specialists.
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
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground text-sm mt-1">Sign in to your account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full h-10 gradient-primary text-primary-foreground shadow-md hover:shadow-lg active:scale-[0.98] transition-all" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign In
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account? <Link to="/register" className="text-primary hover:underline font-medium">Sign up</Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
