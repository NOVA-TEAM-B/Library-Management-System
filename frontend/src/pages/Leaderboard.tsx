import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, Flame, Sparkles, Award } from 'lucide-react';

interface Member {
  id: number;
  username: string;
  department: string;
  reading_score: number;
  achievement_level: string;
  books_issued: number;
}

export default function Leaderboard() {
  const [standings, setStandings] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStandings = async () => {
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/members', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error('Failed to load standings');
      
      // Sort members by reading score descending
      const sorted = data.members.sort((a: Member, b: Member) => b.reading_score - a.reading_score);
      setStandings(sorted);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStandings();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Trophy Header */}
      <div className="glass-panel p-6 border-white/10 text-center space-y-3 bg-gradient-to-b from-yellow-600/20 to-blue-900/10">
        <Trophy className="w-14 h-14 text-yellow-300 mx-auto animate-bounce" />
        <h3 className="text-2xl font-extrabold text-white">Championship Readers Leaderboard</h3>
        <p className="text-white/60 text-xs">Standings are updated in real-time matching MITS university reading indicators.</p>
      </div>

      {/* Leaderboard Lists */}
      <div className="glass-panel p-5 border-white/10 space-y-4">
        <h4 className="text-white text-base font-semibold mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-300" /> Current Standings</h4>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {standings.map((user, idx) => {
              const rank = idx + 1;
              let rankBadge = <span className="text-white/50 w-6 text-center text-xs">{rank}</span>;
              let borderHighlight = 'border-white/5';
              let backgroundHighlight = 'bg-white/[0.01]';
              
              if (rank === 1) {
                rankBadge = <Medal className="w-6 h-6 text-yellow-300 filter drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]" />;
                borderHighlight = 'border-yellow-500/30';
                backgroundHighlight = 'bg-yellow-500/5';
              } else if (rank === 2) {
                rankBadge = <Medal className="w-6 h-6 text-slate-300 filter drop-shadow-[0_0_4px_rgba(203,213,225,0.5)]" />;
                borderHighlight = 'border-slate-400/20';
                backgroundHighlight = 'bg-slate-400/5';
              } else if (rank === 3) {
                rankBadge = <Medal className="w-6 h-6 text-amber-600 filter drop-shadow-[0_0_4px_rgba(180,83,9,0.5)]" />;
                borderHighlight = 'border-amber-600/20';
                backgroundHighlight = 'bg-amber-600/5';
              }

              return (
                <div
                  key={user.id}
                  className={`glass-panel p-3.5 flex items-center justify-between gap-4 border ${borderHighlight} ${backgroundHighlight} transition-all duration-300 hover:translate-x-1.5`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex justify-center items-center w-6">{rankBadge}</div>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-white text-xs">
                      {user.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h6 className="text-white text-xs font-bold m-0">{user.username}</h6>
                      <span className="text-[9px] text-white/40">{user.department}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-right">
                    <div className="text-xs">
                      <span className="text-[9px] text-white/40 block">Achievement</span>
                      <strong className="text-yellow-400 text-[10px] font-bold flex items-center gap-1"><Award className="w-3.5 h-3.5 text-yellow-300" /> {user.achievement_level}</strong>
                    </div>
                    <div className="text-xs">
                      <span className="text-[9px] text-white/40 block">Reading Score</span>
                      <strong className="text-cyan-400 text-xs font-bold">{user.reading_score} pts</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
