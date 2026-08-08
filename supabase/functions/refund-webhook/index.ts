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

    const body = await req.json();
    const event = body.event;

    if (event === "refund.processed" || event === "refund.speed_processed") {
      const refundEntity = body.payload.refund.entity;
      const razorpayPaymentId = refundEntity.payment_id;
      const razorpayRefundId = refundEntity.id;
      const amountInRupees = refundEntity.amount / 100;

      // Update refund record status
      await supabase
        .from("refunds")
        .update({
          status: "processed",
          razorpay_refund_id: razorpayRefundId,
        })
        .eq("razorpay_refund_id", razorpayRefundId);

      // Update payment status
      await supabase
        .from("payments")
        .update({ status: "refunded" })
        .eq("razorpay_payment_id", razorpayPaymentId);
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
