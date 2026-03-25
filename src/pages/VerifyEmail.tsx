import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const VerifyEmail = () => (
  <div className="min-h-screen flex items-center justify-center bg-background px-6">
    <div className="w-full max-w-md text-center">
      <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mx-auto mb-6">
        <Mail className="h-7 w-7 text-primary" />
      </div>
      <h1 className="text-2xl font-display font-bold text-foreground mb-3 tracking-tight">Check your email</h1>
      <p className="text-muted-foreground text-sm leading-relaxed mb-8">
        We've sent a verification link to your email address. Please click the link to verify your account and continue.
      </p>
      <Button asChild variant="outline">
        <Link to="/login">Back to Sign In</Link>
      </Button>
    </div>
  </div>
);

export default VerifyEmail;
