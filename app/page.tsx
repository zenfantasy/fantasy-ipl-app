"use client";

import { useEffect, useState } from "react";

type Match = {
  id: number;
  teamA: string;
  teamB: string;
  startTime: string;
};

export default function Home() {
  const [timeNow, setTimeNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const matches: Match[] = [
    {
      id: 1,
      teamA: "RCB",
      teamB: "CSK",
      startTime: "2026-04-05T19:30:00",
    },
    {
      id: 2,
      teamA: "MI",
      teamB: "KKR",
      startTime: "2026-04-06T19:30:00",
    },
  ];

  const getCountdown = (startTime: string) => {
    const diff = new Date(startTime).getTime() - timeNow;
    if (diff <= 0) return "Live / Started";

    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    return `${hrs}h ${mins}m ${secs}s`;
  };

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-gray-800 p-4">
      <div className="max-w-md mx-auto space-y-6">
        
        <h1 className="text-xl font-semibold tracking-tight">
          Fantasy IPL
        </h1>

        {/* Next Match */}
        <div>
          <h2 className="text-sm text-gray-500 mb-2">Next Match</h2>

          <div className="bg-white rounded-2xl p-4 shadow-sm border">
            <div className="flex justify-between items-center">
              <span className="font-medium">
                {matches[0].teamA} vs {matches[0].teamB}
              </span>
              <span className="text-xs text-gray-500">
                {getCountdown(matches[0].startTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Upcoming */}
        <div>
          <h2 className="text-sm text-gray-500 mb-2">Upcoming</h2>

          <div className="space-y-3">
            {matches.slice(1).map((match) => (
              <div
                key={match.id}
                className="bg-white rounded-2xl p-4 shadow-sm border flex justify-between"
              >
                <span className="font-medium">
                  {match.teamA} vs {match.teamB}
                </span>
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