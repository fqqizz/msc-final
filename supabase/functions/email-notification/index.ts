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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const { recipient, subject, payload, body_html } = await req.json();

    if (!recipient) {
      return new Response(JSON.stringify({ error: "recipient email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!resendApiKey) {
      console.log(`[SIMULATED EMAIL] To: ${recipient}, Subject: ${subject}`);
      return new Response(
        JSON.stringify({ success: true, simulated: true, recipient }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const htmlContent = body_html || `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Maqbool Sports Complex</h2>
        <p>Dear ${payload?.customer_name || "Valued Customer"},</p>
        <p>Your booking <strong>${payload?.booking_number}</strong> at <strong>${payload?.venue_name}</strong> is confirmed.</p>
        <p><strong>Total Paid:</strong> ₹${payload?.total_amount}</p>
        <hr/>
        <p>Thank you for choosing Maqbool Sports Complex!</p>
      </div>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MSC OS <notifications@maqboolsports.com>",
        to: [recipient],
        subject: subject || "Maqbool Sports Complex Notification",
        html: htmlContent,
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
