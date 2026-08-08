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

    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .select("*, bookings(*, customers(*, user_profiles(*)), venues(*))")
      .eq("booking_id", booking_id)
      .single();

    if (invErr || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice record not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: sans-serif; padding: 40px; }
          .header { text-align: center; border-bottom: 2px solid #22c55e; padding-bottom: 20px; }
          .details { margin-top: 30px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .table th, .table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          .total { font-weight: bold; font-size: 1.2em; text-align: right; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MAQBOOL SPORTS COMPLEX</h1>
          <p>TAX INVOICE / RECEIPT: ${invoice.invoice_number}</p>
        </div>
        <div class="details">
          <p><strong>Customer:</strong> ${invoice.bookings.customers.user_profiles.full_name}</p>
          <p><strong>Booking #:</strong> ${invoice.bookings.booking_number}</p>
          <p><strong>Facility:</strong> ${invoice.bookings.venues.name}</p>
          <p><strong>Date & Time:</strong> ${new Date(invoice.bookings.start_time).toLocaleString()}</p>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Base Rate</th>
              <th>GST (18%)</th>
              <th>Total (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Turf / Net Slot Reservation (${invoice.bookings.duration_hours} hrs)</td>
              <td>₹${invoice.subtotal}</td>
              <td>₹${invoice.tax_amount}</td>
              <td>₹${invoice.total_amount}</td>
            </tr>
          </tbody>
        </table>
        <div class="total">Grand Total: ₹${invoice.total_amount}</div>
      </body>
      </html>
    `;

    // Save receipt link in invoices
    const fakePdfPath = `booking-receipts/receipt_${invoice.invoice_number}.html`;
    const { error: uploadErr } = await supabase.storage
      .from("booking-receipts")
      .upload(`receipt_${invoice.invoice_number}.html`, new Blob([receiptHtml], { type: "text/html" }), {
        upsert: true,
      });

    if (!uploadErr) {
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/booking-receipts/receipt_${invoice.invoice_number}.html`;
      await supabase.from("invoices").update({ pdf_url: publicUrl }).eq("id", invoice.id);
    }

    return new Response(
      JSON.stringify({ success: true, invoice_number: invoice.invoice_number }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
