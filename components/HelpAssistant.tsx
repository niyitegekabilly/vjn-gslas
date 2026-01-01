
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageCircle, X, Send, User, Bot, Loader2, Sparkles, HelpCircle, Mic, MicOff, Power, GripHorizontal, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LABELS, HELP_CONTENT } from '../constants';
import { useLocation } from 'react-router-dom';
import { GSLAGroup } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface HelpAssistantProps {
  lang: 'en' | 'rw';
  activeGroupId: string;
  groups: GSLAGroup[];
  setShowHelpAssistant?: (show: boolean) => void;
}

export const HelpAssistant: React.FC<HelpAssistantProps> = ({ lang, activeGroupId, groups, setShowHelpAssistant }) => {
  const { user } = useAuth();
  const labels = LABELS[lang];
  const location = useLocation();
  const group = groups.find(g => g.id === activeGroupId);

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'welcome', 
      sender: 'bot', 
      text: lang === 'en' 
        ? "Hello! I'm your VJN Assistant. I can help you navigate the system, understand rules, or fix errors. How can I help today?" 
        : "Muraho! Ndi umufasha wawe muri VJN. Nagufasha gusobanukirwa sisitemu cyangwa gukemura ibibazo. Wagira iki?", 
      timestamp: new Date() 
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Drag State
  const [position, setPosition] = useState({ x: window.innerWidth - 350, y: window.innerHeight - 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  
  // Confirmation State
  const [confirmTurnOff, setConfirmTurnOff] = useState(false);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle Window Resize to keep in bounds
  useEffect(() => {
    const handleResize = () => {
       setPosition(prev => ({
         x: Math.min(prev.x, window.innerWidth - 350),
         y: Math.min(prev.y, window.innerHeight - 100)
       }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag from specific handles
    setIsDragging(true);
    setHasMoved(false);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setHasMoved(true);
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Boundaries
        const boundedX = Math.max(0, Math.min(window.innerWidth - 50, newX));
        const boundedY = Math.max(0, Math.min(window.innerHeight - 50, newY));

        setPosition({ x: boundedX, y: boundedY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Context Awareness Effect
  useEffect(() => {
    if (isOpen) {
      let contextMsg = "";
      const path = location.pathname;

      if (path.includes('/loans')) {
        contextMsg = lang === 'en' 
          ? "Do you want to calculate loan interest or apply for a new loan?" 
          : "Ese urashaka kubara inyungu y'inguzanyo cyangwa gusaba nshya?";
      } else if (path.includes('/meeting')) {
        contextMsg = lang === 'en' 
          ? "I can help you understand how to record attendance and transactions in Meeting Mode." 
          : "Nagufasha gusobanukirwa uko bandika ubwitabire n'amafaranga mu Nama.";
      } else if (path.includes('/contributions')) {
        contextMsg = lang === 'en' 
          ? "Do you need help recording a new share deposit?" 
          : "Ese ukeneye ubufasha bwo kwandika imigabane mishya?";
      } else if (path.includes('/reports')) {
        contextMsg = lang === 'en' 
          ? "Looking for a specific report? I can explain what each report shows." 
          : "Urashaka raporo yihariye? Nagusobanurira ibyo buri raporo yerekana.";
      }

      if (contextMsg) {
        setMessages(prev => {
          // Avoid duplicate context messages at the end
          const lastMsg = prev[prev.length - 1];
          if (lastMsg.text !== contextMsg) {
             return [...prev, {
               id: `ctx-${Date.now()}`,
               sender: 'bot',
               text: contextMsg,
               timestamp: new Date()
             }];
          }
          return prev;
        });
      }
    }
  }, [isOpen, location.pathname, lang]);

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      // Use simple alert, might be blocked but less critical than confirm
      console.warn("Voice input not supported");
      return;
    }

    if (isListening) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Attempt to set language based on app setting, fallback to browser default
    recognition.lang = lang === 'rw' ? 'rw-RW' : 'en-US'; 
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => (prev ? prev + ' ' : '') + transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Initialize Gemini
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Context Construction
      const context = `
        Current Page: ${location.pathname}
        User Role: ${user?.role || 'Guest'}
        Language: ${lang === 'rw' ? 'Kinyarwanda' : 'English'}
        Current Group: ${group ? group.name : 'None selected'}
        
        KNOWLEDGE BASE:
        ${JSON.stringify(HELP_CONTENT[lang])}
      `;

      const prompt = `
        You are a helpful, polite, and reassuring support assistant for the VJN GSLA Management System. 
        Your users have low-to-medium digital literacy.
        
        RULES:
        1. Answer simply and clearly. Avoid technical jargon.
        2. Use the provided Knowledge Base to answer "How to" questions.
        3. If the user asks about financial data (e.g. "How much money do we have?"), tell them you cannot see their live data but guide them to the correct Report page.
        4. If the user seems frustrated, be extra patient.
        5. Respond in the requested Language (${lang === 'rw' ? 'Kinyarwanda' : 'English'}).
        
        CONTEXT:
        ${context}
        
        USER QUESTION: "${userMsg.text}"
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: response.text || (lang === 'en' ? "I'm sorry, I couldn't process that." : "Mbabarira, sinabashije kubyumva."),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: lang === 'en' 
          ? "I'm having trouble connecting to the brain. Please try again later or check the Help page." 
          : "Hari ikibazo cya tekiniki. Ongera ugerageze cyangwa urebe ahanditse Ubufasha.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Safe click handler that distinguishes drag vs click
  const handleToggle = () => {
    if (!hasMoved) {
      setIsOpen(true);
    }
  };

  return (
    <div 
      className="fixed z-50 print:hidden transition-all duration-75 ease-linear"
      style={{ 
        left: isOpen ? undefined : position.x, // Use fixed positioning when closed for dragging bubble
        top: isOpen ? undefined : position.y,
        bottom: isOpen ? '1.5rem' : undefined, // Reset to bottom/right when open (or make draggable window too)
        right: isOpen ? '1.5rem' : undefined
      }}
    >
      {!isOpen && (
        <div onMouseDown={handleMouseDown} style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
          <button 
            onClick={handleToggle}
            className="bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2 select-none"
          >
            <Sparkles size={24} className="text-yellow-400" />
            <span className="font-bold pr-1">{labels.helpAssistant}</span>
          </button>
        </div>
      )}

      {isOpen && (
        <div className="bg-white w-80 sm:w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col border border-gray-200 animate-in slide-in-from-bottom-5 duration-300">
          {/* Header - Now Draggable Too */}
          <div 
            className="bg-slate-900 text-white p-4 rounded-t-2xl flex justify-between items-center cursor-grab active:cursor-grabbing"
            onMouseDown={e => {
                // If implementing window drag, we would need logic here. 
                // For now, let's keep the window fixed at bottom-right when open to simplify UX,
                // or users can drag the bubble to preferred spot then open it? 
                // Let's assume fixed position when open is standard for chatbots.
            }}
          >
            <div className="flex items-center gap-3">
              <div className="bg-slate-700 p-2 rounded-full">
                <Bot size={20} className="text-blue-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm">VJN Assistant</h3>
                <p className="text-xs text-slate-400">AI Powered Guide</p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {setShowHelpAssistant && (
                confirmTurnOff ? (
                    <div className="flex items-center bg-slate-800 rounded-full px-2 py-0.5 animate-in fade-in slide-in-from-right-2">
                        <span className="text-[10px] text-slate-300 mr-2 whitespace-nowrap">Sure?</span>
                        <button onClick={() => setShowHelpAssistant(false)} className="p-1 text-green-400 hover:bg-white/10 rounded-full" title="Confirm"><Check size={14}/></button>
                        <button onClick={() => setConfirmTurnOff(false)} className="p-1 text-red-400 hover:bg-white/10 rounded-full" title="Cancel"><X size={14}/></button>
                    </div>
                ) : (
                    <button 
                      onClick={() => setConfirmTurnOff(true)}
                      className="p-1 text-slate-400 hover:text-red-400 rounded-full hover:bg-white/10 transition-colors"
                      title="Turn Off Assistant"
                    >
                      <Power size={18} />
                    </button>
                )
              )}
              <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-3 rounded-xl rounded-bl-none shadow-sm flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-blue-600" />
                  <span className="text-xs text-gray-400">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-gray-100 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={handleVoiceInput}
                className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                title="Speak"
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : labels.askMeAnything}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isTyping}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
