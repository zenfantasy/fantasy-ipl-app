"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Match = {
  id: string;
  teamA: string;
  teamB: string;
  startTime: string;
};

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [now, setNow] = useState<Date | null>(null); // 🔥 null initially

  // set time AFTER mount → fixes hydration
  useEffect(() => {
    setNow(new Date());

    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // fetch matches
  useEffect(() => {
    const fetchMatches = async () => {
      const res = await fetch("/api/matches");
      const data = await res.json();

      const cleaned = data.map((m: any) => ({
        id: String(m.id),
        teamA: m.teamA?.name || m.teamA,
        teamB: m.teamB?.name || m.teamB,
        startTime: m.startTime,
      }));

      setMatches(cleaned);
    };

    fetchMatches();
  }, []);

  // 🔥 avoid rendering before client ready
  if (!now) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Loading matches...
      </main>
    );
  }

  const upcoming = matches
    .filter((m) => new Date(m.startTime) > now)
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() -
        new Date(b.startTime).getTime()
    );

  const nextMatch = upcoming[0];

  const getCountdown = (startTime: string) => {
    const diff =
      new Date(startTime).getTime() - now.getTime();

    if (diff <= 0) return "LIVE";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor(
      (diff % (1000 * 60 * 60)) / (1000 * 60)
    );
    const secs = Math.floor(
      (diff % (1000 * 60)) / 1000
    );

    return `${hours}h ${mins}m ${secs}s`;
  };

  return (
    <main className="min-h-screen bg-[#f7f7f5] p-4 text-gray-800">
      <div className="max-w-md mx-auto space-y-8">

        <h1 className="text-xl font-semibold">
          Fantasy IPL
        </h1>

        {/* NEXT MATCH */}
        {nextMatch && (
          <div className="space-y-2">
            <div className="text-xs text-gray-400">
              Next Match
            </div>

            <Link href={`/match/${nextMatch.id}`}>
              <div className="bg-white rounded-2xl p-5 border flex justify-between items-center cursor-pointer">

                <div>
                  <div className="font-medium">
                    {nextMatch.teamA} vs {nextMatch.teamB}
                  </div>

                  <div className="text-xs text-gray-400 mt-1">
                    Scheduled
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  {getCountdown(nextMatch.startTime)}
                </div>

              </div>
            </Link>
          </div>
        )}

        {/* UPCOMING */}
        <div className="space-y-3">
          <div className="text-xs text-gray-400">
            Upcoming
          </div>

          {upcoming.slice(1).map((m) => {
            const countdown = getCountdown(m.startTime);
            const isLive = countdown === "LIVE";

            return (
              <Link key={m.id} href={`/match/${m.id}`}>
                <div className="bg-white rounded-2xl p-5 border flex justify-between items-center cursor-pointer">

                  <div>
                    <div className="font-medium">
                      {m.teamA} vs {m.teamB}
                    </div>

                    <div className="text-xs text-gray-400 mt-1">
                      {isLive ? "Live" : "Scheduled"}
                    </div>
                  </div>

                  <div
                    className={`text-sm ${
                      isLive ? "text-green-600" : "text-gray-600"
                    }`}
                  >
                    {countdown}
                  </div>

                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </main>
  );
}