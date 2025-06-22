import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "general";
  const finnhubToken = process.env.FINNHUB_API_KEY || "crb0srhr01qo7cafjasgcrb0srhr01qo7cafjat0";

  const url = `https://finnhub.io/api/v1/news?category=${category}&token=${finnhubToken}`;

  try {
    const response = await fetch(url, {
      next: {
        revalidate: 3600, // Revalidate every hour
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Finnhub API error:", errorData);
      return NextResponse.json({ error: "Failed to fetch news from Finnhub" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 