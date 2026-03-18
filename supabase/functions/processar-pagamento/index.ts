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
    const { metodo, valor, token, email, nome } = await req.json();

    const secretKey = Deno.env.get('PAGARME_SECRET_KEY');
    if (!secretKey) throw new Error('Chave Pagar.me nao configurada');

    const authHeader = 'Basic ' + btoa(secretKey + ':');
    const valorCentavos = Math.round(valor * 100);

    const body: any = {
      items: [{ amount: valorCentavos, description: 'BellaFast - Servico de beleza', quantity: 1 }],
      customer: { name: nome, email, type: 'individual' },
      payments: [],
    };

    if (metodo === 'pix') {
      body.payments = [{ payment_method: 'pix', pix: { expires_in: 3600 } }];
    } else if (metodo === 'credito') {
      body.payments = [{
        payment_method: 'credit_card',
        credit_card: { installments: 1, statement_descriptor: 'BellaFast', card_token: token },
      }];
    } else if (metodo === 'debito') {
      body.payments = [{
        payment_method: 'debit_card',
        debit_card: { statement_descriptor: 'BellaFast', card_token: token },
      }];
    }

    const response = await fetch('https://api.pagar.me/core/v5/orders', {
      method: 'POST',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (metodo === 'pix') {
      const tx = data.charges?.[0]?.last_transaction;
      return new Response(JSON.stringify({
        success: true,
        pix_qr_code: tx?.qr_code,
        pix_qr_code_url: tx?.qr_code_url,
        charge_id: data.charges?.[0]?.id,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const status = data.charges?.[0]?.status;
    return new Response(JSON.stringify({
      success: status === 'paid',
      order_id: data.id,
      status,
      message: status !== 'paid' ? 'Pagamento recusado pela operadora' : undefined,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, message: e.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
