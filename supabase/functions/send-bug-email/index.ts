import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { Resend } from 'npm:resend@2.1.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const RESEND_API_KEY = 're_SooYTSgV_8jM3Hbzk5wvi9NT9f96Yk76H';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const resend = new Resend(RESEND_API_KEY);

    const { bugData } = await req.json();
    const { title, description, priority, assigned_to, status } = bugData;

    const priorityColors = {
      low: '#22C55E',
      medium: '#EAB308',
      high: '#F97316',
      critical: '#EF4444',
    };

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">New Bug Report</h1>
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px;">
          <h2 style="color: #111827; margin-top: 0;">${title}</h2>
          <p style="color: #374151;">${description}</p>
          <div style="margin: 20px 0;">
            <span style="
              background-color: ${priorityColors[priority as keyof typeof priorityColors]};
              color: white;
              padding: 4px 12px;
              border-radius: 9999px;
              font-size: 14px;
            ">${priority}</span>
            <span style="margin-left: 10px; color: #6B7280;">Status: ${status}</span>
          </div>
        </div>
        <div style="margin-top: 20px; color: #6B7280;">
          <p>You can view and update this bug in the bug tracking system.</p>
        </div>
      </div>
    `;

    const { error: emailError } = await resend.emails.send({
      from: 'Bug Tracker <bugs@resend.dev>',
      to: assigned_to,
      subject: `New Bug Report: ${title}`,
      html: emailHtml,
    });

    if (emailError) {
      throw emailError;
    }

    return new Response(
      JSON.stringify({ message: 'Email sent successfully' }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});