import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Verify that user has valid participant_id cookie
    const cookieStore = await cookies();
    const participantId = cookieStore.get("participant_id")?.value;

    if (!participantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Verify that the participant_id in request matches the cookie
    if (body.id !== participantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const googleUrl = process.env.GOOGLE_URL;
    const googleSecret = process.env.GOOGLE_SECRET;

    if (!googleUrl || !googleSecret) {
      return NextResponse.json(
        { error: "Google Sheets not configured" },
        { status: 500 }
      );
    }

    // Prepare data with secret for Google Sheets
    const googleData = {
      ...body,
      secret: googleSecret,
    };

    // Forward request to Google Sheets
    const response = await fetch(googleUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(googleData),
    });

    if (!response.ok) {
      console.error(
        "Google Sheets API error:",
        response.status,
        await response.text()
      );
      return NextResponse.json(
        { error: "Failed to update Google Sheets" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Google Sheets route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
