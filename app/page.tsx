"use client";

import { useEffect, useState } from "react";

type Match = {
  id: number;
  shortTitle: string;
  status: string;
  statusNote: string;
  startTime: string;
  teamA: {
    name: string;
  };
  teamB: {
    name: string;
  };
};

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [timeNow, setTimeNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchMatches = async () => {
      const res = await fetch("/api/matches");
      const data = await res.json();
      setMatches(data);
    };

    fetchMatches();
  }, []);

  const getCountdown = (startTime: string) => {
    const diff = new Date(startTime).getTime() - timeNow;
    if (diff <= 0) return "Live";

    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    return `${hrs}h ${mins}m ${secs}s`;
  };

  if (!matches.length) {
    return <div className="p-4">Loading matches...</div>;
  }

  // --- FILTERING LOGIC ---
  const now = new Date();

  const upcomingMatches = matches
    .filter((m) => new Date(m.startTime) > now)
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() -
        new Date(b.startTime).getTime()
    );

  const liveMatches = matches.filter((m) =>
    m.status.toLowerCase().includes("live")
  );

  const nextMatch = liveMatches[0] || upcomingMatches[0];

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-gray-800 p-4">
      <div className="max-w-md mx-auto space-y-6">

        <h1 className="text-xl font-semibold tracking-tight">
          Fantasy IPL
        </h1>

        {/* Next Match */}
        {nextMatch && (
          <div>
            <h2 className="text-sm text-gray-500 mb-2">Next Match</h2>

            <div className="bg-white rounded-2xl p-4 shadow-sm border">
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {nextMatch.teamA.name} vs {nextMatch.teamB.name}
                </span>
                <span className="text-xs text-gray-500">
                  {getCountdown(nextMatch.startTime)}
                </span>
              </div>

              <div className="text-xs text-gray-400 mt-1">
                {nextMatch.statusNote || nextMatch.status}
              </div>
            </div>
          </div>
        )}

        {/* Upcoming */}
        <div>
          <h2 className="text-sm text-gray-500 mb-2">Upcoming</h2>

          <div className="space-y-3">
            {upcomingMatches.slice(1, 6).map((match) => (
              <div
                key={match.id}
                className="bg-white rounded-2xl p-4 shadow-sm border flex justify-between"
              >
                <div>
                  <div className="font-medium">
                    {match.teamA.name} vs {match.teamB.name}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {match.status}
                  </div>
                </div>

                <span className="text-xs text-gray-500">
                  {getCountdown(match.startTime)}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}