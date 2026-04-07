"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Player = {
  id: string;
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
  const [selected, setSelected] = useState<Player[]>([]);

  useEffect(() => {
    const fetchPlayers = async () => {
      const res = await fetch(`/api/squads?matchId=${matchId}`);
      const data = await res.json();
      setPlayers(data);
    };

    fetchPlayers();
  }, [matchId]);

  // --- CALCULATIONS ---
  const totalCredits = selected.reduce(
    (sum, p) => sum + p.credit,
    0
  );

  const overseasCount = selected.filter(
    (p) => p.isOverseas
  ).length;

  // --- SELECTION LOGIC ---
  const togglePlayer = (player: Player) => {
    const alreadySelected = selected.find(
      (p) => p.id === player.id
    );

    if (alreadySelected) {
      setSelected(selected.filter((p) => p.id !== player.id));
      return;
    }

    // --- BASIC CONSTRAINTS ---
    if (selected.length >= 11) return;
    if (totalCredits + player.credit > 100) return;
    if (player.isOverseas && overseasCount >= 4) return;

    setSelected([...selected, player]);
  };

  if (!players.length) {
    return <div className="p-4">Loading players...</div>;
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-gray-800 p-4">
      <div className="max-w-md mx-auto space-y-4">

        {/* --- TOP BAR --- */}
        <div className="bg-white rounded-xl p-4 border space-y-2">
          <div className="text-sm">
            Players: {selected.length} / 11
          </div>

          <div className="text-sm">
            Credits: {totalCredits.toFixed(1)} / 100
          </div>

          <div className="text-sm">
            Overseas: {overseasCount} / 4
          </div>
        </div>

        {/* --- PLAYER LIST --- */}
        {players.map((p, index) => {
          const isSelected = selected.some(
            (sp) => sp.id === p.id
          );

          return (
            <div
              key={`${p.id}-${index}`}
              className={`bg-white rounded-xl p-3 border flex justify-between items-center ${
                isSelected ? "border-black" : ""
              }`}
            >
              <div>
                <div className="font-medium flex items-center gap-2">
                  {p.name}

                  {p.isOverseas && (
                    <span className="text-xs">✈️</span>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  {p.role} • {p.team}
                </div>
              </div>

              <button
                onClick={() => togglePlayer(p)}
                className="text-sm px-2 py-1 border rounded"
              >
                {isSelected ? "-" : "+"}
              </button>
            </div>
          );
        })}

      </div>
    </main>
  );
}