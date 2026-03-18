import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { charge_id } = await req.json();
    const secretKey = Deno.env.get('PAGARME_SECRET_KEY');
    const authHeader = 'Basic ' + btoa(secretKey + ':');

    const response = await fetch(`https://api.pagar.me/core/v5/charges/${charge_id}`, {
      headers: { 'Authorization': authHeader },
    });

    const data = await response.json();

    return new Response(JSON.stringify({ status: data.status }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ status: 'error', message: e.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
