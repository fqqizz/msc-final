import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch pending notification queue items
    const { data: queueItems, error } = await supabase
      .from("notification_queue")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString())
      .limit(20);

    if (error) {
      return new Response(JSON.stringify({ error }), { status: 500 });
    }

    let processedCount = 0;

    for (const item of queueItems || []) {
      // Mark as processing
      await supabase.from("notification_queue").update({ status: "processing" }).eq("id", item.id);

      try {
        let endpoint = "email-notification";
        if (item.channel === "whatsapp") {
          endpoint = "whatsapp-notification";
        }

        const res = await fetch(`${supabaseUrl}/functions/v1/${endpoint}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipient: item.recipient,
            subject: item.subject,
            payload: item.payload,
            body_html: item.body,
          }),
        });

        if (res.ok) {
          await supabase
            .from("notification_queue")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", item.id);

          await supabase.from("notification_logs").insert({
            queue_id: item.id,
            recipient: item.recipient,
            channel: item.channel,
            gateway_provider: item.channel === "whatsapp" ? "Interakt" : "Resend",
            status: "delivered",
          });

          processedCount++;
        } else {
          const errText = await res.text();
          const newRetry = item.retry_count + 1;
          await supabase
            .from("notification_queue")
            .update({
              status: newRetry >= item.max_retries ? "failed" : "pending",
              retry_count: newRetry,
              error_log: errText,
            })
            .eq("id", item.id);
        }
      } catch (err: any) {
        await supabase
          .from("notification_queue")
          .update({ status: "failed", error_log: err.message })
          .eq("id", item.id);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed_count: processedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
