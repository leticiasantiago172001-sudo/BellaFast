import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const secretKey = Deno.env.get('PAGARME_SECRET_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = 'Basic ' + btoa(secretKey + ':');

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const { tipo, influencer_id } = body;

    let pagos = 0;
    const erros: string[] = [];

    // ====== INFLUENCERS ======
    if (!tipo || tipo === 'influencer') {
      let query = supabase
        .from('influencers')
        .select('*')
        .gte('saldo_disponivel', 50)
        .not('chave_pix', 'is', null);

      if (influencer_id) query = query.eq('id', influencer_id);

      const { data: influencers } = await query;

      for (const inf of (influencers || [])) {
        const valor = inf.saldo_disponivel || 0;
        const valorCentavos = Math.round(valor * 100);

        // 1. Cria registro de saque com status 'processando'
        const { data: saque } = await supabase.from('saques').insert({
          influencer_id: inf.id,
          valor,
          chave_pix: inf.chave_pix,
          status: 'processando',
          tipo: 'influencer',
        }).select().single();

        try {
          // 2. Tenta enviar PIX via Pagar.me
          const response = await fetch('https://api.pagar.me/core/v5/transfers', {
            method: 'POST',
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: valorCentavos,
              source_type: 'bank_account',
              target_type: 'bank_account',
              target: { type: 'pix', pix_key: inf.chave_pix },
            }),
          });

          const data = await response.json();

          if (data.id) {
            // SUCESSO: debita saldo_disponivel
            await supabase.from('influencers').update({
              saldo_disponivel: 0,
              saldo: 0,
            }).eq('id', inf.id);

            await supabase.from('saques').update({
              status: 'pago',
              pago_em: new Date().toISOString(),
              transacao_pix_id: data.id,
            }).eq('id', saque.id);

            pagos++;
          } else {
            // FALHA: mantém saldo_disponivel intacto
            await supabase.from('saques').update({
              status: 'erro',
              erro_mensagem: data.message || JSON.stringify(data),
            }).eq('id', saque.id);
            erros.push(`Influencer ${inf.id}: ${data.message || 'Erro Pagar.me'}`);
          }
        } catch (e: any) {
          // ERRO: mantém saldo_disponivel intacto
          await supabase.from('saques').update({
            status: 'erro',
            erro_mensagem: e.message,
          }).eq('id', saque.id);
          erros.push(`Influencer ${inf.id}: ${e.message}`);
        }
      }
    }

    // ====== PROFISSIONAIS ======
    if (!tipo || tipo === 'profissional') {
      const { data: profissionais } = await supabase
        .from('profissionais')
        .select('*')
        .gte('saldo_disponivel', 50)
        .not('chave_pix', 'is', null);

      for (const prof of (profissionais || [])) {
        const valor = prof.saldo_disponivel || 0;
        const valorCentavos = Math.round(valor * 100);

        const { data: saque } = await supabase.from('saques').insert({
          influencer_id: null,
          valor,
          chave_pix: prof.chave_pix,
          status: 'processando',
          tipo: 'profissional',
        }).select().single();

        try {
          const response = await fetch('https://api.pagar.me/core/v5/transfers', {
            method: 'POST',
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: valorCentavos,
              source_type: 'bank_account',
              target_type: 'bank_account',
              target: { type: 'pix', pix_key: prof.chave_pix },
            }),
          });

          const data = await response.json();

          if (data.id) {
            await supabase.from('profissionais').update({
              saldo_disponivel: 0,
            }).eq('id', prof.id);

            await supabase.from('saques').update({
              status: 'pago',
              pago_em: new Date().toISOString(),
              transacao_pix_id: data.id,
            }).eq('id', saque.id);

            pagos++;
          } else {
            await supabase.from('saques').update({
              status: 'erro',
              erro_mensagem: data.message || JSON.stringify(data),
            }).eq('id', saque.id);
            erros.push(`Profissional ${prof.id}: ${data.message || 'Erro Pagar.me'}`);
          }
        } catch (e: any) {
          await supabase.from('saques').update({
            status: 'erro',
            erro_mensagem: e.message,
          }).eq('id', saque.id);
          erros.push(`Profissional ${prof.id}: ${e.message}`);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, pagos, erros: erros.length > 0 ? erros : undefined }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, message: e.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
