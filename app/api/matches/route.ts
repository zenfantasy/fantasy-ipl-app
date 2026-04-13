import { NextResponse } from "next/server";
import { fetchMatchesFromApi } from "@/lib/matches";

export async function GET() {
  try {
    const matches = await fetchMatchesFromApi();
    return NextResponse.json(matches);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
}
