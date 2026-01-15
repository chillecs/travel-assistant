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
    const destination =
      typeof body?.destination === "string" ? body.destination.trim() : "";
    const duration = Number(body?.duration);
    const interests =
      typeof body?.interests === "string" ? body.interests.trim() : "";

    if (!destination || !Number.isFinite(duration) || duration < 1) {
      return NextResponse.json(
        { error: "Please provide a destination and duration." },
        { status: 400 },
      );
    }

    if (!interests) {
      return NextResponse.json(
        { error: "Please provide your interests." },
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
      `You are a travel assistant. 
CRITICAL RULE: Since you do not have real-time internet access, avoid recommending specific new or trendy restaurants that might have closed. 
Instead, recommend:
1. Historic, legendary places (that have existed for 50+ years).
2. General areas (e.g., "Dining in the Lipscani District").
3. Or clearly state "A highly-rated restaurant such as [Name]".
4. Do still say the street these locations are on.
5. Just try to avoid recommending specific new or trendy locations that might have closed. Only recommend locations that have existed for a long time.

Always prioritize generic activity descriptions over risky specific locations.
Return ONLY JSON.`;

    const userPrompt = `
Destination: ${destination}
Duration: ${duration} days
Interests: ${interests}

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
- Focus on the user's interests: ${interests}
- Use concise, premium-sounding activity descriptions.
- Keep estimatedCost as a short string (ex: "$18", "Free", "$45-60").
- Create a cohesive itinerary that matches their interests throughout the trip.
`;

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
      // Handle OpenAI API errors specifically
      // OpenAI SDK errors can have different structures
      let status: number | undefined;
      let errorMessage = "Unknown error";
      
      if (openaiError && typeof openaiError === "object") {
        // Check for status directly
        if ("status" in openaiError) {
          status = Number((openaiError as { status?: number }).status);
        }
        // Check for status in response (OpenAI SDK format)
        else if ("response" in openaiError) {
          const response = (openaiError as { response?: { status?: number } }).response;
          status = response?.status;
        }
        // Check for statusCode (alternative format)
        else if ("statusCode" in openaiError) {
          status = Number((openaiError as { statusCode?: number }).statusCode);
        }
        // Check error property (some SDKs wrap it)
        else if ("error" in openaiError) {
          const error = (openaiError as { error?: { status?: number; message?: string } }).error;
          status = error?.status;
          errorMessage = error?.message || errorMessage;
        }
      }
      
      if (openaiError instanceof Error) {
        errorMessage = openaiError.message;
      }

      // Only return 429 if we're CERTAIN it's a 429 from OpenAI
      if (status === 429) {
        // Check if it's a quota/credit issue
        const errorMsg = errorMessage.toLowerCase();
        const isQuotaError = 
          errorMsg.includes("quota") || 
          errorMsg.includes("insufficient") || 
          errorMsg.includes("billing") ||
          errorMsg.includes("credit");
        
        return NextResponse.json(
          {
            error: isQuotaError
              ? "OpenAI API credits have been exhausted. Please add credits to your OpenAI account and try again."
              : "We're receiving too many requests right now. Please wait a moment and try again.",
          },
          { status: 429 },
        );
      }
      if (status === 503 || status === 504) {
        return NextResponse.json(
          {
            error:
              "The AI service is temporarily unavailable. Please try again in a moment.",
          },
          { status: status },
        );
      }
      
      // If we don't have a clear status, don't assume it's 429
      // Re-throw to be caught by outer catch
      throw openaiError;
    }

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

    // Try to save to database, but don't fail if it doesn't work
    let savedItinerary = null;
    const { data: savedData, error: insertError } = await supabase
      .from("itineraries")
      .insert({
        user_id: user.id,
        destination,
        itinerary_data: itineraryData,
      })
      .select("id, created_at")
      .single();

    if (insertError) {
      // Log the error for debugging
      console.error("Database save error:", {
        error: insertError,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      });
      
      // Check if it's a table doesn't exist error
      const isTableMissing = 
        insertError.message?.toLowerCase().includes("relation") ||
        insertError.message?.toLowerCase().includes("does not exist") ||
        insertError.code === "42P01";
      
      const saveErrorMessage = isTableMissing
        ? "Itinerary generated successfully, but the database table doesn't exist. Please create the 'itineraries' table in your Supabase database."
        : "Itinerary generated successfully, but couldn't be saved to your account. You can still view and use it below.";
      
      // Still return the itinerary even if save fails
      // The user can still see and use it
      return NextResponse.json({
        itinerary: itineraryData,
        itineraryId: null,
        createdAt: null,
        saveError: saveErrorMessage,
      });
    }

    savedItinerary = savedData;

    return NextResponse.json({
      itinerary: itineraryData,
      itineraryId: savedItinerary?.id ?? null,
      createdAt: savedItinerary?.created_at ?? null,
    });
  } catch (error: unknown) {

    // Check if it's an OpenAI error with status
    let status: number | undefined;
    if (error && typeof error === "object") {
      if ("status" in error) {
        status = Number((error as { status?: number }).status);
      } else if ("response" in error) {
        const response = (error as { response?: { status?: number } }).response;
        status = response?.status;
      } else if ("statusCode" in error) {
        status = Number((error as { statusCode?: number }).statusCode);
      }
    }

    // If we still don't have a status, check error message for rate limit indicators
    if (!status && error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes("429") || errorMsg.includes("rate limit") || errorMsg.includes("too many requests")) {
        status = 429;
      }
    }

    const friendlyMessage =
      status === 429
        ? "We're receiving too many requests right now. Please wait a moment and try again."
        : status === 503 || status === 504
          ? "The AI service is temporarily unavailable. Please try again in a moment."
          : status === 401 || status === 403
            ? "API authentication failed. Please contact support."
            : "We couldn't generate your itinerary right now. Please try again.";

    return NextResponse.json(
      { error: friendlyMessage },
      { status: status && status >= 400 ? status : 500 },
    );
  }
}
