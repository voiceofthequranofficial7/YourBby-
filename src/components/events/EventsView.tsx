import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Calendar, MapPin, Users, Check, Clock, Sparkles } from 'lucide-react';

export const EventsView: React.FC = () => {
  const { events, rsvpEvent } = useApp();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 my-2">
      <div className="p-6 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-rose-500/10 rounded-3xl border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-500" />
            Events & Creator Gatherings
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-lg">
            Discover upcoming creator summits, live music jam sessions, and founder meetups happening in your region.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs flex flex-col sm:flex-row"
          >
            {/* Cover image */}
            <div className="sm:w-64 h-48 sm:h-auto shrink-0 bg-slate-950 relative">
              <img
                src={ev.coverImage}
                alt={ev.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded-xl text-center shadow-md">
                <span className="block text-[10px] uppercase font-bold text-rose-500">
                  {ev.date.split(',')[0]}
                </span>
                <span className="block text-sm font-extrabold text-slate-900 dark:text-white">
                  {ev.date.split(' ')[2] || '22'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  {ev.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                  {ev.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>{ev.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="truncate">{ev.location}</span>
                  </div>
                </div>
              </div>

              {/* RSVP Actions & Attendees */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {ev.attendeesCount} attending
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => rsvpEvent(ev.id, 'going')}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      ev.rsvpStatus === 'going'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {ev.rsvpStatus === 'going' ? '✓ Going' : 'Going'}
                  </button>
                  <button
                    onClick={() => rsvpEvent(ev.id, 'interested')}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      ev.rsvpStatus === 'interested'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Interested
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
