import React, { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Header } from './components/navigation/Header.tsx';
import { Sidebar } from './components/navigation/Sidebar.tsx';
import { RightSidebar } from './components/navigation/RightSidebar.tsx';
import { MobileTabBar } from './components/navigation/MobileTabBar.tsx';
import { StoriesBar } from './components/feed/StoriesBar.tsx';
import { NotesBubbleRow } from './components/feed/NotesBubbleRow.tsx';
import { PostCard } from './components/feed/PostCard.tsx';
import { CreatePostModal } from './components/feed/CreatePostModal.tsx';
import { StoryViewerModal } from './components/stories/StoryViewerModal.tsx';
import { ReelsView } from './components/reels/ReelsView.tsx';
import { MessengerView } from './components/messages/MessengerView.tsx';
import { ExploreView } from './components/explore/ExploreView.tsx';
import { CommunitiesView } from './components/communities/CommunitiesView.tsx';
import { EventsView } from './components/events/EventsView.tsx';
import { CreatorDashboardView } from './components/creator/CreatorDashboardView.tsx';
import { AdminDashboardView } from './components/admin/AdminDashboardView.tsx';
import { ProfileView } from './components/profile/ProfileView.tsx';
import { SettingsView } from './components/settings/SettingsView.tsx';
import { LiveStreamModal } from './components/live/LiveStreamModal.tsx';
import { VideoCallModal } from './components/call/VideoCallModal.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';
import {
  Sparkles,
  Image as ImageIcon,
  Radio,
  PlusCircle,
  ChevronDown
} from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    activeTab,
    feedType,
    setFeedType,
    posts,
    currentUser,
    openCreateModal,
    t,
    isAuthModalOpen,
    setIsAuthModalOpen,
    blockedUserIds,
    setViewingProfileUsername,
    setActiveTab
  } = useApp();

  // Infinite Scroll & Pagination state
  const [visiblePostCount, setVisiblePostCount] = useState(4);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  // Filter out blocked users' posts
  const filteredPosts = posts.filter(p => !blockedUserIds.includes(p.author.id));
  const visiblePosts = filteredPosts.slice(0, visiblePostCount);
  const hasMorePosts = visiblePostCount < filteredPosts.length;
  const savedPosts = filteredPosts.filter(p => p.isBookmarked);

  // Reset pagination when feedType changes
  useEffect(() => {
    setVisiblePostCount(4);
  }, [feedType]);

  // IntersectionObserver for smooth infinite scroll
  useEffect(() => {
    if (activeTab !== 'feed' || !hasMorePosts) return;
    const node = loadMoreTriggerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisiblePostCount(prev => Math.min(prev + 4, filteredPosts.length));
        }
      },
      { rootMargin: '240px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeTab, hasMorePosts, filteredPosts.length]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-16 md:pb-0">
      {/* Top Navigation Header: YourBby logo/name, Create, Messages, Notifications, Menu */}
      <Header />

      {/* Main 3-Column Responsive Container */}
      <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 flex-1 flex justify-center">
        {/* Left Column: Desktop Navigation Sidebar */}
        <Sidebar />

        {/* Center Column: Primary Active View */}
        <main className="flex-1 max-w-2xl py-3 sm:py-4 px-1 sm:px-4 min-w-0">
          {activeTab === 'feed' && (
            <div className="space-y-3.5">
              {/* 1. Horizontal Portrait Story Carousel directly below Main Navigation */}
              <StoriesBar />

              {/* 2. Post Composer Card directly below Stories */}
              <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={currentUser?.avatar}
                    alt={currentUser?.displayName || 'Me'}
                    onClick={() => {
                      setViewingProfileUsername(currentUser?.username || null);
                      setActiveTab('profile');
                    }}
                    className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-rose-500/30 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => openCreateModal('post')}
                    className="flex-1 text-left px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-full text-xs sm:text-sm text-slate-500 dark:text-slate-400 transition-colors"
                  >
                    {t('whatsOnYourMind')}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <button
                    type="button"
                    onClick={() => openCreateModal('post')}
                    className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="truncate">Photo / Video</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openCreateModal('story')}
                    className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="truncate">{t('createStory')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openCreateModal('live')}
                    className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Radio className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="truncate">Go Live</span>
                  </button>
                </div>
              </div>

              {/* 3. Feed Filter Tabs: For You | Following | Friends | Latest */}
              <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-x-auto no-scrollbar">
                {[
                  { id: 'for-you', label: t('forYou') },
                  { id: 'following', label: t('following') },
                  { id: 'friends', label: t('friends') },
                  { id: 'latest', label: t('latest') }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFeedType(f.id as any)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      feedType === f.id
                        ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Compact Quick Status Notes Row */}
              <NotesBubbleRow />

              {/* 4. Consistent Feed Post Cards with Infinite Scroll & Pagination */}
              <div className="space-y-4">
                {visiblePosts.length === 0 ? (
                  <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center text-slate-400 space-y-2">
                    <Sparkles className="w-6 h-6 text-rose-500 mx-auto" />
                    <p className="text-xs font-semibold">No posts in this feed filter yet.</p>
                  </div>
                ) : (
                  visiblePosts.map((post) => <PostCard key={post.id} post={post} />)
                )}

                {/* Infinite Scroll Sentinel & Manual Pagination Fallback */}
                {hasMorePosts && (
                  <div ref={loadMoreTriggerRef} className="py-3 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisiblePostCount(prev => prev + 4)}
                      className="px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-rose-500/40 flex items-center gap-1.5 shadow-xs transition-all"
                    >
                      <span>Load More Posts ({filteredPosts.length - visiblePostCount} remaining)</span>
                      <ChevronDown className="w-4 h-4 text-rose-500" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reels' && <ReelsView />}
          {activeTab === 'messages' && <MessengerView />}
          {activeTab === 'explore' && <ExploreView />}
          {activeTab === 'communities' && <CommunitiesView />}
          {activeTab === 'events' && <EventsView />}
          {activeTab === 'creator-dashboard' && <CreatorDashboardView />}
          {activeTab === 'admin-dashboard' && <AdminDashboardView />}
          {activeTab === 'profile' && <ProfileView />}
          {activeTab === 'settings' && <SettingsView />}

          {activeTab === 'saved' && (
            <div className="space-y-4">
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h2 className="font-bold text-base text-slate-900 dark:text-white">Saved Posts</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your private collection of bookmarked media and posts.
                </p>
              </div>
              {savedPosts.length === 0 ? (
                <p className="py-12 text-center text-xs text-slate-400">No saved items yet.</p>
              ) : (
                savedPosts.map((p) => <PostCard key={p.id} post={p} />)
              )}
            </div>
          )}
        </main>

        {/* Right Column: Trending, Active Contacts & Suggestions */}
        <RightSidebar />
      </div>

      {/* Mobile Bottom Navigation Bar: Home, Explore, Create, Reels, Profile */}
      <MobileTabBar />

      {/* Global Interactive Modals */}
      <CreatePostModal />
      <StoryViewerModal />
      <LiveStreamModal />
      <VideoCallModal />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
