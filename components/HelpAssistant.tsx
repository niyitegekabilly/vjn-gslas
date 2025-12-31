
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageCircle, X, Send, User, Bot, Loader2, Sparkles, HelpCircle } from 'lucide-react';
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
}

export const HelpAssistant: React.FC<HelpAssistantProps> = ({ lang, activeGroupId, groups }) => {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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
      // Note: In a real app, API_KEY should be in process.env
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
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

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden">
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
        >
          <Sparkles size={24} className="text-yellow-400" />
          <span className="font-bold pr-1">{labels.helpAssistant}</span>
        </button>
      )}

      {isOpen && (
        <div className="bg-white w-80 sm:w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col border border-gray-200 animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-slate-900 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-slate-700 p-2 rounded-full">
                <Bot size={20} className="text-blue-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm">VJN Assistant</h3>
                <p className="text-xs text-slate-400">AI Powered Guide</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <X size={20} />
            </button>
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
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={labels.askMeAnything}
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
