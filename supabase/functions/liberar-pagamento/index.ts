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
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Busca pedidos prontos para repasse (repasse_em <= agora)
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('status', 'aguardando_repasse')
      .lte('repasse_em', new Date().toISOString());

    if (error) throw error;

    if (!pedidos || pedidos.length === 0) {
      return new Response(JSON.stringify({ success: true, processados: 0, mensagem: 'Nenhum repasse pendente' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processados = 0;
    const erros: string[] = [];

    for (const pedido of pedidos) {
      try {
        // Marca como pago para evitar duplo processamento
        await supabase
          .from('pedidos')
          .update({ status: 'repasse_processado', repasse_processado_em: new Date().toISOString() })
          .eq('id', pedido.id);

        processados++;
      } catch (e: any) {
        erros.push(`Pedido ${pedido.id}: ${e.message}`);
        // Reverte status se falhar
        await supabase
          .from('pedidos')
          .update({ status: 'aguardando_repasse' })
          .eq('id', pedido.id);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processados,
      erros: erros.length > 0 ? erros : undefined,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, message: e.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
