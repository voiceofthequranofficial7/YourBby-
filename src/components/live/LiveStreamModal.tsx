import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { X, Heart, Send, Eye, Radio, MessageCircle } from 'lucide-react';

export const LiveStreamModal: React.FC = () => {
  const {
    liveStream,
    isLiveModalOpen,
    setIsLiveModalOpen,
    sendLiveChatMessage
  } = useApp();

  const [chatInput, setChatInput] = useState('');
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; left: number }[]>([]);

  if (!isLiveModalOpen || !liveStream) return null;

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    await sendLiveChatMessage(chatInput.trim());
    setChatInput('');
  };

  const handleSendHeart = () => {
    const id = Date.now() + Math.random();
    const left = Math.floor(Math.random() * 60) + 20; // 20% to 80%
    setFloatingHearts((prev) => [...prev, { id, left }]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-md h-[90vh] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
        {/* Live Video Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1000&auto=format&fit=crop&q=80"
            alt="Live Stream Host"
            className="w-full h-full object-cover filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/60" />
        </div>

        {/* Floating Heart Particles */}
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
          {floatingHearts.map((heart) => (
            <div
              key={heart.id}
              className="absolute bottom-16 text-2xl animate-in fade-in slide-in-from-bottom duration-1000 transition-all"
              style={{ left: `${heart.left}%`, transform: 'translateY(-180px)' }}
            >
              ❤️
            </div>
          ))}
        </div>

        {/* Top Bar: Host, Viewer Count, Close */}
        <div className="relative z-10 p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <img
              src={liveStream.host.avatar}
              alt={liveStream.host.displayName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-500"
            />
            <div>
              <p className="text-xs font-bold leading-tight">{liveStream.host.displayName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold uppercase animate-pulse">
                  <Radio className="w-2.5 h-2.5" /> LIVE
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 text-[10px] text-white/90">
                  <Eye className="w-2.5 h-2.5" /> {liveStream.viewersCount}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsLiveModalOpen(false)}
            className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Title Banner */}
        <div className="relative z-10 px-4 py-1">
          <p className="text-xs font-semibold text-white/90 bg-black/30 px-3 py-1.5 rounded-xl backdrop-blur-xs max-w-xs">
            {liveStream.title}
          </p>
        </div>

        {/* Bottom Chat stream & Controls */}
        <div className="relative z-10 p-4 space-y-3">
          {/* Messages Stream */}
          <div className="max-h-48 overflow-y-auto space-y-1.5 no-scrollbar text-xs">
            {liveStream.chatMessages.map((msg) => (
              <div key={msg.id} className="bg-black/40 backdrop-blur-xs px-3 py-1.5 rounded-xl text-white inline-block max-w-[85%]">
                <span className="font-bold text-rose-400 mr-1.5">{msg.user.displayName}:</span>
                <span>{msg.text}</span>
              </div>
            ))}
          </div>

          {/* Chat Form + Heart Trigger */}
          <div className="flex items-center gap-2">
            <form onSubmit={handleSendChat} className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Chat in live stream..."
                className="w-full px-4 py-2 bg-black/50 text-white placeholder:text-white/50 text-xs rounded-full border border-white/20 focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white rounded-full"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <button
              onClick={handleSendHeart}
              className="p-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-lg active:scale-125 transition-transform shrink-0"
              title="Send Heart"
            >
              <Heart className="w-5 h-5 fill-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
