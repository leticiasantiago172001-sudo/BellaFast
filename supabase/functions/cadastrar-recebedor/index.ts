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
    const { nome, email, documento, tipo_pessoa, telefone, banco, agencia, conta, digito, tipo_conta } = await req.json();

    const secretKey = Deno.env.get('PAGARME_SECRET_KEY');
    if (!secretKey) throw new Error('Chave Pagar.me nao configurada');

    const authHeader = 'Basic ' + btoa(secretKey + ':');

    const body: any = {
      name: nome,
      email,
      document: documento,
      type: tipo_pessoa || 'individual',
      default_bank_account: {
        holder_name: nome,
        holder_type: tipo_pessoa || 'individual',
        holder_document: documento,
        bank: banco,
        branch_number: agencia,
        account_number: conta,
        account_check_digit: digito,
        type: tipo_conta === 'poupanca' ? 'savings' : 'checking',
      },
      transfer_settings: {
        transfer_enabled: true,
        transfer_interval: 'daily',
        transfer_day: 0,
      },
    };

    // CNPJ precisa de company_name
    if (tipo_pessoa === 'company') {
      body.company_name = nome;
    }

    const response = await fetch('https://api.pagar.me/core/v5/recipients', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!data.id) {
      return new Response(JSON.stringify({
        success: false,
        message: data.message || 'Erro ao cadastrar recebedor',
        errors: data.errors,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: true,
      recipient_id: data.id,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, message: e.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
