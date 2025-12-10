import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  try {
    // In a real application, you would fetch from a market data API
    // For demo purposes, we'll generate a realistic price based on the symbol
    
    // Simple hash function to generate deterministic "prices" for demo
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      const char = symbol.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Generate a base price based on the hash
    const basePrice = Math.abs(hash) % 100000 / 1000;
    
    // Add some randomness but keep it deterministic for the same symbol
    const randomFactor = (Math.abs(hash) % 100) / 1000;
    const price = basePrice * (0.95 + randomFactor);
    
    return NextResponse.json({ 
      symbol,
      price: parseFloat(price.toFixed(5)),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching market price:", error);
    return NextResponse.json({ error: "Failed to fetch price" }, { status: 500 });
  }
}