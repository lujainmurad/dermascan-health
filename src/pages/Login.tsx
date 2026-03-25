import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
    }
  };

  if (profile) {
    navigate(profile.role === 'clinician' ? '/clinician/dashboard' : '/patient/dashboard', { replace: true });
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 clinical-gradient items-center justify-center p-12">
        <div className="max-w-md">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-8">
            <span className="text-white font-bold text-lg">Cl</span>
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-4 leading-tight tracking-tight">
            Clinical-grade dermatology intelligence
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            Claritas combines AI-powered skin analysis with clinical workflow tools 
            to support better diagnostic outcomes.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 bg-background">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2.5 mb-8 lg:hidden">
              <div className="w-8 h-8 rounded-lg clinical-gradient flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">Cl</span>
              </div>
              <span className="font-display font-bold text-lg text-foreground tracking-tight">Claritas</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">Welcome back</h1>
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
            <Button type="submit" className="w-full h-10" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign In
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account? <Link to="/register" className="text-primary hover:underline font-medium">Sign up</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
