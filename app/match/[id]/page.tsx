"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Player = {
  id: string;
  name: string;
  role: "WK" | "BAT" | "AR" | "BOWL";
  team: string;
  credit: number;
  isOverseas: boolean;
};

export default function MatchPage() {
  const params = useParams();
  const matchId = params.id;

  const [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState<Player[]>([]);
  const [captain, setCaptain] = useState<string | null>(null);
  const [viceCaptain, setViceCaptain] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      const res = await fetch(`/api/squads?matchId=${matchId}`);
      const data = await res.json();
      setPlayers(data);
    };

    fetchPlayers();
  }, [matchId]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  // --- CALCULATIONS ---
  const totalCredits = selected.reduce(
    (sum, p) => sum + p.credit,
    0
  );

  const overseasCount = selected.filter(
    (p) => p.isOverseas
  ).length;

  const roleCount = {
    WK: selected.filter((p) => p.role === "WK").length,
    BAT: selected.filter((p) => p.role === "BAT").length,
    AR: selected.filter((p) => p.role === "AR").length,
    BOWL: selected.filter((p) => p.role === "BOWL").length,
  };

  const teamCount: Record<string, number> = {};
  selected.forEach((p) => {
    teamCount[p.team] = (teamCount[p.team] || 0) + 1;
  });

  const isMinRolesValid =
    roleCount.WK >= 1 &&
    roleCount.BAT >= 3 &&
    roleCount.AR >= 1 &&
    roleCount.BOWL >= 3;

  const isTeamValid =
    selected.length === 11 &&
    totalCredits <= 100 &&
    overseasCount <= 4 &&
    isMinRolesValid &&
    captain !== null &&
    viceCaptain !== null;

  // --- DISABLE LOGIC ---
  const isDisabled = (player: Player) => {
    if (selected.some((p) => p.id === player.id)) return false;

    if (selected.length >= 11) return true;
    if (totalCredits + player.credit > 100) return true;
    if (player.isOverseas && overseasCount >= 4) return true;

    if ((teamCount[player.team] || 0) >= 7) return true;

    if (player.role === "WK" && roleCount.WK >= 4) return true;
    if (player.role === "BAT" && roleCount.BAT >= 6) return true;
    if (player.role === "AR" && roleCount.AR >= 4) return true;
    if (player.role === "BOWL" && roleCount.BOWL >= 6) return true;

    return false;
  };

  const togglePlayer = (player: Player) => {
    const exists = selected.find((p) => p.id === player.id);

    if (exists) {
      setSelected(selected.filter((p) => p.id !== player.id));

      // remove captain/VC if removed
      if (captain === player.id) setCaptain(null);
      if (viceCaptain === player.id) setViceCaptain(null);

      return;
    }

    if (isDisabled(player)) return;

    setSelected([...selected, player]);
  };

  const handleCaptain = (id: string) => {
    if (viceCaptain === id) setViceCaptain(null);
    setCaptain(id);
  };

  const handleViceCaptain = (id: string) => {
    if (captain === id) setCaptain(null);
    setViceCaptain(id);
  };

  const handleSubmit = async () => {
    if (!isTeamValid || !user) return;

    const { error } = await supabase.from("teams").insert([
      {
        match_id: matchId,
        user_id: user.id,
        players: selected.map((p) => p.id),
        captain,
        vice_captain: viceCaptain,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Error saving team");
      return;
    }

    alert("Team saved!");
  };

  // --- GROUP BY TEAM ---
  const teams = Array.from(new Set(players.map((p) => p.team)));

  const teamA = teams[0];
  const teamB = teams[1];

  const groupedByTeam = {
    [teamA]: players
      .filter((p) => p.team === teamA)
      .sort((a, b) => b.credit - a.credit),
  
    [teamB]: players
      .filter((p) => p.team === teamB)
      .sort((a, b) => b.credit - a.credit),
  };

  if (!players.length) {
    return <div className="p-4">Loading players...</div>;
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-gray-800 p-4">
      <div className="max-w-md mx-auto space-y-6">

        {/* --- PROGRESS --- */}
        <div className="space-y-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">
              Players ({selected.length}/11)
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-gray-800 rounded-full"
                style={{
                  width: `${(selected.length / 11) * 100}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">
              Credits ({totalCredits.toFixed(1)}/100)
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-gray-800 rounded-full"
                style={{
                  width: `${(totalCredits / 100) * 100}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">
              Overseas ({overseasCount}/4)
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-gray-800 rounded-full"
                style={{
                  width: `${(overseasCount / 4) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* --- TEAM HEADERS --- */}
        <div className="flex justify-between text-xs text-gray-400 px-1">
          <span>
            {teamA} ({teamCount[teamA] || 0})
          </span>
        
          <span>
            {teamB} ({teamCount[teamB] || 0})
          </span>
        </div>

        {/* --- PLAYER GRID --- */}
        <div className="grid grid-cols-2 gap-3">

          {[teamA, teamB].map((team) => (
            <div key={team} className="space-y-2">

              {groupedByTeam[team].map((p, index) => {
                const isSelected = selected.some(
                  (sp) => sp.id === p.id
                );

                const disabled = isDisabled(p);

                return (
                  <div
                    key={`${p.id}-${index}`}
                    className={`bg-white rounded-2xl px-3 py-2 flex flex-col gap-1
                      ${isSelected ? "border border-gray-800" : "border"}
                      ${disabled ? "opacity-40" : ""}
                    `}
                  >
                    <div className="text-xs font-medium flex items-center gap-1">
                      {p.name}
                      {p.isOverseas && <span>✈️</span>}
                    </div>

                    <div className="text-[10px] text-gray-400">
                      {p.role}
                    </div>

                    <div className="flex flex-col items-end gap-1 mt-1">
                      <div className="text-xs">{p.credit}</div>

                      {/* Add / Remove */}
                      <button
                        disabled={disabled}
                        onClick={() => togglePlayer(p)}
                        className="w-5 h-5 flex items-center justify-center border rounded-full text-xs"
                      >
                        {isSelected ? "−" : "+"}
                      </button>

                      {/* Captain controls */}
                      {isSelected && (
                        <div className="flex gap-1 mt-1">
                          <button
                            onClick={() => handleCaptain(p.id)}
                            className={`text-[10px] px-1 border rounded ${
                              captain === p.id ? "bg-gray-800 text-white" : ""
                            }`}
                          >
                            C
                          </button>

                          <button
                            onClick={() => handleViceCaptain(p.id)}
                            className={`text-[10px] px-1 border rounded ${
                              viceCaptain === p.id ? "bg-gray-600 text-white" : ""
                            }`}
                          >
                            VC
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

        </div>

        {/* --- VALIDATION HINTS & SUBMIT BUTTON --- */}
        <div className="space-y-3 pb-8">
          <div className="text-[11px] text-gray-400 text-center">
            {!isMinRolesValid && "Check role combination"}
            {selected.length !== 11 && " • Select 11 players"}
            {captain === null && " • Select Captain"}
            {viceCaptain === null && " • Select Vice Captain"}
            {!user && " • Must be logged in to save"}
          </div>

          <button
            disabled={!isTeamValid || !user}
            onClick={handleSubmit}
            className={`w-full py-3 rounded-xl text-sm ${
              isTeamValid && user
                ? "bg-gray-800 text-white"
                : "bg-gray-200 text-gray-400"
            }`}
          >
            Submit Team
          </button>
        </div>

      </div>
    </main>
  );
}