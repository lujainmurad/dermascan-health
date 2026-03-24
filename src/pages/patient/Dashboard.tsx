import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Camera, Calendar, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const PatientDashboard = () => {
  const { profile } = useAuth();

  const cards = [
    { icon: Camera, title: 'Analyze a Lesion', desc: 'Upload or capture an image for AI analysis', to: '/patient/analyze', color: 'bg-primary/10 text-primary' },
    { icon: Calendar, title: 'My Appointments', desc: 'View and manage your appointments', to: '/patient/appointments', color: 'bg-accent text-accent-foreground' },
    { icon: Search, title: 'Find a Specialist', desc: 'Search for verified dermatologists', to: '/patient/find-specialist', color: 'bg-success/10 text-success' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">
            Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}
          </h1>
          <p className="text-muted-foreground mb-8">What would you like to do today?</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <motion.div key={card.to} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
              <Link to={card.to} className="medical-card p-6 block hover:shadow-lg transition-shadow group">
                <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center mb-4`}>
                  <card.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{card.title}</h3>
                <p className="text-sm text-muted-foreground">{card.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
