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

    // --- GET MATCHES LIST (for short_title) ---
    const matchListRes = await fetch(
      "https://cricket-live-line-advance.p.rapidapi.com/competitions/129908/matches?paged=1&per_page=50",
      {
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY || "",
          "x-rapidapi-host": "cricket-live-line-advance.p.rapidapi.com",
        },
      }
    );

    const matchListData = await matchListRes.json();

    const match = matchListData?.response?.items?.find(
      (m: any) => String(m.match_id) === String(matchId)
    );

    if (!match || !match.short_title) {
      return NextResponse.json([]);
    }

    // extract teams from "RCB vs CSK"
    const [teamA, teamB] = match.short_title.split(" vs ");

    // --- GET SQUADS ---
    const res = await fetch(
      "https://cricket-live-line-advance.p.rapidapi.com/competitions/129908/squads",
      {
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY || "",
          "x-rapidapi-host": "cricket-live-line-advance.p.rapidapi.com",
        },
      }
    );

    const data = await res.json();
    const squads = data.response.squads;

    // 1. Filter teams and flatten into a single array of players
    const allMatchPlayers = squads
      .filter((team: any) => {
        const abbr = team.team.abbr;
        return abbr === teamA || abbr === teamB;
      })
      .flatMap((team: any) => 
        team.players.map((p: any) => ({ ...p, teamAbbr: team.team.abbr }))
      );

    if (allMatchPlayers.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Find the dynamic min and max raw ratings for this specific match
    const rawRatings = allMatchPlayers.map((p: any) => p.fantasy_player_rating || 0);
    const inputMin = Math.min(...rawRatings);
    const inputMax = Math.max(...rawRatings);

    const outputMin = 6;
    const outputMax = 10;

    // 3. Map players to their final structure with the scaled credit
    const players = allMatchPlayers.map((p: any) => {
      const raw = p.fantasy_player_rating || 0;
      
      let scaled = outputMin;
      
      // Prevent division by zero if all players happen to have the exact same rating
      if (inputMin !== inputMax) {
        scaled = outputMin + ((raw - inputMin) * (outputMax - outputMin)) / (inputMax - inputMin);
      }

      // Clamp and round to nearest 0.5
      const clamped = Math.max(outputMin, Math.min(outputMax, scaled));
      const credit = Math.round(clamped * 2) / 2;

      return {
        id: String(p.pid),
        name: p.title,
        role:
          p.playing_role === "wk"
            ? "WK"
            : p.playing_role === "bat"
            ? "BAT"
            : p.playing_role === "bowl"
            ? "BOWL"
            : "AR",
        credit,
        team: p.teamAbbr,
        // ✅ NEW
        isOverseas: p.country !== "in",
      };
    });

    return NextResponse.json(players);

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "failed" },
      { status: 500 }
    );
  }
}