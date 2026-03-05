import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  MessageSquare, 
  ImageIcon, 
  Send, 
  User, 
  Bot, 
  MoreVertical, 
  Trash2, 
  PanelLeftClose, 
  PanelLeftOpen,
  Sparkles,
  Settings,
  X,
  ExternalLink,
  Download
} from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from './lib/utils';
import { Message, ChatSession } from './types';
import { generateTextResponse, generateImageResponse } from './services/ai';

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    responseDetail: 'high',
    theme: 'dark'
  });

  const themes = {
    dark: {
      name: 'Karanlık',
      bg: 'bg-[#212121]',
      sidebar: 'bg-[#171717]',
      card: 'bg-[#2f2f2f]',
      accent: 'text-indigo-400',
      button: 'bg-indigo-600',
      border: 'border-white/10'
    },
    midnight: {
      name: 'Gece Yarısı',
      bg: 'bg-[#0a0a0f]',
      sidebar: 'bg-[#050508]',
      card: 'bg-[#1a1a2e]',
      accent: 'text-blue-400',
      button: 'bg-blue-600',
      border: 'border-blue-500/20'
    },
    emerald: {
      name: 'Zümrüt',
      bg: 'bg-[#061a14]',
      sidebar: 'bg-[#030d0a]',
      card: 'bg-[#0a2e24]',
      accent: 'text-emerald-400',
      button: 'bg-emerald-600',
      border: 'border-emerald-500/20'
    },
    purple: {
      name: 'Mor Düş',
      bg: 'bg-[#1a0b2e]',
      sidebar: 'bg-[#0d0517]',
      card: 'bg-[#2d124d]',
      accent: 'text-purple-400',
      button: 'bg-purple-600',
      border: 'border-purple-500/20'
    }
  };

  const currentTheme = themes[settings.theme as keyof typeof themes] || themes.dark;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  useEffect(() => {
    const savedSessions = localStorage.getItem('areagpt_sessions');
    const savedSettings = localStorage.getItem('areagpt_settings');
    
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
        } else {
          createNewChat();
        }
      } catch (e) {
        console.error("LocalStorage Parse Hatası:", e);
        createNewChat();
      }
    } else {
      createNewChat();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('areagpt_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('areagpt_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'Yeni Sohbet',
      messages: [],
      updatedAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (currentSessionId === id) {
        setCurrentSessionId(filtered[0]?.id || null);
      }
      return filtered;
    });
  };

  const handleSend = async (type: 'text' | 'image' = 'text') => {
    const currentInput = input.trim();
    if (!currentInput || isLoading) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: currentInput.slice(0, 30),
        messages: [],
        updatedAt: Date.now(),
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      sessionId = newSession.id;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentInput,
      type: 'text',
      timestamp: Date.now(),
    };

    // Mesajı hemen UI'a ekle ve input'u temizle
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          messages: [...s.messages, userMessage],
          title: s.messages.length === 0 ? currentInput.slice(0, 30) : s.title,
          updatedAt: Date.now(),
        };
      }
      return s;
    }));
    
    setInput('');
    setIsLoading(true);

    try {
      let assistantMessage: Message;
      // Güncel geçmişi al (userMessage dahil değil, çünkü generateTextResponse onu ekliyor)
      const sessionToUpdate = sessions.find(s => s.id === sessionId) || { messages: [] };
      const history = sessionToUpdate.messages;

      if (type === 'image' || currentInput.toLowerCase().startsWith('/image') || currentInput.toLowerCase().startsWith('/resim')) {
        let prompt = currentInput;
        if (currentInput.toLowerCase().startsWith('/image')) prompt = currentInput.slice(7).trim();
        else if (currentInput.toLowerCase().startsWith('/resim')) prompt = currentInput.slice(7).trim();
        
        if (!prompt) {
          throw new Error("Lütfen bir görsel açıklaması yazın.");
        }

        const imageUrl = await generateImageResponse(prompt);
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Şunun için görsel oluşturuldu: ${prompt}`,
          type: 'image',
          imageUrl,
          timestamp: Date.now(),
        };
      } else {
        const result = await generateTextResponse(currentInput, history);
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.text,
          type: 'text',
          sources: result.sources,
          timestamp: Date.now(),
        };
      }

      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return { ...s, messages: [...s.messages, assistantMessage] };
        }
        return s;
      }));
    } catch (error: any) {
      console.error("Chat Hatası:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `**Hata:** ${error.message || "Bir sorun oluştu. Lütfen tekrar deneyin."}`,
        type: 'text',
        timestamp: Date.now(),
      };
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return { ...s, messages: [...s.messages, errorMessage] };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex h-screen text-white font-sans overflow-hidden transition-colors duration-500", currentTheme.bg)}>
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 0 }}
        className={cn(
          "flex flex-col transition-all duration-300 ease-in-out border-r border-white/5",
          currentTheme.sidebar,
          !isSidebarOpen && "invisible"
        )}
      >
        <div className="p-3 flex flex-col h-full">
          <button
            onClick={createNewChat}
            className={cn("flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors text-sm mb-4", currentTheme.border, "hover:bg-white/5")}
          >
            <Plus size={16} />
            <span>Yeni Sohbet</span>
          </button>

          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
            {sessions.map(session => (
              <div
                key={session.id}
                onClick={() => setCurrentSessionId(session.id)}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm",
                  currentSessionId === session.id ? currentTheme.card : "hover:bg-white/5"
                )}
              >
                <MessageSquare size={16} className="shrink-0 opacity-60" />
                <span className="flex-1 truncate">{session.title}</span>
                <button
                  onClick={(e) => deleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-white/10 space-y-1">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors text-sm"
            >
              <Settings size={18} className="opacity-60" />
              <span>Ayarlar</span>
            </button>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", currentTheme.button)}>
                <User size={18} />
              </div>
              <span className="text-sm font-medium">Kullanıcı Hesabı</span>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className={cn("h-14 flex items-center px-4 border-b border-white/5 backdrop-blur-md sticky top-0 z-10", currentTheme.bg, "bg-opacity-80")}>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors mr-4"
          >
            {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Sparkles className={currentTheme.accent} size={20} />
            <span>AreaGPT</span>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl mx-auto px-4 py-8">
            {!currentSession || currentSession.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center mt-20 text-center">
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6", currentTheme.card)}>
                  <Sparkles className={currentTheme.accent} size={32} />
                </div>
                <h1 className="text-3xl font-bold mb-2">Bugün size nasıl yardımcı olabilirim?</h1>
                <p className="text-white/50 max-w-md">
                  AreaGPT sizin elit yapay zeka arkadaşınızdır. Soru sorun, problem çözün veya çarpıcı görseller oluşturun.
                </p>
                <div className="grid grid-cols-2 gap-3 mt-12 w-full max-w-xl">
                  {[
                    "Fütüristik bir şehir oluştur",
                    "Kuantum fiziğini açıkla",
                    "Bilim kurgu hikayesi yaz",
                    "React bileşeni kodla"
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        if (!currentSession) createNewChat();
                        setInput(suggestion);
                      }}
                      className={cn("p-4 rounded-xl border hover:bg-white/5 text-left text-sm transition-all", currentTheme.border)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {currentSession.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-4 group",
                      msg.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1", currentTheme.button)}>
                        <Bot size={18} />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3",
                      msg.role === 'user' 
                        ? cn(currentTheme.card, "text-white") 
                        : "bg-transparent text-white/90"
                    )}>
                      {msg.type === 'image' ? (
                        <div className="space-y-3">
                          <img 
                            src={msg.imageUrl} 
                            alt="Generated" 
                            className={cn("rounded-lg w-full max-w-md shadow-2xl border", currentTheme.border)}
                            referrerPolicy="no-referrer"
                          />
                          <p className="text-xs text-white/40 italic">{msg.content}</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="prose prose-invert prose-sm max-w-none">
                            <Markdown>{msg.content}</Markdown>
                          </div>
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="pt-3 border-t border-white/5 mt-3">
                              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Kaynaklar</p>
                              <div className="flex flex-wrap gap-2">
                                {msg.sources.map((source, idx) => (
                                  <a
                                    key={idx}
                                    href={source.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/10 text-[10px] transition-colors border", currentTheme.border, currentTheme.accent.replace('text-', 'text-'))}
                                  >
                                    <ExternalLink size={10} />
                                    <span className="truncate max-w-[150px]">{source.title}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 mt-1">
                        <User size={18} />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-4 animate-pulse">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", currentTheme.button, "opacity-50")}>
                      <Bot size={18} className="opacity-50" />
                    </div>
                    <div className={cn("h-10 w-24 rounded-2xl", currentTheme.card)} />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className={cn("p-4 bg-gradient-to-t via-transparent to-transparent", currentTheme.bg.replace('bg-', 'from-'))}>
          <div className="max-w-3xl mx-auto relative">
            <div className={cn("relative flex items-end gap-2 rounded-2xl p-2 focus-within:ring-1 ring-white/20 transition-all", currentTheme.card)}>
              <button 
                onClick={() => handleSend('image')}
                className="p-2 hover:bg-white/5 rounded-xl text-white/60 hover:text-white transition-all"
                title="Görsel Oluştur"
              >
                <ImageIcon size={20} />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="AreaGPT'ye mesaj gönder..."
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 px-2 text-sm max-h-40 min-h-[44px] custom-scrollbar"
                rows={1}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  input.trim() && !isLoading 
                    ? "bg-white text-black hover:bg-white/90" 
                    : "bg-white/10 text-white/20 cursor-not-allowed"
                )}
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-[10px] text-center mt-2 text-white/30">
              AreaGPT hata yapabilir. Önemli bilgileri kontrol edin.
            </p>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#2f2f2f] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-white/10"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Settings size={20} className="text-indigo-400" />
                    Ayarlar
                  </h2>
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-white/60 block mb-2">Cevap Detayı</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['low', 'medium', 'high'].map((level) => (
                        <button
                          key={level}
                          onClick={() => setSettings({ ...settings, responseDetail: level })}
                          className={cn(
                            "py-2 rounded-lg text-xs font-medium border transition-all",
                            settings.responseDetail === level
                              ? "bg-indigo-600 border-indigo-500 text-white"
                              : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                          )}
                        >
                          {level === 'low' ? 'Kısa' : level === 'medium' ? 'Orta' : 'Detaylı'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white/60 block mb-2">Tema</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(themes).map(([key, theme]) => (
                        <button
                          key={key}
                          onClick={() => setSettings({ ...settings, theme: key })}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                            settings.theme === key
                              ? "bg-indigo-600 border-indigo-500 text-white"
                              : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                          )}
                        >
                          <div className={cn("w-3 h-3 rounded-full", theme.bg)} />
                          {theme.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white/60 block mb-2">Masaüstünde Çalıştır</label>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white/70 space-y-2">
                      <p className="flex items-center gap-2 text-indigo-400 font-semibold">
                        <Download size={14} />
                        Yerel Kurulum Rehberi
                      </p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Projeyi ZIP olarak indirin.</li>
                        <li>Bilgisayarınıza <b>Node.js</b> kurun.</li>
                        <li>Klasördeki <b>run.bat</b> dosyasına çift tıklayın.</li>
                      </ol>
                      <p className="text-[10px] opacity-50 italic">Bu işlem uygulamayı bilgisayarınızda güvenle başlatacaktır.</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white/60 block mb-2">Veri Yönetimi</label>
                    <button
                      onClick={() => {
                        if (confirm("Tüm sohbet geçmişini silmek istediğinize emin misiniz?")) {
                          localStorage.removeItem('areagpt_sessions');
                          setSessions([]);
                          createNewChat();
                          setIsSettingsOpen(false);
                        }
                      }}
                      className="w-full py-2 rounded-lg text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      Sohbet Geçmişini Temizle
                    </button>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <p className="text-[10px] text-white/40">
                      AreaGPT Sürüm 1.0.0 - Gemini 3.1 Pro ile güçlendirilmiştir.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
