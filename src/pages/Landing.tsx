import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Shield, Stethoscope, ArrowRight } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="Medical AI technology" className="w-full h-full object-cover opacity-20" width={1920} height={1080} />
          <div className="absolute inset-0 medical-gradient opacity-10" />
        </div>
        <div className="relative container mx-auto px-4 py-24 md:py-36">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
              <Shield className="h-4 w-4" />
              Hospital-Grade AI Diagnostics
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6 leading-tight">
              Early Detection Saves Lives with{' '}
              <span className="text-primary">AI-Powered</span> Skin Analysis
            </h1>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              DermaScan AI provides state-of-the-art skin lesion analysis for patients and clinicians.
              Get instant risk assessments backed by deep learning technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-base px-8">
                <Link to="/register">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8">
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Portals Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center text-foreground mb-4">Two Portals, One Platform</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Whether you're a patient seeking peace of mind or a clinician diagnosing conditions, DermaScan AI has you covered.
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="medical-card p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-5">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-xl text-foreground mb-3">Patient Portal</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Upload photos of skin lesions using your phone camera or gallery. Get instant AI-powered risk assessment
                and connect with verified dermatology specialists if needed.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Camera capture & image upload</li>
                <li>• Instant risk assessment</li>
                <li>• Book specialist appointments</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="medical-card p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-5">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-xl text-foreground mb-3">Clinician Portal</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Upload dermoscopy images for advanced AI analysis with segmentation overlays.
                Manage patient cases, view history, and handle appointments.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Dermoscopy image analysis</li>
                <li>• Segmentation overlay visualization</li>
                <li>• Patient case management</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} DermaScan AI. For clinical and research use.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
