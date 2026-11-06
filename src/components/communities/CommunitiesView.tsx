import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Users, Lock, Globe, Check, Plus, MessageSquare, Bell } from 'lucide-react';
import type { Group } from '../../types/index.ts';

export const CommunitiesView: React.FC = () => {
  const { groups, toggleJoinGroup, setActiveTab } = useApp();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 my-2">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-indigo-500/10 rounded-3xl border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-rose-500" />
            Communities & Groups
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-lg">
            Connect with passionate creators, indie founders, filmmakers and audio designers across India and global hubs.
          </p>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs flex flex-col"
          >
            {/* Cover image */}
            <div className="relative h-32 w-full bg-slate-950">
              <img
                src={group.coverImage}
                alt={group.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                {group.privacy === 'private' ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                {group.privacy}
              </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">
                  {group.category}
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mt-0.5 line-clamp-1">
                  {group.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                  {group.description}
                </p>

                {/* Announcement pill */}
                {group.pinnedAnnouncement && (
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                    <Bell className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span className="text-[11px] font-medium line-clamp-2">{group.pinnedAnnouncement}</span>
                  </div>
                )}
              </div>

              {/* Bottom stats & Join button */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {group.membersCount.toLocaleString()}
                  </span>{' '}
                  members · {group.postsCount} posts
                </div>

                <button
                  onClick={() => toggleJoinGroup(group.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    group.isMember
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      : 'bg-rose-500 hover:bg-rose-600 text-white shadow-xs'
                  }`}
                >
                  {group.isMember ? (
                    <span className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500" /> Joined
                    </span>
                  ) : (
                    'Join Group'
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
