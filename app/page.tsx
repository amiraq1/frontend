'use client';

import { useState, useRef, useEffect } from 'react';

// --- Types ---
type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

// --- Main Component ---
export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  // Prevent hydration mismatch by rendering only after mount
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hydration fix
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Call Backend API
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content })
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();

      const aiMsg: Message = {
        role: 'assistant',
        content: data.response || "No response received.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ Error connecting to Nabd Backend. Is it running on port 8000?", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Return null or loader during SSR to avoid mismatch
  if (!isMounted) return null;

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-zinc-800">

      {/* Sidebar (Hidden on mobile for simplicity in this V1) */}
      <aside className="hidden md:flex w-64 flex-col border-r border-[#27272a] bg-[#0c0c0e]">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight text-white glow-text">Nabd / AI</h1>
          <p className="text-xs text-zinc-500 mt-1">Native Engine V2.0</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-2">
          <div className="mb-4">
            <p className="px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">History</p>
            <button className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-[#18181b] rounded-lg transition-colors">
              New Chat
            </button>
          </div>
        </nav>
        <div className="p-4 border-t border-[#27272a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-600"></div>
            <div className="text-sm">
              <p className="font-medium">User</p>
              <p className="text-xs text-zinc-500">Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative glow-bg">

        {/* Header (Mobile) */}
        <header className="md:hidden p-4 border-b border-[#27272a] bg-[#09090b]/80 backdrop-blur">
          <h1 className="font-bold text-center">Nabd AI</h1>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Welcome Empty State */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-pulse-slow">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-zinc-700 flex items-center justify-center shadow-2xl">
                  <span className="text-3xl">⚡</span>
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">How can I help you?</h2>
                  <p className="text-zinc-500">I can analyze code, answer data questions, or help you debug.</p>
                </div>
              </div>
            )}

            {/* Chat Bubbles */}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`
                                        max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 text-sm md:text-base leading-relaxed
                                        ${msg.role === 'user'
                      ? 'bg-[#18181b] text-white border border-[#27272a]'
                      : 'bg-transparent text-zinc-100 pl-0'}
                                    `}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nabd</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[75%] pl-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nabd</span>
                  </div>
                  <div className="flex items-center gap-1 h-6">
                    <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-gradient-to-t from-[#09090b] via-[#09090b] to-transparent">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Nabd..."
                className="w-full bg-[#18181b] border border-[#27272a] text-white rounded-xl px-5 py-4 pr-12 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all shadow-lg placeholder:text-zinc-600"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white text-black rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </form>
            <p className="text-center text-[10px] text-zinc-600 mt-3">
              Nabd AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
