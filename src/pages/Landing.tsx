import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Heart, Camera, Brain, Stethoscope, Shield, ArrowRight, ShieldCheck, Calendar, MapPin, CheckCircle } from 'lucide-react';
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
              Trusted by Clinicians & Patients
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight">
              Skin health screening,{' '}
              <span className="text-gradient">powered by AI</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              DermaScan helps patients check skin concerns with AI analysis and connects them to dermatologists — while giving clinicians professional-grade classification and case management tools.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="text-sm px-8 h-12 gradient-hero text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all font-bold">
                <Link to="/register">Get Started Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-sm px-8 h-12 hover:bg-card/80 transition-all">
                <Link to="/login">Sign In</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
            <motion.h2 variants={fadeInUp} className="text-3xl font-bold text-foreground mb-3 tracking-tight">How it works</motion.h2>
            <motion.p variants={fadeInUp} className="text-muted-foreground max-w-lg mx-auto">Three simple steps — from concern to clarity.</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', icon: Camera, title: 'Capture', desc: 'Take a photo of any skin spot or mole using your phone camera or upload an existing image.' },
              { step: '2', icon: Brain, title: 'Analyze', desc: 'Our AI instantly classifies the lesion and provides a risk assessment with confidence scores.' },
              { step: '3', icon: Stethoscope, title: 'Connect', desc: 'If needed, find and book an appointment with a verified dermatologist near you.' },
            ].map((f) => (
              <motion.div key={f.title} variants={fadeInUp} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 mx-auto">
                  <f.icon className="h-7 w-7 text-primary" />
                </div>
                <div className="text-xs font-bold text-primary mb-2">STEP {f.step}</div>
                <h3 className="font-bold text-foreground text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 gradient-surface">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Camera, title: 'Instant Scan', desc: 'Snap a photo and get AI-powered results in seconds — no waiting rooms.' },
              { icon: Brain, title: 'Clinical AI', desc: 'Classification trained on thousands of dermoscopy images with feature extraction.' },
              { icon: MapPin, title: 'Find Doctors', desc: 'Locate and book verified dermatologists near you with real-time availability.' },
              { icon: ShieldCheck, title: 'Secure & Private', desc: 'Medical-grade encryption. Your health data stays yours.' },
            ].map((f) => (
              <motion.div key={f.title} variants={fadeInUp} className="clinical-card p-7 hover:shadow-md transition-shadow duration-200">
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
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
            <motion.h2 variants={fadeInUp} className="text-3xl font-bold text-foreground mb-3 tracking-tight">Built for everyone</motion.h2>
            <motion.p variants={fadeInUp} className="text-muted-foreground max-w-xl mx-auto">Whether you're a patient checking a mole or a clinician managing cases.</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-2 gap-6">
            <motion.div variants={fadeInUp} className="clinical-card p-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-3">For Patients</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" /> Quick AI skin check from your phone</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" /> Chat with AI assistant about your concerns</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" /> Find and book nearby dermatologists</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" /> Track your appointments and history</li>
              </ul>
            </motion.div>
            <motion.div variants={fadeInUp} className="clinical-card p-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-3">For Clinicians</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" /> AI-powered dermoscopy classification</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" /> Feature extraction and segmentation overlays</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" /> Complete patient case management</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" /> Set availability and manage appointments</li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeInUp} className="text-3xl font-bold text-foreground mb-4 tracking-tight">Ready to get started?</motion.h2>
            <motion.p variants={fadeInUp} className="text-muted-foreground mb-8">Create your free account and check your first skin spot in under a minute.</motion.p>
            <motion.div variants={fadeInUp}>
              <Button asChild size="lg" className="text-sm px-8 h-12 gradient-hero text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all font-bold">
                <Link to="/register">Create Free Account <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
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
          <p>AI-powered skin health screening</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
