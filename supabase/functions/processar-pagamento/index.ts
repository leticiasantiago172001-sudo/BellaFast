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
    const { metodo, valor, token, email, nome, cpf, recipient_id_profissional } = await req.json();

    const secretKey = Deno.env.get('PAGARME_SECRET_KEY');
    if (!secretKey) throw new Error('Chave Pagar.me nao configurada');

    const authHeader = 'Basic ' + btoa(secretKey + ':');
    const valorCentavos = Math.round(valor * 100);

    // Split: 80% profissional, 20% plataforma (se tiver recipient_id)
    const split = recipient_id_profissional ? [
      {
        recipient_id: 're_cmmu76q1io60c0l9tnapl3pft', // plataforma 20%
        type: 'percentage',
        amount: 20,
        options: { charge_processing_fee: true, liable: true, charge_remainder_fee: true },
      },
      {
        recipient_id: recipient_id_profissional, // profissional 80%
        type: 'percentage',
        amount: 80,
        options: { charge_processing_fee: false, liable: false, charge_remainder_fee: false },
      },
    ] : undefined;

    const body: any = {
      items: [{ amount: valorCentavos, description: 'BellaFast - Servico de beleza', quantity: 1 }],
      customer: {
        name: nome || 'Cliente',
        email: email || 'cliente@bellafast.com',
        type: 'individual',
        document: cpf ? cpf.replace(/\D/g, '') : '52998224725',
        document_type: 'CPF',
      },
      payments: [],
    };

    if (metodo === 'pix') {
      const pixPayment: any = {
        payment_method: 'pix',
        pix: { expires_in: 3600 },
      };
      if (split) pixPayment.split = split;
      body.payments = [pixPayment];
    } else if (metodo === 'credito') {
      const creditPayment: any = {
        payment_method: 'credit_card',
        credit_card: { installments: 1, statement_descriptor: 'BellaFast', card_token: token },
      };
      if (split) creditPayment.split = split;
      body.payments = [creditPayment];
    } else if (metodo === 'debito') {
      const debitPayment: any = {
        payment_method: 'debit_card',
        debit_card: { statement_descriptor: 'BellaFast', card_token: token },
      };
      if (split) debitPayment.split = split;
      body.payments = [debitPayment];
    }

    const response = await fetch('https://api.pagar.me/core/v5/orders', {
      method: 'POST',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Verifica erro do Pagar.me — retorna resposta RAW para debug
    if (!data.charges || data.message || data.errors) {
      return new Response(JSON.stringify({
        success: false,
        message: `Pagar.me: ${data.message || JSON.stringify(data.errors || data)}`,
        raw: data,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (metodo === 'pix') {
      const charge = data.charges?.[0];
      const tx = charge?.last_transaction;
      const qrCode = tx?.qr_code;
      const qrCodeUrl = tx?.qr_code_url;

      if (!qrCode) {
        return new Response(JSON.stringify({
          success: false,
          message: `QR Code nao gerado. Status charge: ${charge?.status}. Status tx: ${tx?.status}. Erro: ${tx?.gateway_response?.errors ? JSON.stringify(tx.gateway_response.errors) : JSON.stringify(tx)}`,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({
        success: true,
        pix_qr_code: qrCode,
        pix_qr_code_url: qrCodeUrl,
        charge_id: data.charges?.[0]?.id,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const status = data.charges?.[0]?.status;
    return new Response(JSON.stringify({
      success: status === 'paid',
      order_id: data.id,
      status,
      message: status !== 'paid' ? (`Pagamento recusado: ${data.charges?.[0]?.last_transaction?.acquirer_message || status}`) : undefined,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, message: e.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
