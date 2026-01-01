import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: any;

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

serve(async (req) => {
  // 1. Handle CORS Preflight (Browser Security Handshake)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, html, from }: EmailRequest = await req.json();

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set in Supabase Secrets.");
    }

    // 2. Call Resend API
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        // Use verified domain or fallback to Resend testing domain if key is missing
        from: from || "VJN System <notifications@amatsinda.vjn.org.rw>",
        to: to,
        subject: subject,
        html: html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
        console.error("Resend API Error:", data);
        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: res.status,
        });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});