import { NextResponse } from "next/server";

type RawMaybeText =
  | string
  | null
  | undefined
  | {
      name?: string | null;
      short_name?: string | null;
      title?: string | null;
      value?: string | null;
      [key: string]: unknown;
    };

type RawMatch = {
  match_id?: string | number;
  title?: string;
  short_title?: string;
  match_number?: string | number;
  status_str?: string;
  status_note?: string;
  date_start_ist?: string;
  teama_team_id?: string | number;
  teama_name?: RawMaybeText;
  teama_short_name?: RawMaybeText;
  teama_logo_url?: string;
  teama_scores?: string;
  teama_overs?: string;
  teamb_team_id?: string | number;
  teamb_name?: RawMaybeText;
  teamb_short_name?: RawMaybeText;
  teamb_logo_url?: string;
  teamb_scores?: string;
  teamb_overs?: string;
  result?: string;
  winning_team_id?: string | number;
  venue_name?: string;
  venue_location?: string;
  toss_text?: string;
};

export type MatchCard = {
  match_id: string;
  title: string;
  short_title: string;
  match_number: string;
  status_str: string;
  status_note: string;
  date_start_ist: string;
  teama_team_id: string;
  teama_name: string;
  teama_short_name: string;
  teama_logo_url: string;
  teama_scores: string;
  teama_overs: string;
  teamb_team_id: string;
  teamb_name: string;
  teamb_short_name: string;
  teamb_logo_url: string;
  teamb_scores: string;
  teamb_overs: string;
  result: string;
  winning_team_id: string;
  venue_name: string;
  venue_location: string;
  toss_text: string;
};

function textValue(value: RawMaybeText, fallback = ""): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return fallback;

  const fromKeys = [value.name, value.short_name, value.title, value.value].find(
    (item) => typeof item === "string" && item.trim().length > 0
  );

  return typeof fromKeys === "string" ? fromKeys : fallback;
}

function normalizeMatchCard(raw: RawMatch): MatchCard {
  const shortTitle = textValue(raw.short_title, "TBD vs TBD");
  const teamsFromShort = shortTitle.split(" vs ");

  const teamAFallback = teamsFromShort[0] ?? "TBD";
  const teamBFallback = teamsFromShort[1] ?? "TBD";

  return {
    match_id: String(raw.match_id ?? ""),
    title: textValue(raw.title, shortTitle),
    short_title: shortTitle,
    match_number: String(raw.match_number ?? ""),
    status_str: textValue(raw.status_str, "Upcoming"),
    status_note: textValue(raw.status_note),
    date_start_ist: textValue(raw.date_start_ist),
    teama_team_id: String(raw.teama_team_id ?? ""),
    teama_name: textValue(raw.teama_name, teamAFallback),
    teama_short_name: textValue(raw.teama_short_name, teamAFallback),
    teama_logo_url: textValue(raw.teama_logo_url),
    teama_scores: textValue(raw.teama_scores),
    teama_overs: textValue(raw.teama_overs),
    teamb_team_id: String(raw.teamb_team_id ?? ""),
    teamb_name: textValue(raw.teamb_name, teamBFallback),
    teamb_short_name: textValue(raw.teamb_short_name, teamBFallback),
    teamb_logo_url: textValue(raw.teamb_logo_url),
    teamb_scores: textValue(raw.teamb_scores),
    teamb_overs: textValue(raw.teamb_overs),
    result: textValue(raw.result),
    winning_team_id: String(raw.winning_team_id ?? ""),
    venue_name: textValue(raw.venue_name),
    venue_location: textValue(raw.venue_location),
    toss_text: textValue(raw.toss_text),
  };
}

export async function GET() {
  try {
    const response = await fetch(
      "https://cricket-live-line-advance.p.rapidapi.com/competitions/129908/matches?paged=1&per_page=20",
      {
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY || "",
          "x-rapidapi-host": "cricket-live-line-advance.p.rapidapi.com",
        },
        cache: "no-store",
      }
    );

    const data = await response.json();
    const items = data?.response?.items || [];

    const matches: MatchCard[] = items.map((m: RawMatch) => normalizeMatchCard(m));

    return NextResponse.json(matches);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
}
