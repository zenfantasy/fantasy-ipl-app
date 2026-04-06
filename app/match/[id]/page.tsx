"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Player = {
  id: number;
  name: string;
  role: string;
  team: string;
  credit: number;
  isOverseas: boolean;
};

export default function MatchPage() {
  const params = useParams();
  const matchId = params.id;

  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const fetchPlayers = async () => {
      const res = await fetch(`/api/squads?matchId=${matchId}`);
      const data = await res.json();
      setPlayers(data);
    };

    fetchPlayers();
  }, [matchId]);

  if (!players) {
    return <div className="p-4">Loading players...</div>;
  }

  if (players.length === 0) {
    return <div className="p-4">No players found</div>;
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-gray-800 p-4">
      <div className="max-w-md mx-auto space-y-4">

        <h1 className="text-xl font-semibold">
          Select Your Team
        </h1>

        {players.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-xl p-3 border flex justify-between"
          >
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-gray-500">
                {p.role} • {p.team}
              </div>
            </div>

            <div className="text-sm">
              {p.credit} cr
            </div>
          </div>
        ))}

      </div>
    </main>
  );
}