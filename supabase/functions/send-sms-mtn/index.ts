
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Edge Function to securely handle MTN Rwanda SMS API credentials
// This file runs on the server (Deno Runtime)

declare const Deno: any;

const MTN_CLIENT_ID = Deno.env.get("MTN_CLIENT_ID");
const MTN_CLIENT_SECRET = Deno.env.get("MTN_CLIENT_SECRET");
const MTN_SUBSCRIPTION_KEY = Deno.env.get("MTN_SUBSCRIPTION_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SMSPayload {
  recipient: string; // MSISDN: 2507XXXXXXXX
  message: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { recipient, message }: SMSPayload = await req.json();

    if (!MTN_CLIENT_ID || !MTN_CLIENT_SECRET || !MTN_SUBSCRIPTION_KEY) {
      throw new Error("Missing MTN Credentials in Secrets");
    }

    // 1. Get Access Token (Basic Auth with Client ID/Secret)
    const authString = btoa(`${MTN_CLIENT_ID}:${MTN_CLIENT_SECRET}`);
    const tokenRes = await fetch("https://sandbox.momodeveloper.mtn.com/collection/token/", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authString}`,
        "Ocp-Apim-Subscription-Key": MTN_SUBSCRIPTION_KEY,
      },
    });

    if (!tokenRes.ok) {
        const err = await tokenRes.text();
        throw new Error(`MTN Token Failed: ${err}`);
    }

    const { access_token } = await tokenRes.json();

    // 2. Send SMS (Simulated URL for standard SMS gateway structure, often distinct from MoMo)
    // MTN often uses partners or a specific SMS API endpoint. Adjust URL below to specific contract.
    const smsRes = await fetch("https://api.mtn.rw/sms/v1/send", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${access_token}`,
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": MTN_SUBSCRIPTION_KEY
        },
        body: JSON.stringify({
            msisdn: recipient,
            message: message,
            sender: "VJN GSLA"
        })
    });

    // In Sandbox, this might not actually send but returns OK.
    const result = await smsRes.json();

    return new Response(JSON.stringify(result), {
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
