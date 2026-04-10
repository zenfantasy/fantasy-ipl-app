import { NextResponse } from "next/server";

const API_HOST = "cricket-live-line-advance.p.rapidapi.com";

function toArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId");

    if (!matchId) {
      return NextResponse.json({ error: "matchId required" }, { status: 400 });
    }

    const response = await fetch(`https://${API_HOST}/matches/${matchId}/info`, {
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY || "",
        "x-rapidapi-host": API_HOST,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch match info" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const payload = data?.response ?? {};
    const scorecard = payload?.scorecard ?? {};

    const teamAPlayers = toArray(payload?.squads?.teama?.squads);
    const teamBPlayers = toArray(payload?.squads?.teamb?.squads);

    const players = [...teamAPlayers, ...teamBPlayers].map((player: any) => ({
      player_id: player?.player_id,
      name: player?.name,
      role: player?.role,
      role_str: player?.role_str,
      playing11: Boolean(player?.playing11),
      substitute: Boolean(player?.substitute),
      out: Boolean(player?.out),
      in: Boolean(player?.in),
    }));

    const batting = toArray(payload?.batting || payload?.scorecard?.batting);
    const bowling = toArray(payload?.bowling || payload?.scorecard?.bowling);
    const fielding = toArray(payload?.fielding || payload?.scorecard?.fielding);

    return NextResponse.json({
      match: {
        match_id: scorecard?.match_id,
        title: scorecard?.title,
        short_title: scorecard?.short_title,
        status_str: scorecard?.status_str,
        status_note: scorecard?.status_note,
        teama: scorecard?.teama || null,
        teamb: scorecard?.teamb || null,
      },
      players,
      batting,
      bowling,
      fielding,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}