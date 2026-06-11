'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Leaf, Mic, MicOff, Volume2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useStore } from '@/store/useStore';

export default function CoachModal({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<{role: 'user' | 'coach', text: string}[]>([
    { role: 'coach', text: 'Hi! I am your AI Carbon Coach. What are you planning to do today? I can help you find lower-impact alternatives.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  
  const addConsequence = useStore(state => state.addConsequence);
  const updateHealthScore = useStore(state => state.updateHealthScore);
  const { eli10Mode } = useStore(state => state.preferences);

  // Speech Recognition setup
  const recognitionRef = useRef<any>(null);
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const latestCoachMessage = [...messages].reverse().find((message) => message.role === 'coach')?.text || '';

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: messages, eli10Mode })
      });
      const data = await res.json();
      
      if (data.response) {
        const { choice, impact, equivalent, alternative, suggestion, impactReductionPercentage } = data.response;
        
        addConsequence({
          choice,
          impact,
          equivalent: Array.isArray(equivalent) ? equivalent : [equivalent],
          alternative,
          impactReductionPercentage
        });

        if (impactReductionPercentage > 0) updateHealthScore(2);

        setMessages(prev => [...prev, { role: 'coach', text: suggestion }]);
        
        // Auto Text-to-Speech the response
        speakText(suggestion);
        
      } else {
        throw new Error("Invalid response");
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'coach', text: 'Sorry, I am having trouble connecting right now.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex justify-end z-50 p-4" aria-modal="true" role="dialog" aria-labelledby="coach-title">
      <motion.div 
        initial={shouldReduceMotion ? false : { opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 50, scale: 0.9 }}
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden h-[80vh] mt-auto border border-slate-200 dark:border-slate-800"
      >
        <div className="bg-green-500 text-white p-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Leaf className="w-5 h-5" aria-hidden="true" />
            <h3 id="coach-title" className="font-bold text-lg">AI Carbon Coach</h3>
          </div>
          <div className="flex items-center space-x-2">
            {isSpeaking && <Volume2 className="w-5 h-5 animate-pulse" aria-label="Speaking" />}
            <button onClick={onClose} className="p-1 hover:bg-green-600 rounded" aria-label="Close modal">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {isLoading ? 'Loading AI response' : latestCoachMessage}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-live="polite" aria-relevant="additions text">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 rounded-tr-none' : 'bg-green-50 dark:bg-green-900/20 text-slate-800 dark:text-slate-200 rounded-tl-none border border-green-100 dark:border-green-800'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-2xl rounded-tl-none flex space-x-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center space-x-2">
            <button 
              onClick={toggleListening}
              className={`p-3 rounded-xl transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
              aria-label={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="E.g., I'm taking a cab to college..."
              className="flex-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-green-500 text-slate-800 dark:text-white"
              aria-label="Message input"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-3 bg-green-500 text-white rounded-xl disabled:opacity-50 hover:bg-green-600 transition-colors"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
