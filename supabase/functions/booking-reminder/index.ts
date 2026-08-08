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

    // Find upcoming bookings starting in the next 2 hours that haven't received a reminder
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const { data: upcomingBookings, error } = await supabase
      .from("bookings")
      .select("*, customers(*, user_profiles(*)), venues(*)")
      .eq("booking_status", "confirmed")
      .gte("start_time", now.toISOString())
      .lte("start_time", twoHoursLater.toISOString())
      .is("deleted_at", null);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    let remindersSent = 0;

    for (const booking of upcomingBookings || []) {
      const profile = booking.customers?.user_profiles;
      if (!profile) continue;

      // Queue WhatsApp Reminder if phone exists
      if (profile.phone) {
        await supabase.rpc("enqueue_notification", {
          p_recipient: profile.phone,
          p_channel: "whatsapp",
          p_template_code: "BOOKING_REMINDER_WHATSAPP",
          p_payload: {
            customer_name: profile.full_name,
            booking_number: booking.booking_number,
            venue_name: booking.venues.name,
            start_time: booking.start_time,
          },
        });
        remindersSent++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, reminders_queued: remindersSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
