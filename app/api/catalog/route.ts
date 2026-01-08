import characters from "@/app/data/characters.json";
import universes from "@/app/data/universes.json";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ characters, universes });
}
