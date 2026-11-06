import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Search, TrendingUp, Sparkles, Film, Image as ImageIcon, Heart } from 'lucide-react';

export const ExploreView: React.FC = () => {
  const { posts, reels, setActiveTab, setViewingProfileUsername } = useApp();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Photography', 'Tech', 'Music', 'Fashion', 'Reels', 'Bengal Vibes'];

  const exploreItems = [
    {
      id: 'ex_1',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
      title: 'Golden Sunset at Victoria Memorial',
      author: 'Priya Sen',
      likes: '1.4K',
      aspect: 'aspect-square'
    },
    {
      id: 'ex_2',
      type: 'reel',
      url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80',
      title: 'Handloom Streetwear Aesthetic',
      author: 'Priya Sen',
      likes: '12.4K',
      aspect: 'aspect-[9/16]'
    },
    {
      id: 'ex_3',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=600&auto=format&fit=crop&q=80',
      title: 'Historic Trams of Kolkata',
      author: 'Rohan Roy',
      likes: '890',
      aspect: 'aspect-square'
    },
    {
      id: 'ex_4',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      title: 'Synthesizer Midnight Studio',
      author: 'Kabir Verma',
      likes: '3.2K',
      aspect: 'aspect-square'
    },
    {
      id: 'ex_5',
      type: 'reel',
      url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      title: 'Mumbai Indie Tour Preview',
      author: 'Kabir Verma',
      likes: '8.9K',
      aspect: 'aspect-[9/16]'
    },
    {
      id: 'ex_6',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80',
      title: 'Design Sprint Bengaluru',
      author: 'Aarav Sharma',
      likes: '940',
      aspect: 'aspect-square'
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 my-2">
      {/* Search Bar */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by creator name, topic, location or #tag..."
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
        />
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Masonry-style Explore Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {exploreItems.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              if (item.type === 'reel') setActiveTab('reels');
              else setActiveTab('feed');
            }}
            className={`relative group rounded-2xl overflow-hidden cursor-pointer bg-slate-950 ${
              item.type === 'reel' ? 'row-span-2' : ''
            }`}
          >
            <img
              src={item.url}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {item.type === 'reel' && (
              <div className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white">
                <Film className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end text-white">
              <p className="text-xs font-bold truncate">{item.title}</p>
              <div className="flex items-center justify-between text-[11px] text-white/80 mt-1">
                <span>@{item.author}</span>
                <span className="flex items-center gap-1 font-semibold">
                  <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                  {item.likes}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
