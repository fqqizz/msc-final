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
    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const event = body.event;
    const paymentEntity = body.payload?.payment?.entity;

    if (event === "payment.captured" && paymentEntity) {
      const bookingId = paymentEntity.notes?.booking_id;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      const amountInRupees = paymentEntity.amount / 100;
      const method = paymentEntity.method || "upi";

      if (bookingId) {
        // Execute Database RPC to capture payment and generate invoice
        const { data, error } = await supabase.rpc("process_payment_callback", {
          p_booking_id: bookingId,
          p_razorpay_order_id: orderId,
          p_razorpay_payment_id: paymentId,
          p_razorpay_signature: "webhook_verified",
          p_payment_method: method.toLowerCase(),
          p_amount: amountInRupees,
          p_raw_response: paymentEntity,
        });

        if (error) {
          console.error("RPC Error processing payment callback:", error);
        } else {
          // Trigger confirmation notifications and receipt PDF builder
          await fetch(`${supabaseUrl}/functions/v1/booking-confirmation`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ booking_id: bookingId }),
          });

          await fetch(`${supabaseUrl}/functions/v1/receipt-generation`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ booking_id: bookingId }),
          });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
