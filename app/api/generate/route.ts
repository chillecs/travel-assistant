import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const budgetOptions = ["Economy", "Standard", "Luxury"] as const;

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI key is not configured." },
        { status: 500 },
      );
    }

    const body = await request.json().catch(() => null);
    const destination =
      typeof body?.destination === "string" ? body.destination.trim() : "";
    const duration = Number(body?.duration);
    const budget = body?.budget;

    if (!destination || !Number.isFinite(duration) || duration < 1) {
      return NextResponse.json(
        { error: "Please provide a destination and duration." },
        { status: 400 },
      );
    }

    if (!budgetOptions.includes(budget)) {
      return NextResponse.json(
        { error: "Please select a valid budget tier." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Please login to generate itineraries." },
        { status: 401 },
      );
    }

    const systemPrompt =
      "You are a professional travel planner. Return ONLY a JSON object. No prose, no markdown blocks.";

    const userPrompt = `
Destination: ${destination}
Duration: ${duration} days
Budget: ${budget}

Return a JSON object that strictly matches this schema:
{
  "tripName": "string",
  "days": [
    {
      "day": 1,
      "theme": "string",
      "activities": [
        { "time": "string", "description": "string", "location": "string", "estimatedCost": "string" }
      ]
    }
  ]
}

Rules:
- Generate exactly ${duration} day objects.
- Include 3-5 activities per day.
- Use concise, premium-sounding activity descriptions.
- Keep estimatedCost as a short string (ex: "$18", "Free", "$45-60").
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "We couldn't generate your itinerary. Please try again." },
        { status: 502 },
      );
    }

    let itineraryData: unknown;
    try {
      itineraryData = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: "We received an invalid response. Please try again." },
        { status: 502 },
      );
    }

    const { data: savedItinerary, error: insertError } = await supabase
      .from("itineraries")
      .insert({
        user_id: user.id,
        destination,
        itinerary_data: itineraryData,
      })
      .select("id, created_at")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to save your itinerary. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      itinerary: itineraryData,
      itineraryId: savedItinerary.id,
      createdAt: savedItinerary.created_at,
    });
  } catch (error: unknown) {
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? Number((error as { status?: number }).status)
        : undefined;

    const friendlyMessage =
      status === 429
        ? "We're receiving too many requests. Please try again in a moment."
        : status === 503 || status === 504
          ? "The AI service is taking too long. Please try again."
          : "We couldn't generate your itinerary right now. Please try again.";

    return NextResponse.json(
      { error: friendlyMessage },
      { status: status && status >= 400 ? status : 500 },
    );
  }
}
