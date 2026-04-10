const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEAM_NAME = "Slama Jama Gröbenzell";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { liga_id } = await req.json();

    if (!liga_id) {
      return new Response(
        JSON.stringify({ error: "liga_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = `https://www.basketball-bund.net/public/spielplan_list.jsp?print=1&viewDescKey=sport.dbb.liga.SpielplanViewPublic/index.jsp_&liga_id=${liga_id}`;
    console.log("Fetching DBB schedule:", url);

    const response = await fetch(url);
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `DBB returned status ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await response.text();

    // Parse rows: each game is in a <tr> with sportItemEven or sportItemOdd cells
    const games: Array<{
      date: string;
      time: string;
      home: string;
      away: string;
      venue: string;
      is_home: boolean;
      opponent: string;
    }> = [];

    // Match each table row containing game data
    const rowRegex = /<tr>\s*<td class="sportItem(?:Even|Odd)"[^>]*>[\s\S]*?<\/tr>/g;
    let match;

    while ((match = rowRegex.exec(html)) !== null) {
      const row = match[0];

      // Extract all <td> contents
      const cellRegex = /<td class="sportItem(?:Even|Odd)"[^>]*>([\s\S]*?)<\/td>/g;
      const cells: string[] = [];
      let cellMatch;
      while ((cellMatch = cellRegex.exec(row)) !== null) {
        // Strip HTML tags and trim
        const text = cellMatch[1].replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
        cells.push(text);
      }

      // cells: [Nr, Tag, Datum+Zeit, Heim, Gast, Spielhalle, ...]
      if (cells.length < 6) continue;

      const dateTimeStr = cells[2]; // e.g. "19.04.2026 13:00"
      const home = cells[3];
      const away = cells[4];
      const venue = cells[5];

      // Check if Slama Jama is involved
      const isHome = home.includes(TEAM_NAME);
      const isAway = away.includes(TEAM_NAME);
      if (!isHome && !isAway) continue;

      // Parse date and time
      const dtMatch = dateTimeStr.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}:\d{2})/);
      if (!dtMatch) continue;

      const isoDate = `${dtMatch[3]}-${dtMatch[2]}-${dtMatch[1]}`; // YYYY-MM-DD
      const time = dtMatch[4]; // HH:MM

      games.push({
        date: isoDate,
        time,
        home,
        away,
        venue,
        is_home: isHome,
        opponent: isHome ? away : home,
      });
    }

    console.log(`Found ${games.length} games for ${TEAM_NAME}`);

    return new Response(
      JSON.stringify({ success: true, games }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
