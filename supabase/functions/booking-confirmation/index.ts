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

    const { booking_id } = await req.json();

    if (!booking_id) {
      return new Response(JSON.stringify({ error: "booking_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch booking with customer and venue info
    const { data: booking, error: fetchErr } = await supabase
      .from("bookings")
      .select("*, customers(*, user_profiles(*)), venues(*)")
      .eq("id", booking_id)
      .single();

    if (fetchErr || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found", details: fetchErr }), {
        status: 444,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerProfile = booking.customers?.user_profiles;
    const phone = customerProfile?.phone;
    const email = customerProfile?.email;

    // Trigger WhatsApp Edge Function if phone exists
    if (phone) {
      await fetch(`${supabaseUrl}/functions/v1/whatsapp-notification`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: phone,
          template_code: "BOOKING_CONFIRMATION_WHATSAPP",
          payload: {
            customer_name: customerProfile.full_name,
            booking_number: booking.booking_number,
            venue_name: booking.venues.name,
            start_time: booking.start_time,
            total_amount: booking.total_amount,
          },
        }),
      });
    }

    // Trigger Email Edge Function if email exists
    if (email) {
      await fetch(`${supabaseUrl}/functions/v1/email-notification`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: email,
          subject: `Booking Confirmed: ${booking.booking_number}`,
          payload: {
            customer_name: customerProfile.full_name,
            booking_number: booking.booking_number,
            venue_name: booking.venues.name,
            start_time: booking.start_time,
            total_amount: booking.total_amount,
          },
        }),
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Booking confirmation dispatched." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
