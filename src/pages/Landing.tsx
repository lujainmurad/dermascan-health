import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Shield, Stethoscope, ArrowRight, Activity, Lock, Zap } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg clinical-gradient flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">Cl</span>
            </div>
            <span className="font-display font-bold text-lg text-foreground tracking-tight">Claritas</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="text-sm">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild className="text-sm">
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-8 border border-border">
              <Activity className="h-3.5 w-3.5" />
              Clinical-Grade Dermatology AI
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6 leading-[1.1] tracking-tight">
              Precision skin analysis
              <br />
              <span className="text-primary">for better outcomes</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Claritas combines deep learning segmentation with clinical workflow tools 
              to help dermatologists and patients make informed decisions, faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="text-sm px-8 h-12">
                <Link to="/register">Start Using Claritas <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-sm px-8 h-12">
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'AI-Powered Analysis',
                desc: 'Upload dermoscopy images for instant segmentation overlays, feature extraction, and risk assessment.',
              },
              {
                icon: Lock,
                title: 'Secure & Private',
                desc: 'All patient data is encrypted and handled with clinical-grade security standards.',
              },
              {
                icon: Activity,
                title: 'Clinical Workflow',
                desc: 'Manage patient cases, track history, schedule appointments — all in one integrated platform.',
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i }}
                className="clinical-card p-7"
              >
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-5">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Two Portals */}
      <section className="py-20 px-6 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-center text-foreground mb-3 tracking-tight">Two portals, one platform</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Claritas serves both patients seeking peace of mind and clinicians diagnosing conditions.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="clinical-card p-8"
            >
              <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center mb-5">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-3">Patient Portal</h3>
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                Upload photos of skin lesions for instant AI risk assessment. Find verified specialists and book appointments.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-primary" /> Camera capture & image upload</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-primary" /> Instant risk assessment</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-primary" /> Specialist appointment booking</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="clinical-card p-8"
            >
              <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center mb-5">
                <Stethoscope className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-3">Clinician Portal</h3>
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                Upload dermoscopy images for AI segmentation analysis. Manage patient records and clinical workflows.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-primary" /> Dermoscopy image analysis</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-primary" /> Segmentation overlays</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-primary" /> Patient case management</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Claritas. Clinical dermatology intelligence.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
