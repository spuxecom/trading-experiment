import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const TICKERS = ['AMD', 'GOOGL', 'AMZN', 'PLTR', 'BOTZ', 'AIAI'];

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const prices: Record<string, number> = {
      IWDA: 112.80 // Manual for European ETF
    };

    // Fetch all tickers in parallel from Yahoo Finance
    const promises = TICKERS.map(async (ticker) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
        const response = await fetch(url);
        const data = await response.json();
        const price = data.chart.result[0].meta.regularMarketPrice;
        return { ticker, price };
      } catch (e) {
        console.error(`Failed to fetch ${ticker}:`, e);
        return { ticker, price: null };
      }
    });

    const results = await Promise.all(promises);
    results.forEach(({ ticker, price }) => {
      if (price) prices[ticker] = price;
    });

    return new Response(
      JSON.stringify({ 
        prices, 
        timestamp: new Date().toISOString(),
        success: true 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        success: false 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
