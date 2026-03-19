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
      return new Response(JSON.stringify({ success: true, processados: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processados = 0;
    const erros: string[] = [];

    for (const pedido of pedidos) {
      try {
        // Marca como processando para evitar duplo processamento
        await supabase.from('pedidos').update({
          status: 'concluido',
          repasse_processado_em: new Date().toISOString(),
        }).eq('cliente_id', pedido.cliente_id);

        const valorTotal = parseFloat(pedido.valor) || 0;
        const temCupom = !!pedido.cupom_usado;
        const valorProfissional = valorTotal * 0.80;
        const valorInfluencer = temCupom ? valorTotal * 0.10 : 0;

        // 1. Liberar saldo da profissional: pendente → disponivel
        if (pedido.profissional_id) {
          const { data: prof } = await supabase
            .from('profissionais')
            .select('saldo_pendente, saldo_disponivel')
            .eq('usuario_id', pedido.profissional_id)
            .single();

          if (prof) {
            await supabase.from('profissionais').update({
              saldo_pendente: Math.max(0, (prof.saldo_pendente || 0) - valorProfissional),
              saldo_disponivel: (prof.saldo_disponivel || 0) + valorProfissional,
            }).eq('usuario_id', pedido.profissional_id);
          }
        }

        // 2. Liberar saldo da influencer: pendente → disponivel
        if (temCupom && valorInfluencer > 0) {
          // Busca influencer pelo cupom
          const { data: inf } = await supabase
            .from('influencers')
            .select('id, saldo_pendente, saldo_disponivel')
            .eq('cupom', pedido.cupom_usado)
            .single();

          if (inf) {
            const novoDisponivel = (inf.saldo_disponivel || 0) + valorInfluencer;
            await supabase.from('influencers').update({
              saldo_pendente: Math.max(0, (inf.saldo_pendente || 0) - valorInfluencer),
              saldo_disponivel: novoDisponivel,
              // Mantém saldo antigo em sincronia
              saldo: novoDisponivel,
            }).eq('id', inf.id);

            // Atualiza comissao para liberado
            await supabase.from('comissoes')
              .update({ status: 'liberado' })
              .eq('pedido_id', pedido.id?.toString())
              .eq('influencer_id', inf.id);

            // Se saldo disponivel >= R$50, dispara PIX automatico
            if (novoDisponivel >= 50) {
              await supabase.functions.invoke('processar-saques-auto', {
                body: { tipo: 'influencer', influencer_id: inf.id },
              });
            }
          }
        }

        // 3. Atualizar transacao
        await supabase.from('transacoes')
          .update({ status: 'liberado', liberado_em: new Date().toISOString() })
          .eq('pedido_id', String(pedido.cliente_id));

        processados++;
      } catch (e: any) {
        erros.push(`Pedido ${pedido.id}: ${e.message}`);
        // Reverte status se falhar
        await supabase.from('pedidos').update({ status: 'aguardando_repasse' }).eq('cliente_id', pedido.cliente_id);
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
