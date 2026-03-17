// Configuracao do Pagar.me - BellaFast
// IMPORTANTE: Nunca compartilhe sua chave secreta!

export const PAGARME_CONFIG = {
  // Substitua pela sua chave publica (começa com pk_)
  chavePublica: pk_dvYWN9vvhXijAPxa,
  
  // Taxa da plataforma BellaFast
  taxaPlataforma: 20, // 20% para voce
  taxaProfissional: 80, // 80% para a profissional
  
  // Taxa de operacao repassada ao cliente
  taxaOperacaoPix: 1.19, // 1.19% para PIX
  taxaOperacaoCredito: 4.39, // 4.39% para cartao de credito
  taxaOperacaoDebito: 2.00, // 2.00% para cartao de debito
};

// Calcula o valor total com taxa de operacao
export function calcularValorComTaxa(valor: number, metodoPagamento: string): number {
  let taxa = 0;
  if (metodoPagamento === 'pix') taxa = PAGARME_CONFIG.taxaOperacaoPix;
  if (metodoPagamento === 'credito') taxa = PAGARME_CONFIG.taxaOperacaoCredito;
  if (metodoPagamento === 'debito') taxa = PAGARME_CONFIG.taxaOperacaoDebito;
  
  const taxaValor = (valor * taxa) / 100;
  return Math.round((valor + taxaValor) * 100) / 100;
}

// Calcula quanto vai para cada parte
export function calcularSplit(valorTotal: number) {
  const parteVoce = Math.round((valorTotal * PAGARME_CONFIG.taxaPlataforma / 100) * 100) / 100;
  const parteProfissional = Math.round((valorTotal * PAGARME_CONFIG.taxaProfissional / 100) * 100) / 100;
  
  return {
    voce: parteVoce,
    profissional: parteProfissional,
    total: valorTotal,
  };
}