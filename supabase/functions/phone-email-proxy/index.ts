import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();
    const apiKey = Deno.env.get("PHONE_EMAIL_API_KEY"); // Keeping the same env var name for simplicity

    if (!apiKey) {
      throw new Error("Missing API Key");
    }

    if (!phone) {
      throw new Error("Phone number is required");
    }

    // Fast2SMS requires 10 digit number for India. Strip +91 if present.
    const cleanPhone = phone.replace(/^\+91/, "").replace(/\D/g, "");

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    console.log(`Sending OTP ${otp} to ${cleanPhone} via Fast2SMS`);

    let apiSuccess = false;
    let apiMessage = "";

    try {
        const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            "authorization": apiKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            "route": "otp",
            "variables_values": otp,
            "numbers": cleanPhone,
          }),
        });

        const responseText = await response.text();
        console.log("Fast2SMS Response:", responseText); // Log full response for debugging

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
             console.error("Failed to parse API response:", responseText);
             // Don't throw here, let mock take over if needed
        }

        if (data && data.return) {
           apiSuccess = true;
        } else {
           apiMessage = data?.message || "Unknown API Error";
           console.error("Fast2SMS Failed:", apiMessage);
        }

    } catch (err) {
        console.error("Fetch Error:", err);
    }

    // FALLBACK FOR DEVELOPMENT:
    // If API fails (e.g. account not verified), we return success ANYWAY so you can test the UI.
    // In production, you should throw an error here.
    
    if (!apiSuccess) {
        console.log("⚠️ API Failed, falling back to MOCK MODE for Development.");
        console.log(`🔑 MOCK OTP for ${phone} is: ${otp}`);
        
        return new Response(JSON.stringify({ 
            success: true, 
            message: `Dev Mode: OTP is ${otp} (API: ${apiMessage})`, 
            debug_otp: otp 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
    }

    return new Response(JSON.stringify({ success: true, message: "OTP Sent" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
