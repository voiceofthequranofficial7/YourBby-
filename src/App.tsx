import React from 'react';
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
  Smile,
  BarChart2,
  Radio,
  RefreshCw
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
    setIsAuthModalOpen
  } = useApp();

  const savedPosts = posts.filter(p => p.isBookmarked);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-16 md:pb-0">
      {/* Top Header */}
      <Header />

      {/* Main 3-Column Responsive Container */}
      <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 flex-1 flex justify-center">
        {/* Left Column: Sidebar navigation */}
        <Sidebar />

        {/* Center Column: Primary Active View Feed */}
        <main className="flex-1 max-w-2xl py-4 px-1 sm:px-4 min-w-0">
          {activeTab === 'feed' && (
            <div className="space-y-4">
              {/* Feed Type Segmented Filter Controls */}
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
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      feedType === f.id
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Instagram-style Notes Bar */}
              <NotesBubbleRow />

              {/* Stories Bar */}
              <StoriesBar />

              {/* Quick Post Composer Card */}
              <div
                onClick={() => openCreateModal('post')}
                className="bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs cursor-pointer hover:border-rose-500/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={currentUser?.avatar}
                    alt="Me"
                    className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                  />
                  <div className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-full text-xs sm:text-sm text-slate-400">
                    {t('whatsOnYourMind')}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openCreateModal('post'); }}
                    className="flex items-center gap-2 hover:text-rose-500 transition-colors"
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-500" />
                    <span>Photo / Video</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openCreateModal('live'); }}
                    className="flex items-center gap-2 hover:text-rose-500 transition-colors"
                  >
                    <Radio className="w-4 h-4 text-rose-500" />
                    <span>Live Video</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openCreateModal('post'); }}
                    className="flex items-center gap-2 hover:text-rose-500 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>AI Assistant</span>
                  </button>
                </div>
              </div>

              {/* Posts Feed Stream */}
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <p>No posts in this feed yet. Be the first to share!</p>
                  </div>
                ) : (
                  posts.map((post) => <PostCard key={post.id} post={post} />)
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
                <p className="text-xs text-slate-500 mt-0.5">Your private collection of bookmarked media and insights.</p>
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

      {/* Mobile Bottom Tab Bar */}
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
