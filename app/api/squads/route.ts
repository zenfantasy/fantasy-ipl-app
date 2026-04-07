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
          "x-rapidapi-host":
            "cricket-live-line-advance.p.rapidapi.com",
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
          "x-rapidapi-host":
            "cricket-live-line-advance.p.rapidapi.com",
        },
      }
    );

    const data = await res.json();

    const squads = data.response.squads;

    const players = squads
      .filter((team: any) => {
        const abbr = team.team.abbr;
        return abbr === teamA || abbr === teamB;
      })
      .flatMap((team: any) => {
        const teamAbbr = team.team.abbr;

        return team.players.map((p: any) => {
          const raw = p.fantasy_player_rating;

          // --- CREDIT SCALING (6–11 range) ---
          const credit = Math.round((raw + 2) * 2) / 2;

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
            team: teamAbbr,

            // ✅ NEW
            isOverseas: p.country !== "in",
          };
        });
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