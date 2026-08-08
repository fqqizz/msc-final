import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const interaktApiKey = Deno.env.get("INTERAKT_API_KEY");
    const { recipient, template_code, payload } = await req.json();

    if (!recipient) {
      return new Response(JSON.stringify({ error: "recipient phone is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!interaktApiKey) {
      // Log mode if API key not set in env
      console.log(`[SIMULATED WHATSAPP] To: ${recipient}, Template: ${template_code}, Payload:`, payload);
      return new Response(
        JSON.stringify({ success: true, simulated: true, recipient }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Call Interakt WhatsApp API
    const response = await fetch("https://api.interakt.ai/v1/public/message/", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${interaktApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        countryCode: "+91",
        phoneNumber: recipient.replace(/^\+91/, "").trim(),
        type: "Template",
        template: {
          name: template_code.toLowerCase(),
          languageCode: "en",
          bodyValues: Object.values(payload || {}).map((val) => String(val)),
        },
      }),
    });

    const resData = await response.json();

    return new Response(JSON.stringify({ success: response.ok, response: resData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: response.status,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
