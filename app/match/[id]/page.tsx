"use client";

import { useParams } from "next/navigation";

export default function MatchPage() {
  const params = useParams();
  const matchId = params.id;

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-gray-800 p-4">
      <div className="max-w-md mx-auto">

        <h1 className="text-xl font-semibold mb-4">
          Team Builder
        </h1>

        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <p className="text-sm text-gray-500">
            Match ID: {matchId}
          </p>

          <p className="mt-4">
            Team selection coming next...
          </p>
        </div>

      </div>
    </main>
  );
}