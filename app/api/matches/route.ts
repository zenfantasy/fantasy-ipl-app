import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://cricket-live-line-advance.p.rapidapi.com/competitions/129908/matches?paged=1&per_page=20",
      {
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY || "",
          "x-rapidapi-host":
            "cricket-live-line-advance.p.rapidapi.com",
        },
        cache: "no-store",
      }
    );

    const data = await response.json();
    const items = data?.response?.items || [];

    const matches = items.map((m: any) => {
      // Extract names from short_title like "RCB vs CSK"
      let teamAName = "TBD";
      let teamBName = "TBD";

      if (m.short_title && m.short_title.includes(" vs ")) {
        const parts = m.short_title.split(" vs ");
        teamAName = parts[0];
        teamBName = parts[1];
      }

      return {
        id: m.match_id,
        shortTitle: m.short_title,
        status: m.status_str,
        statusNote: m.status_note,
        startTime: m.date_start_ist,

        teamA: {
          id: m.teama_team_id,
          name: teamAName,
          logo: m.teama_logo_url,
          score: m.teama_scores,
          overs: m.teama_overs,
        },

        teamB: {
          id: m.teamb_team_id,
          name: teamBName,
          logo: m.teamb_logo_url,
          score: m.teamb_scores,
          overs: m.teamb_overs,
        },

        venue: {
          name: m.venue_name,
          location: m.venue_location,
        },

        result: m.result,
      };
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}