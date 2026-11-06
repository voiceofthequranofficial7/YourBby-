import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import type { Post, ReactionType } from '../../types/index.ts';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  CheckCircle2,
  MapPin,
  Globe,
  Sparkles,
  Languages,
  Trash2,
  Send,
  CornerDownRight,
  ShieldAlert,
  ThumbsUp
} from 'lucide-react';

const REACTION_EMOJIS: Record<ReactionType, { emoji: string; label: string; color: string }> = {
  like: { emoji: '👍', label: 'Like', color: 'text-blue-500' },
  love: { emoji: '❤️', label: 'Love', color: 'text-rose-500' },
  care: { emoji: '🥰', label: 'Care', color: 'text-amber-500' },
  haha: { emoji: '😆', label: 'Haha', color: 'text-yellow-500' },
  wow: { emoji: '😮', label: 'Wow', color: 'text-amber-500' },
  sad: { emoji: '😢', label: 'Sad', color: 'text-yellow-600' },
  angry: { emoji: '😡', label: 'Angry', color: 'text-orange-600' },
};

export const PostCard: React.FC<{ post: Post }> = ({ post }) => {
  const {
    currentUser,
    reactToPost,
    bookmarkPost,
    deletePost,
    votePoll,
    addComment,
    getCommentsForPost,
    setViewingProfileUsername,
    setActiveTab,
    language
  } = useApp();

  const [showReactionsPicker, setShowReactionsPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyToUser, setReplyToUser] = useState<string | null>(null);

  // AI Translation state
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [safetyCheckResult, setSafetyCheckResult] = useState<any | null>(null);

  // Gallery active index
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const isAuthor = currentUser?.id === post.authorId;

  const handleToggleComments = async () => {
    if (!showComments) {
      const data = await getCommentsForPost(post.id);
      setCommentsList(data);
    }
    setShowComments(!showComments);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await addComment(post.id, commentText.trim(), replyToId || undefined);
    setCommentText('');
    setReplyToId(null);
    setReplyToUser(null);
    const updated = await getCommentsForPost(post.id);
    setCommentsList(updated);
  };

  const handleTranslate = async () => {
    setIsTranslating(true);
    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: post.content,
          targetLanguage: language === 'en' ? 'hi' : language === 'hi' ? 'bn' : 'en'
        }),
      });
      const data = await res.json();
      if (data.success && data.result.translatedText) {
        setTranslatedText(data.result.translatedText);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSafetyInspection = async () => {
    try {
      const res = await fetch('/api/ai/content-safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: post.content }),
      });
      const data = await res.json();
      if (data.success) {
        setSafetyCheckResult(data.audit);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (dateStr: string) => {
    const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    return `${Math.floor(diffHr / 24)}d`;
  };

  const activeReactionMeta = post.userReaction ? REACTION_EMOJIS[post.userReaction] : null;

  return (
    <article className="w-full bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 rounded-2xl mb-4 overflow-hidden shadow-xs transition-colors">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setViewingProfileUsername(post.author.username);
              setActiveTab('profile');
            }}
            className="cursor-pointer group relative"
          >
            <img
              src={post.author.avatar}
              alt={post.author.displayName}
              className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 group-hover:ring-rose-500 transition-all"
            />
          </button>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => {
                  setViewingProfileUsername(post.author.username);
                  setActiveTab('profile');
                }}
                className="font-bold text-sm text-slate-900 dark:text-white hover:text-rose-500 transition-colors text-left"
              >
                {post.author.displayName}
              </button>
              {post.author.verified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20 shrink-0" />
              )}
              {post.feeling && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  is {post.feeling.emoji} {post.feeling.text}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>@{post.author.username}</span>
              <span>·</span>
              <span>{formatTime(post.createdAt)}</span>
              {post.locationName && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5 truncate max-w-[140px]">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {post.locationName}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 3-dots Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  bookmarkPost(post.id);
                  setShowMenu(false);
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <Bookmark className="w-4 h-4 text-slate-400" />
                {post.isBookmarked ? 'Remove Bookmark' : 'Save Post'}
              </button>
              <button
                onClick={() => {
                  handleTranslate();
                  setShowMenu(false);
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <Languages className="w-4 h-4 text-indigo-500" />
                Translate with AI
              </button>
              <button
                onClick={() => {
                  handleSafetyInspection();
                  setShowMenu(false);
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                AI Content Inspection
              </button>
              {isAuthor && (
                <button
                  onClick={() => {
                    deletePost(post.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Safety Inspection Banner if checked */}
      {safetyCheckResult && (
        <div className="mx-4 mb-3 p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs flex items-center justify-between border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>AI Moderation: <strong>{safetyCheckResult.summary}</strong> (Confidence: {Math.round(safetyCheckResult.confidence * 100)}%)</span>
          </div>
          <button onClick={() => setSafetyCheckResult(null)} className="text-slate-400 hover:text-slate-600 ml-2">×</button>
        </div>
      )}

      {/* Post Text */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-sm sm:text-base text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed">
            {post.content}
          </p>

          {/* Translated text overlay */}
          {translatedText && (
            <div className="mt-2.5 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/50 text-xs sm:text-sm text-indigo-900 dark:text-indigo-200">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                AI Translation
              </div>
              <p>{translatedText}</p>
              <button
                onClick={() => setTranslatedText(null)}
                className="text-[11px] text-indigo-500 hover:underline mt-1 block"
              >
                Hide translation
              </button>
            </div>
          )}

          {/* Hashtags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Media: Single photo or gallery */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className="relative w-full bg-slate-950 overflow-hidden">
          {post.mediaType === 'video' ? (
            <video
              src={post.mediaUrls[0]}
              controls
              className="w-full max-h-[500px] object-contain mx-auto"
            />
          ) : (
            <div className="relative w-full">
              <img
                src={post.mediaUrls[activeImageIdx]}
                alt="Post Media"
                className="w-full max-h-[550px] object-cover"
                loading="lazy"
              />
              {post.mediaUrls.length > 1 && (
                <>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-xs">
                    {post.mediaUrls.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIdx(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === activeImageIdx ? 'w-4 bg-rose-500' : 'bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold">
                    {activeImageIdx + 1}/{post.mediaUrls.length}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Interactive Poll */}
      {post.poll && (
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-y border-slate-100 dark:border-slate-800">
          <p className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            {post.poll.question}
          </p>
          <div className="space-y-2">
            {post.poll.options.map((option) => {
              const total = post.poll!.totalVotes || 1;
              const percentage = Math.round((option.votes / total) * 100) || 0;
              const hasVoted = currentUser && option.votedUserIds.includes(currentUser.id);

              return (
                <button
                  key={option.id}
                  onClick={() => votePoll(post.id, option.id)}
                  className={`w-full relative text-left p-2.5 rounded-xl border text-xs sm:text-sm font-medium overflow-hidden transition-all group ${
                    hasVoted
                      ? 'border-rose-500/50 bg-rose-500/5'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {/* Progress percentage fill bar */}
                  <div
                    className={`absolute inset-0 opacity-15 pointer-events-none transition-all duration-500 ${
                      hasVoted ? 'bg-rose-500 opacity-25' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="relative flex items-center justify-between">
                    <span className="text-slate-800 dark:text-slate-200 group-hover:text-slate-900">
                      {option.text}
                    </span>
                    <span className="font-bold text-xs text-slate-500 dark:text-slate-400">
                      {percentage}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-right">
            <span className="text-[11px] text-slate-400 font-medium">
              {post.poll.totalVotes} total votes
            </span>
          </div>
        </div>
      )}

      {/* Reaction Counts & Comment Counter Strip */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-1.5">
          {post.likesCount > 0 && (
            <div className="flex items-center -space-x-1">
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">
                ❤️
              </span>
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">
                👍
              </span>
            </div>
          )}
          <span>{post.likesCount}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleToggleComments} className="hover:underline">
            {post.commentsCount} comments
          </button>
          <span>·</span>
          <span>{post.repostsCount} shares</span>
        </div>
      </div>

      {/* Action Buttons Strip */}
      <div className="px-2 py-1.5 flex items-center justify-between relative">
        {/* Reaction trigger */}
        <div
          className="relative flex-1"
          onMouseEnter={() => setShowReactionsPicker(true)}
          onMouseLeave={() => setShowReactionsPicker(false)}
        >
          <button
            onClick={() => reactToPost(post.id, post.userReaction ? null : 'like')}
            className={`w-full py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              activeReactionMeta ? activeReactionMeta.color : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {activeReactionMeta ? (
              <>
                <span className="text-base">{activeReactionMeta.emoji}</span>
                <span>{activeReactionMeta.label}</span>
              </>
            ) : (
              <>
                <ThumbsUp className="w-4 h-4" />
                <span>Like</span>
              </>
            )}
          </button>

          {/* Facebook-style floating reactions picker */}
          {showReactionsPicker && (
            <div className="absolute -top-12 left-2 flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-2xl border border-slate-200 dark:border-slate-700 z-30 animate-in fade-in slide-in-from-bottom-2 duration-150">
              {(Object.keys(REACTION_EMOJIS) as ReactionType[]).map((rKey) => {
                const meta = REACTION_EMOJIS[rKey];
                return (
                  <button
                    key={rKey}
                    onClick={() => {
                      reactToPost(post.id, rKey);
                      setShowReactionsPicker(false);
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg hover:scale-130 transition-transform active:scale-95"
                    title={meta.label}
                  >
                    {meta.emoji}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Comment toggle button */}
        <button
          onClick={handleToggleComments}
          className="flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Comment</span>
        </button>

        {/* Share button */}
        <button
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href);
          }}
          className="flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Copy Link"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>

        {/* Bookmark */}
        <button
          onClick={() => bookmarkPost(post.id)}
          className={`p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
            post.isBookmarked ? 'text-rose-500' : 'text-slate-400'
          }`}
          title="Save"
        >
          <Bookmark className={`w-4 h-4 ${post.isBookmarked ? 'fill-rose-500' : ''}`} />
        </button>
      </div>

      {/* Expandable Comments Drawer */}
      {showComments && (
        <div className="px-4 py-3 bg-slate-50/70 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
          {/* Comment composer */}
          <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 mb-3">
            <img
              src={currentUser?.avatar}
              alt="Me"
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
            <div className="flex-1 relative">
              {replyToUser && (
                <div className="flex items-center gap-1 text-[11px] text-rose-500 mb-1">
                  <CornerDownRight className="w-3 h-3" /> Replying to @{replyToUser}
                  <button
                    type="button"
                    onClick={() => { setReplyToId(null); setReplyToUser(null); }}
                    className="ml-1 text-slate-400 hover:text-slate-600"
                  >
                    ×
                  </button>
                </div>
              )}
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={replyToUser ? `Reply to @${replyToUser}...` : 'Write a comment...'}
                className="w-full px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
              />
            </div>
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="p-2 rounded-full bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white transition-opacity"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-3 pt-1">
            {commentsList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">No comments yet. Be the first to share your thoughts!</p>
            ) : (
              commentsList.map((c) => (
                <div key={c.id} className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <img
                      src={c.author.avatar}
                      alt={c.author.displayName}
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1">
                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs inline-block max-w-[90%]">
                        <span className="font-bold text-slate-900 dark:text-white mr-1.5">
                          {c.author.displayName}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">{c.text}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 pl-2">
                        <span>{formatTime(c.createdAt)}</span>
                        <button
                          onClick={() => {
                            setReplyToId(c.id);
                            setReplyToUser(c.author.username);
                          }}
                          className="font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-500"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Nested replies */}
                  {c.replies && c.replies.map((r: any) => (
                    <div key={r.id} className="flex items-start gap-2.5 pl-8">
                      <img
                        src={r.author.avatar}
                        alt={r.author.displayName}
                        className="w-6 h-6 rounded-full object-cover shrink-0"
                      />
                      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs inline-block">
                        <span className="font-bold text-slate-900 dark:text-white mr-1.5">
                          {r.author.displayName}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">{r.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </article>
  );
};
