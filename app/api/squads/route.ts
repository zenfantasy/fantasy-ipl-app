import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId");

    if (!matchId) {
      return NextResponse.json(
        { error: "matchId required" },
        { status: 400 }
      );
    }

    // --- MATCH INFO ---
    const matchRes = await fetch(
      `https://cricket-live-line-advance.p.rapidapi.com/matches/${matchId}/info`,
      {
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY || "",
          "x-rapidapi-host":
            "cricket-live-line-advance.p.rapidapi.com",
        },
        cache: "no-store",
      }
    );

    const matchData = await matchRes.json();
    const match = matchData?.response;

    const teamAId = match?.teama?.team_id;
    const teamBId = match?.teamb?.team_id;

    const playingXI = new Set(
      (match?.playing11 || []).map((p: any) => p.player_id)
    );

    const substitutes = new Set(
      (match?.substitute || []).map((p: any) => p.player_id)
    );

    // --- COMPETITION SQUADS ---
    const squadRes = await fetch(
      "https://cricket-live-line-advance.p.rapidapi.com/competitions/129908/squads",
      {
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY || "",
          "x-rapidapi-host":
            "cricket-live-line-advance.p.rapidapi.com",
        },
        cache: "no-store",
      }
    );

    const squadData = await squadRes.json();
    const teams = squadData?.response?.squads || [];

    let players: any[] = [];

    teams.forEach((team: any) => {
      if (
        team.team_id !== teamAId &&
        team.team_id !== teamBId
      ) {
        return;
      }

      const teamName =
        team.team_short_name || team.team_name;

      team.players.forEach((p: any) => {
        // --- FIXED FIELD MAPPING ---
        const name =
          p.player_name ||
          p.name ||
          "Unknown";

        const role =
          p.playing_role ||
          p.role ||
          "BAT";

        const rating =
          p.fantasy_player_rating ||
          p.fantasy_rating ||
          500; // safer fallback

        // --- BETTER CREDIT SCALING ---
        const credit = Math.round((rating / 100) * 10) / 2;

        players.push({
          id: p.player_id,
          name,
          role,
          team: teamName,
          credit,
          isOverseas:
            (p.country || "").toLowerCase() !== "india",

          isPlaying: playingXI.has(p.player_id),
          isSubstitute: substitutes.has(p.player_id),
        });
      });
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "failed to fetch squads" },
      { status: 500 }
    );
  }
}