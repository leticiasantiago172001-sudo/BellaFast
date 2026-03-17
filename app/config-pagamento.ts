export const PAGARME_CONFIG = {
  chavePublica: 'pk_dvYWN9vvhXijAPxa',
  taxaPlataforma: 20,
  taxaProfissional: 80,
  taxaOperacaoPix: 1.19,
  taxaOperacaoCredito: 4.39,
  taxaOperacaoDebito: 2.00,
};

export function calcularValorComTaxa(valor: number, metodoPagamento: string): number {
  let taxa = 0;
  if (metodoPagamento === 'pix') taxa = PAGARME_CONFIG.taxaOperacaoPix;
  if (metodoPagamento === 'credito') taxa = PAGARME_CONFIG.taxaOperacaoCredito;
  if (metodoPagamento === 'debito') taxa = PAGARME_CONFIG.taxaOperacaoDebito;
  const taxaValor = (valor * taxa) / 100;
  return Math.round((valor + taxaValor) * 100) / 100;
}

export function calcularSplit(valorTotal: number) {
  const parteVoce = Math.round((valorTotal * PAGARME_CONFIG.taxaPlataforma / 100) * 100) / 100;
  const parteProfissional = Math.round((valorTotal * PAGARME_CONFIG.taxaProfissional / 100) * 100) / 100;
  return { voce: parteVoce, profissional: parteProfissional, total: valorTotal };
}