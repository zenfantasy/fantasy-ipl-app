import Link from "next/link";
import { headers } from "next/headers";
import CountdownTimer from "./CountdownTimer";

type MatchCard = {
  match_id: string;
  short_title: string;
  status_str: string;
  status_note: string;
  date_start_ist: string;
  teama_name: string;
  teama_scores: string;
  teama_overs: string;
  teamb_name: string;
  teamb_scores: string;
  teamb_overs: string;
  venue_name: string;
  venue_location: string;
  toss_text: string;
  result: string;
};

type MatchBucket = "live" | "upcoming" | "completed";

function toBucket(match: MatchCard): MatchBucket {
  const status = `${match.status_str} ${match.status_note}`.toLowerCase();

  if (status.includes("live") || status.includes("in progress") || status.includes("innings break")) {
    return "live";
  }

  if (status.includes("complete") || status.includes("won") || Boolean(match.result)) {
    return "completed";
  }

  return "upcoming";
}

function scoreText(score: string, overs: string): string {
  if (!score) return "Yet to bat";
  if (!overs) return score;
  return `${score} (${overs})`;
}

function MatchRow({ match, label, showTimer = false }: { match: MatchCard; label: string; showTimer?: boolean }) {
  return (
    <Link href={`/match/${match.match_id}`}>
      <div className="bg-white rounded-2xl p-5 border cursor-pointer space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="font-medium">{match.teama_name} vs {match.teamb_name}</div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>

        <div className="text-xs text-gray-500">
          {match.teama_name}: {scoreText(match.teama_scores, match.teama_overs)}
        </div>
        <div className="text-xs text-gray-500">
          {match.teamb_name}: {scoreText(match.teamb_scores, match.teamb_overs)}
        </div>

        {(match.venue_name || match.venue_location) && (
          <div className="text-xs text-gray-400">
            {match.venue_name}
            {match.venue_name && match.venue_location ? " · " : ""}
            {match.venue_location}
          </div>
        )}

        {match.toss_text && <div className="text-xs text-gray-400">{match.toss_text}</div>}
        {match.result && <div className="text-xs text-green-700">{match.result}</div>}

        <div className="text-sm text-gray-600">
          {showTimer ? (
            <CountdownTimer startTime={match.date_start_ist} fallback="Starts soon" />
          ) : (
            match.status_note || match.status_str
          )}
        </div>
      </div>
    </Link>
  );
}

export default async function MatchesPage() {
  const headerStore = await headers();
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const host = headerStore.get("host") ?? "localhost:3000";

  const res = await fetch(`${protocol}://${host}/api/matches`, {
    cache: "no-store",
  });

  const matches: MatchCard[] = res.ok ? await res.json() : [];

  const live = matches.filter((m) => toBucket(m) === "live");
  const completed = matches.filter((m) => toBucket(m) === "completed");
  const upcoming = matches
    .filter((m) => toBucket(m) === "upcoming")
    .sort((a, b) => new Date(a.date_start_ist).getTime() - new Date(b.date_start_ist).getTime());

  const nextMatch = upcoming[0];
  const futureUpcoming = upcoming.slice(1);

  return (
    <main className="min-h-screen bg-[#f7f7f5] p-4 text-gray-800">
      <div className="max-w-md mx-auto space-y-8">
        <h1 className="text-xl font-semibold">Fantasy IPL</h1>

        {nextMatch && (
          <section className="space-y-2">
            <div className="text-xs text-gray-400">Next Match</div>
            <MatchRow match={nextMatch} label="Scheduled" showTimer />
          </section>
        )}

        <section className="space-y-3">
          <div className="text-xs text-gray-400">Upcoming</div>
          {futureUpcoming.length === 0 && <div className="text-sm text-gray-400">No additional upcoming matches.</div>}
          {futureUpcoming.map((match) => (
            <MatchRow key={match.match_id} match={match} label="Scheduled" showTimer />
          ))}
        </section>

        <section className="space-y-3">
          <div className="text-xs text-gray-400">Live</div>
          {live.length === 0 && <div className="text-sm text-gray-400">No live matches right now.</div>}
          {live.map((match) => (
            <MatchRow key={match.match_id} match={match} label="Live" />
          ))}
        </section>

        <section className="space-y-3">
          <div className="text-xs text-gray-400">Completed</div>
          {completed.length === 0 && <div className="text-sm text-gray-400">No completed matches yet.</div>}
          {completed.map((match) => (
            <MatchRow key={match.match_id} match={match} label="Completed" />
          ))}
        </section>
      </div>
    </main>
  );
}
