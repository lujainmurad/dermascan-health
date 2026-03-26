import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Heart, Camera, Brain, Stethoscope, Shield, ArrowRight, ShieldCheck, Calendar, MapPin } from 'lucide-react';
import logo from '@/assets/dermascan-logo.png';

const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const Landing = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-20 -left-36 w-72 h-72 rounded-full bg-primary/10 filter blur-3xl opacity-20 animate-float" />
      <div className="absolute top-60 -right-36 w-72 h-72 rounded-full bg-accent/10 filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '3s' }} />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="DermaScan" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-lg text-foreground tracking-tight">DermaScan</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="text-sm">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild className="text-sm gradient-primary text-primary-foreground shadow-md hover:shadow-lg active:scale-[0.98] transition-all">
              <Link to="/register">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold mb-8 border border-border">
              <Heart className="h-3.5 w-3.5" />
              AI-Powered Skin Health
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight">
              Your skin health,{' '}
              <span className="text-gradient">understood clearly</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              DermaScan uses advanced AI to analyze skin concerns and connect you with verified dermatologists — all from the comfort of your home.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="text-sm px-8 h-12 gradient-hero text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all font-bold">
                <Link to="/register">Start Your Free Scan <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-sm px-8 h-12 glass-card hover:bg-card/80 transition-all">
                <Link to="/login">I'm a Clinician</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Camera, title: 'Snap & Scan', desc: 'Take a photo of any skin concern and get an instant AI-powered assessment in seconds.' },
              { icon: Brain, title: 'Smart Analysis', desc: 'Our AI identifies potential conditions with clinical-grade accuracy and clear explanations.' },
              { icon: Stethoscope, title: 'Expert Connect', desc: 'Find and book appointments with verified dermatologists near you.' },
              { icon: ShieldCheck, title: 'Private & Secure', desc: 'Your health data is encrypted and protected with medical-grade security standards.' },
            ].map((f, i) => (
              <motion.div key={f.title} variants={fadeInUp} className="glass-card rounded-xl p-7 hover:shadow-md transition-shadow duration-200">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-5">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Two Portals */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 gradient-surface">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
            <motion.h2 variants={fadeInUp} className="text-3xl font-bold text-foreground mb-3 tracking-tight">Built for patients & professionals</motion.h2>
            <motion.p variants={fadeInUp} className="text-muted-foreground max-w-xl mx-auto">Whether you're checking a mole at home or analyzing dermoscopy images in clinic, DermaScan has you covered.</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-2 gap-6">
            <motion.div variants={fadeInUp} className="clinical-card p-8">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-5">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-3">For Patients</h3>
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                Get peace of mind with AI skin analysis. Chat with our assistant, find nearby specialists, and book appointments seamlessly.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Camera className="h-4 w-4 text-primary" /> Photo capture & AI analysis</li>
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Find nearby dermatologists</li>
                <li className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Easy appointment booking</li>
              </ul>
            </motion.div>
            <motion.div variants={fadeInUp} className="clinical-card p-8">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-5">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-3">For Clinicians</h3>
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                Professional dermoscopy analysis with AI segmentation, feature extraction, and comprehensive patient case management.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> AI classification & segmentation</li>
                <li className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Patient history tracking</li>
                <li className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Appointment management</li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={logo} alt="DermaScan" className="w-6 h-6" />
            <span>© {new Date().getFullYear()} DermaScan</span>
          </div>
          <p>AI-powered skin health analysis</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
