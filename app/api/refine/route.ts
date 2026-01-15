import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI key is not configured." },
        { status: 500 },
      );
    }

    const body = await request.json().catch(() => null);
    const tripId = body?.tripId;
    const userMessage = typeof body?.message === "string" ? body.message.trim() : "";
    const currentItinerary = body?.currentItinerary;

    if (!tripId || !userMessage || !currentItinerary) {
      return NextResponse.json(
        { error: "Please provide trip ID, message, and current itinerary." },
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
        { error: "Please login to refine itineraries." },
        { status: 401 },
      );
    }

    // Verify trip belongs to user
    const { data: trip, error: tripError } = await supabase
      .from("itineraries")
      .select("id, itinerary_data, history, destination, duration, travel_style, pace, transport, dietary_restrictions, interests")
      .eq("id", tripId)
      .eq("user_id", user.id)
      .single();

    if (tripError || !trip) {
      return NextResponse.json(
        { error: "Trip not found or access denied." },
        { status: 404 },
      );
    }

    const systemPrompt = `You are a travel assistant helping to refine an existing itinerary.
CRITICAL RULE: Since you do not have real-time internet access, avoid recommending specific new or trendy restaurants that might have closed.
Instead, recommend:
1. Historic, legendary places (that have existed for 50+ years).
2. General areas (e.g., "Dining in the Lipscani District").
3. Or clearly state "A highly-rated restaurant such as [Name]".
4. Do still say the street these locations are on.
5. Just try to avoid recommending specific new or trendy locations that might have closed.

When the user says a location is closed, replace it with an alternative that fits the same theme/area.
Always prioritize generic activity descriptions over risky specific locations.
Return ONLY JSON in the same schema as the original itinerary.`;

    // Check if the message seems unclear or nonsensical
    const unclearIndicators = [
      /^[^a-zA-Z]*$/, // Only special characters/numbers
      /^(.)\1{10,}$/, // Repeated single character
      /^.{1,2}$/, // Very short (1-2 chars)
    ];
    
    const isUnclear = unclearIndicators.some(pattern => pattern.test(userMessage)) ||
      userMessage.split(/\s+/).length < 2; // Less than 2 words
    
    if (isUnclear) {
      return NextResponse.json(
        { 
          error: "I didn't understand your request. Please provide a clear instruction.",
          unclearInput: true
        },
        { status: 400 },
      );
    }

    const userPrompt = `Current Itinerary (JSON):
${JSON.stringify(currentItinerary, null, 2)}

User Request: ${userMessage}

Update the itinerary according to the user's request. Maintain the same JSON structure.
If the user mentions a location is closed, replace it with a similar alternative in the same area.
Keep the same number of days and maintain the overall structure.
If the user's request is unclear or doesn't make sense, return a JSON with "error": "unclear_request" instead of the itinerary.
Return the COMPLETE updated itinerary as JSON.`;

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });
    } catch (openaiError: unknown) {
      let status: number | undefined;
      if (openaiError && typeof openaiError === "object") {
        if ("status" in openaiError) {
          status = Number((openaiError as { status?: number }).status);
        } else if ("response" in openaiError) {
          const response = (openaiError as { response?: { status?: number } }).response;
          status = response?.status;
        }
      }

      if (status === 429) {
        return NextResponse.json(
          {
            error: "We're receiving too many requests right now. Please wait a moment and try again.",
          },
          { status: 429 },
        );
      }
      throw openaiError;
    }

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "We couldn't refine your itinerary. Please try again." },
        { status: 502 },
      );
    }

    let updatedItinerary: unknown;
    try {
      updatedItinerary = JSON.parse(content);
      
      // Check if AI returned an error indicating unclear request
      const parsed = updatedItinerary as { error?: string; tripName?: string; days?: unknown[] };
      if (parsed.error === "unclear_request" || !parsed.tripName || !parsed.days) {
        return NextResponse.json(
          { 
            error: "I didn't understand your request. Please try rephrasing it more clearly.",
            unclearInput: true
          },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        { 
          error: "I didn't understand your request. Please try rephrasing it more clearly.",
          unclearInput: true
        },
        { status: 400 },
      );
    }

    // Save updated itinerary to history
    const history = Array.isArray(trip.history) ? trip.history : [];
    const updatedHistory = [...history, trip.itinerary_data];

    const { data: updatedTrip, error: updateError } = await supabase
      .from("itineraries")
      .update({
        itinerary_data: updatedItinerary,
        history: updatedHistory,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tripId)
      .eq("user_id", user.id)
      .select("id, updated_at")
      .single();

    if (updateError) {
      console.error("Database update error:", updateError);
      // Still return the updated itinerary even if save fails
      return NextResponse.json({
        itinerary: updatedItinerary,
        itineraryId: tripId,
        saveError: "Itinerary refined successfully, but couldn't be saved.",
      });
    }

    return NextResponse.json({
      itinerary: updatedItinerary,
      itineraryId: updatedTrip?.id ?? tripId,
      updatedAt: updatedTrip?.updated_at ?? null,
    });
  } catch (error: unknown) {
    console.error("Refine API Error:", error);
    return NextResponse.json(
      { error: "We couldn't refine your itinerary right now. Please try again." },
      { status: 500 },
    );
  }
}
