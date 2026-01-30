/**
 * Keep-alive Edge Function: runs a trivial DB query to prevent Supabase project
 * from going to sleep after long inactivity. Invoke weekly via cron (e.g. GitHub Actions).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Minimal query to wake the database (use any table you have)
    const { error } = await supabase.from("groups").select("id").limit(1).maybeSingle();
    if (error) {
      // Fallback: try users or any table; keeps project active even if table name differs
      await supabase.from("users").select("id").limit(1).maybeSingle();
    }

    return new Response(
      JSON.stringify({ ok: true, at: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, error: e?.message ?? "Unknown" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
