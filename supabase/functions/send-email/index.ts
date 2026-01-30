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

    const recipients = Array.isArray(to) ? to : [to];
    if (recipients.length === 0) {
      throw new Error("No recipients provided.");
    }

    const fromAddress = from || "VJN System <notifications@amatsinda.vjn.org.rw>";
    const results: { to: string; id?: string; error?: string }[] = [];

    for (const email of recipients) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: fromAddress,
          to: email,
          subject: subject,
          html: html,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Resend API Error for", email, data);
        return new Response(
          JSON.stringify({ error: data.message || data.error || "Email delivery failed", details: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: res.status }
        );
      }
      results.push({ to: email, id: data.id });
    }

    return new Response(
      JSON.stringify({ success: true, sent: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});