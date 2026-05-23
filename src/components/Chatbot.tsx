import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '../lib/api';
import { ChatAction, ChatMessage } from '../types';

type ChatResponse = {
  reply: string;
  action: ChatAction | null;
};

const focusSuggestions = [
  'WATER VOLUME PROTOCOL',
  'SLEEP CYCLE OPTIMIZATION',
  'HYPERTROPHY NUTRITION',
  'BMI PARAMETERS',
  'STRESS MITIGATION',
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'bot',
      content:
        'COMM LINK ESTABLISHED. CAREFLOW AI ONLINE. AWAITING INQUIRY REGARDING TELEMETRY, PROTOCOLS, OR GENERAL DIRECTIVES.',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async (messageText: string) => {
    const nextMessage = messageText.trim();
    if (!nextMessage || isLoading) {
      return;
    }

    const userMessage: ChatMessage = { role: 'user', content: nextMessage };
    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setInput('');
    setError('');
    setIsLoading(true);

    try {
      const response = await apiRequest<ChatResponse>('/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: nextMessage,
          history: nextHistory.slice(-10),
        }),
      });

      if (response.action?.type === 'open_url' && response.action.url) {
        window.open(response.action.url, '_blank', 'noopener,noreferrer');
      }

      setMessages((previous) => [...previous, { role: 'bot', content: response.reply }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'UPLINK FAILED.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    await sendMessage(input);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 btn-filled shadow-2xl z-50 text-[11px]"
      >
        [ COMM LINK ]
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-4 sm:right-8 w-[calc(100vw-2rem)] sm:w-[450px] h-[600px] max-h-[85vh] bg-[#0a0a0a] border border-[#3a3a3f] flex flex-col z-50 shadow-2xl"
          >
            <div className="p-4 border-b border-[#3a3a3f] flex items-center justify-between bg-black">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest">CAREFLOW AI</h3>
                <p className="text-[9px] text-[#5a5a5f] uppercase tracking-widest mt-1">SECURE CHANNEL</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-[#5a5a5f] hover:text-white text-[10px] font-bold uppercase tracking-wider">
                [ CLOSE ]
              </button>
            </div>

            <div className="p-3 border-b border-[#3a3a3f] flex gap-2 overflow-x-auto no-scrollbar bg-black">
              {focusSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  className="px-3 py-1.5 border border-[#3a3a3f] text-[9px] font-bold uppercase tracking-wider text-[#5a5a5f] hover:text-white hover:border-white whitespace-nowrap transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-[#0a0a0a]">
              {messages.map((msg, index) => (
                <div
                  key={`${msg.role}-${index}`}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[9px] font-bold text-[#5a5a5f] uppercase tracking-widest mb-1">
                    {msg.role === 'user' ? 'CMD' : 'AI'}
                  </span>
                  <div
                    className={`p-3 text-sm leading-relaxed max-w-[85%] uppercase font-bold tracking-wide ${
                      msg.role === 'user'
                        ? 'bg-white text-black'
                        : 'border border-[#3a3a3f] text-[#f0f0fa]'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex flex-col items-start">
                  <span className="text-[9px] font-bold text-[#5a5a5f] uppercase tracking-widest mb-1">AI</span>
                  <div className="p-3 border border-[#3a3a3f] text-[#5a5a5f] text-sm uppercase font-bold tracking-wide animate-pulse">
                    PROCESSING...
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-500 border-t border-[#3a3a3f] bg-black">
                ERR: {error}
              </div>
            )}

            <form onSubmit={handleSend} className="p-4 border-t border-[#3a3a3f] bg-black flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="ENTER INQUIRY..."
                className="w-full py-3 bg-transparent border-b border-[#3a3a3f] rounded-none focus:border-white text-xs uppercase placeholder:text-[#3a3a3f]"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="btn-ghost-sm border-white disabled:border-[#3a3a3f] disabled:text-[#5a5a5f]"
              >
                TX
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
