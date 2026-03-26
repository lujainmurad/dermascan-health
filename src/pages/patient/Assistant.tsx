import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Send, Camera, Upload, Loader2, MapPin, Calendar, ScanSearch, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import AppLayout from '@/components/layouts/AppLayout';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'image' | 'action';
  imageUrl?: string;
  actions?: { label: string; to: string; icon: any }[];
}

const PatientAssistant = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi${profile?.full_name ? ` ${profile.full_name}` : ''}! 👋 I'm your DermaScan assistant. I can help you:\n\n- **Analyze a skin concern** — just upload or capture an image\n- **Find a specialist** near you\n- **Book an appointment** with a dermatologist\n\nHow can I help you today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const addMessage = (msg: Omit<ChatMessage, 'id'>) => {
    setMessages(prev => [...prev, { ...msg, id: Date.now().toString() }]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const analyzeImage = async (file: File) => {
    if (!BACKEND_URL) {
      addMessage({ role: 'assistant', content: "I'd love to analyze that for you, but the analysis backend isn't connected right now. Please try again later or visit the **Check a Spot** page." });
      return;
    }

    setIsTyping(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch(`${BACKEND_URL}/analyze/patient`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Analysis failed');
      const data = await response.json();

      // Save case
      if (user) {
        await supabase.from('cases').insert({
          patient_id: user.id,
          prediction_label: data.risk_level,
          confidence: data.confidence,
          recommendation: data.recommendation,
          status: data.risk_level?.toLowerCase().includes('high') ? 'high_risk' : 'low_risk',
        });
      }

      const isHighRisk = data.risk_level?.toLowerCase().includes('high');
      let responseText = `I've analyzed your image. Here's what I found:\n\n**Risk Level:** ${data.risk_level}\n**Confidence:** ${(data.confidence * 100).toFixed(1)}%\n\n${data.recommendation}`;

      if (isHighRisk) {
        responseText += '\n\nI recommend seeing a dermatologist. Would you like me to help you find one nearby?';
      } else {
        responseText += '\n\nThis looks reassuring! Keep monitoring any changes and don\'t hesitate to check again if you notice anything different.';
      }

      addMessage({
        role: 'assistant',
        content: responseText,
        type: 'action',
        actions: isHighRisk ? [
          { label: 'Find a Specialist', to: '/patient/find-specialist', icon: MapPin },
          { label: 'Book Appointment', to: '/patient/book-appointment', icon: Calendar },
        ] : [
          { label: 'Check Another Spot', to: '/patient/analyze', icon: ScanSearch },
        ],
      });
    } catch (err: any) {
      addMessage({ role: 'assistant', content: "I'm sorry, I had trouble analyzing that image. Please try again or visit the **Check a Spot** page for a direct upload." });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !image) return;

    if (image && imagePreview) {
      addMessage({ role: 'user', content: 'I\'d like you to check this spot for me.', type: 'image', imageUrl: imagePreview });
      const fileToAnalyze = image;
      setImage(null);
      setImagePreview(null);
      setInput('');
      await analyzeImage(fileToAnalyze);
      return;
    }

    const text = input.trim();
    setInput('');
    addMessage({ role: 'user', content: text });

    setIsTyping(true);
    await new Promise(r => setTimeout(r, 800));

    const lower = text.toLowerCase();
    if (lower.includes('specialist') || lower.includes('doctor') || lower.includes('dermatologist') || lower.includes('find')) {
      addMessage({
        role: 'assistant',
        content: "I can help you find a specialist! Let me point you to our specialist finder where you can see dermatologists near you with their availability.",
        type: 'action',
        actions: [{ label: 'Find Specialist', to: '/patient/find-specialist', icon: MapPin }],
      });
    } else if (lower.includes('appointment') || lower.includes('book') || lower.includes('schedule')) {
      addMessage({
        role: 'assistant',
        content: "Of course! Let's get you booked with a dermatologist. You can choose from our verified specialists and pick a time that works for you.",
        type: 'action',
        actions: [{ label: 'Book Appointment', to: '/patient/book-appointment', icon: Calendar }],
      });
    } else if (lower.includes('scan') || lower.includes('check') || lower.includes('analyze') || lower.includes('photo') || lower.includes('image') || lower.includes('spot') || lower.includes('mole')) {
      addMessage({
        role: 'assistant',
        content: "I'd be happy to help you check a skin concern! You can either upload an image right here in our chat, or use the dedicated scan page for a more detailed view. Just attach a clear, well-lit photo of the area you're concerned about.",
        type: 'action',
        actions: [{ label: 'Open Scanner', to: '/patient/analyze', icon: ScanSearch }],
      });
    } else {
      addMessage({
        role: 'assistant',
        content: "I'm here to help with your skin health! Here's what I can do:\n\n- 📸 **Analyze a photo** of a skin concern\n- 🔍 **Find specialists** near you\n- 📅 **Book an appointment** with a dermatologist\n\nTry uploading a photo or ask me about any of these options!",
      });
    }
    setIsTyping(false);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">AI Assistant</h1>
          <p className="text-sm text-muted-foreground">Chat with DermaScan about your skin health concerns</p>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-2">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-secondary text-secondary-foreground rounded-bl-md'
                  }`}
                >
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="Uploaded" className="rounded-xl mb-2 max-h-48 object-contain" />
                  )}
                  <div className="text-sm leading-relaxed prose prose-sm max-w-none [&_p]:mb-1 [&_strong]:font-bold">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.actions.map((action) => (
                        <Button
                          key={action.to}
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(action.to)}
                          className="bg-card/80 text-foreground border-border hover:bg-card"
                        >
                          <action.icon className="h-3.5 w-3.5 mr-1.5" />
                          {action.label}
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Image preview */}
        {imagePreview && (
          <div className="mb-2 flex items-center gap-2 p-2 bg-muted rounded-xl">
            <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded-lg" />
            <span className="text-xs text-muted-foreground flex-1">Image ready to send</span>
            <Button variant="ghost" size="sm" onClick={() => { setImage(null); setImagePreview(null); }}>Remove</Button>
          </div>
        )}

        {/* Input bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Button variant="ghost" size="icon" onClick={() => cameraInputRef.current?.click()} className="flex-shrink-0 text-muted-foreground hover:text-primary">
            <Camera className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 text-muted-foreground hover:text-primary">
            <Upload className="h-5 w-5" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your skin health..."
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isTyping || (!input.trim() && !image)} className="flex-shrink-0 gradient-primary text-primary-foreground">
            <Send className="h-4 w-4" />
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
        </div>
      </div>
    </AppLayout>
  );
};

export default PatientAssistant;
