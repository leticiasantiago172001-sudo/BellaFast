import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Clipboard, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../config-supabase';
import { calcularValorComTaxa, PAGARME_CONFIG } from './config-pagamento';

export default function Pagamento() {
  const router = useRouter();
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [dadosPedido, setDadosPedido] = useState<any>(null);
  const [horarios, setHorarios] = useState<string[]>([]);
  const [etapa, setEtapa] = useState<'selecionando' | 'cartao' | 'pix' | 'processando'>('selecionando');
  const [usuario, setUsuario] = useState<any>(null);

  const [numeroCartao, setNumeroCartao] = useState('');
  const [nomeCartao, setNomeCartao] = useState('');
  const [validade, setValidade] = useState('');
  const [cvv, setCvv] = useState('');

  const [pixQrCodeUrl, setPixQrCodeUrl] = useState('');
  const [pixCodigo, setPixCodigo] = useState('');
  const [chargeId, setChargeId] = useState('');
  const pollingRef = useRef<any>(null);

  useEffect(() => {
    carregarDados();
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  async function carregarDados() {
    try {
      const dados = await AsyncStorage.getItem('pedido_atual');
      if (dados) {
        const parsed = JSON.parse(dados);
        setDadosPedido(parsed);
        setHorarios(parsed.horarios || [parsed.horario]);
      }
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        const { data: user } = await supabase.from('usuarios').select('*').eq('email', auth.user.email).single();
        setUsuario(user);
      }
    } catch (e) {
      console.log('Erro:', e);
    }
  }

  const valorBase = dadosPedido?.valorFinal || 45.00;
  const valorComTaxa = metodoPagamento ? calcularValorComTaxa(valorBase, metodoPagamento) : valorBase;
  const taxaOperacao = metodoPagamento ? (valorComTaxa - valorBase).toFixed(2) : '0.00';

  const metodos = [
    { id: 'pix', nome: 'PIX', emoji: '⚡', taxa: calcularValorComTaxa(valorBase, 'pix') },
    { id: 'credito', nome: 'Cartao de Credito', emoji: '💳', taxa: calcularValorComTaxa(valorBase, 'credito') },
    { id: 'debito', nome: 'Cartao de Debito', emoji: '🏦', taxa: calcularValorComTaxa(valorBase, 'debito') },
  ];

  function formatarCartao(texto: string) {
    const numeros = texto.replace(/\D/g, '').slice(0, 16);
    return numeros.replace(/(.{4})/g, '$1 ').trim();
  }

  function formatarValidade(texto: string) {
    const numeros = texto.replace(/\D/g, '').slice(0, 4);
    if (numeros.length >= 3) return numeros.slice(0, 2) + '/' + numeros.slice(2);
    return numeros;
  }

  async function tokenizarCartao() {
    const [mes, ano] = validade.split('/');
    const response = await fetch(`https://api.pagar.me/core/v5/tokens?appId=${PAGARME_CONFIG.chavePublica}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'card',
        card: {
          number: numeroCartao.replace(/\s/g, ''),
          holder_name: nomeCartao.toUpperCase(),
          exp_month: parseInt(mes),
          exp_year: parseInt('20' + ano),
          cvv,
        },
      }),
    });
    const data = await response.json();
    if (!data.id) throw new Error(data.message || 'Cartao invalido');
    return data.id;
  }

  async function processarCartao() {
    if (!numeroCartao || !nomeCartao || !validade || !cvv) {
      Alert.alert('Campos incompletos', 'Preencha todos os dados do cartao!');
      return;
    }
    setEtapa('processando');
    try {
      const token = await tokenizarCartao();
      const { data, error } = await supabase.functions.invoke('processar-pagamento', {
        body: {
          metodo: metodoPagamento,
          valor: valorComTaxa,
          token,
          email: usuario?.email || 'cliente@bellafast.com',
          nome: usuario?.nome || 'Cliente',
        },
      });
      if (error || !data?.success) throw new Error(data?.message || 'Pagamento recusado');
      await finalizarPedido(data.order_id);
      router.push('/confirmacao');
    } catch (e: any) {
      Alert.alert('Pagamento recusado', e.message || 'Verifique os dados e tente novamente.');
      setEtapa('cartao');
    }
  }

  async function processarPix() {
    setEtapa('processando');
    try {
      const { data, error } = await supabase.functions.invoke('processar-pagamento', {
        body: {
          metodo: 'pix',
          valor: valorComTaxa,
          email: usuario?.email || 'cliente@bellafast.com',
          nome: usuario?.nome || 'Cliente',
          cpf: usuario?.cpf || '52998224725',
          telefone: usuario?.telefone || '',
        },
      });
      if (error) throw new Error(error.message || JSON.stringify(error));
      if (!data?.pix_qr_code) throw new Error(data?.message || JSON.stringify(data));
      setPixQrCodeUrl(data.pix_qr_code_url);
      setPixCodigo(data.pix_qr_code);
      setChargeId(data.charge_id);
      setEtapa('pix');
      iniciarPollingPix(data.charge_id);
    } catch (e: any) {
      Alert.alert('Erro no PIX', e.message || 'Erro desconhecido');
      setEtapa('selecionando');
    }
  }

  function iniciarPollingPix(id: string) {
    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('verificar-pagamento', { body: { charge_id: id } });
        if (data?.status === 'paid') {
          clearInterval(pollingRef.current);
          await finalizarPedido(id);
          router.push('/confirmacao');
        }
      } catch (e) {}
    }, 5000);
  }

  async function finalizarPedido(pagamentoId: string) {
    const dadosAtualizados = {
      ...dadosPedido,
      metodo_pagamento: metodoPagamento,
      valorFinal: valorComTaxa,
      pagamento_id: pagamentoId,
      pagamento_status: 'pago',
    };
    await AsyncStorage.setItem('pedido_atual', JSON.stringify(dadosAtualizados));
    const { data: auth } = await supabase.auth.getUser();
    if (auth?.user) {
      await supabase.from('pedidos').insert({
        email_cliente: auth.user.email,
        servico: dadosPedido?.servico || 'Servico BellaFast',
        valor: valorComTaxa,
        data: dadosPedido?.data,
        horario: dadosPedido?.horario,
        horarios: JSON.stringify(dadosPedido?.horarios),
        endereco: dadosPedido?.endereco,
        latitude: dadosPedido?.latitude,
        longitude: dadosPedido?.longitude,
        status: 'pendente',
        metodo_pagamento: metodoPagamento,
        pagamento_id: pagamentoId,
      });
    }
  }

  function confirmarPagamento() {
    if (!metodoPagamento) return;
    if (metodoPagamento === 'pix') {
      processarPix();
    } else {
      setEtapa('cartao');
    }
  }

  if (etapa === 'processando') {
    return (
      <View style={[styles.scroll, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 60, marginBottom: 20 }}>⏳</Text>
        <Text style={{ color: '#6B4F3A', fontSize: 18, fontWeight: 'bold' }}>Processando pagamento...</Text>
        <Text style={{ color: '#CBB8A6', fontSize: 14, marginTop: 8 }}>Aguarde um momento</Text>
      </View>
    );
  }

  if (etapa === 'pix') {
    return (
      <ScrollView style={styles.scroll}>
        <View style={styles.container}>
          <Text style={styles.titulo}>Pagar com PIX</Text>
          <View style={styles.pixCard}>
            <Text style={styles.pixTitulo}>Escaneie o QR Code</Text>
            {pixQrCodeUrl ? (
              <Image source={{ uri: pixQrCodeUrl }} style={styles.pixQr} resizeMode="contain" />
            ) : (
              <View style={styles.pixQrPlaceholder}>
                <Text style={{ fontSize: 60 }}>📱</Text>
              </View>
            )}
            <Text style={styles.pixValor}>R$ {valorComTaxa.toFixed(2).replace('.', ',')}</Text>
            <Text style={styles.pixDica}>Ou copie o codigo PIX abaixo</Text>
            <TouchableOpacity style={styles.pixCopiaBotao} onPress={() => { Clipboard.setString(pixCodigo); Alert.alert('Copiado!', 'Codigo PIX copiado. Cole no seu banco.'); }}>
              <Text style={styles.pixCopiaTexto} numberOfLines={2}>{pixCodigo || 'Carregando codigo...'}</Text>
              <Text style={styles.pixCopiaBtn}>Copiar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pixAguardando}>
            <Text style={styles.pixAguardandoTexto}>⏳ Aguardando confirmacao do pagamento...</Text>
          </View>
          <TouchableOpacity style={styles.botaoJaPaguei} onPress={async () => {
            clearInterval(pollingRef.current);
            await finalizarPedido(chargeId);
            router.push('/confirmacao');
          }}>
            <Text style={styles.botaoTexto}>Ja realizei o pagamento</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (etapa === 'cartao') {
    return (
      <ScrollView style={styles.scroll}>
        <View style={styles.container}>
          <TouchableOpacity onPress={() => setEtapa('selecionando')} style={styles.voltar}>
            <Text style={styles.voltarTexto}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.titulo}>Dados do cartao</Text>
          <View style={styles.cartaoCard}>
            <Text style={styles.cartaoLabel}>Numero do cartao</Text>
            <TextInput
              style={styles.input}
              placeholder="0000 0000 0000 0000"
              placeholderTextColor="#CBB8A6"
              keyboardType="numeric"
              maxLength={19}
              value={numeroCartao}
              onChangeText={(t) => setNumeroCartao(formatarCartao(t))}
            />
            <Text style={styles.cartaoLabel}>Nome no cartao</Text>
            <TextInput
              style={styles.input}
              placeholder="Como esta impresso no cartao"
              placeholderTextColor="#CBB8A6"
              autoCapitalize="characters"
              value={nomeCartao}
              onChangeText={setNomeCartao}
            />
            <View style={styles.cartaoRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.cartaoLabel}>Validade</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/AA"
                  placeholderTextColor="#CBB8A6"
                  keyboardType="numeric"
                  maxLength={5}
                  value={validade}
                  onChangeText={(t) => setValidade(formatarValidade(t))}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cartaoLabel}>CVV</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  placeholderTextColor="#CBB8A6"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  value={cvv}
                  onChangeText={setCvv}
                />
              </View>
            </View>
            <View style={styles.separador} />
            <View style={styles.resumoLinha}>
              <Text style={styles.totalLabel}>Total a cobrar</Text>
              <Text style={styles.totalValor}>R$ {valorComTaxa.toFixed(2).replace('.', ',')}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.botao} onPress={processarCartao}>
            <Text style={styles.botaoTexto}>Pagar agora</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>
        <Text style={styles.titulo}>Pagamento</Text>

        <View style={styles.resumoCard}>
          <Text style={styles.resumoTitulo}>Resumo do pedido</Text>
          <View style={styles.resumoLinha}>
            <Text style={styles.resumoLabel}>Servico</Text>
            <Text style={styles.resumoValor}>{dadosPedido?.servico || 'Servico BellaFast'}</Text>
          </View>
          <View style={styles.resumoLinha}>
            <Text style={styles.resumoLabel}>Endereco</Text>
            <Text style={styles.resumoValor} numberOfLines={1}>{dadosPedido?.endereco || '...'}</Text>
          </View>
          <View style={styles.resumoLinha}>
            <Text style={styles.resumoLabel}>Data</Text>
            <Text style={styles.resumoValor}>{dadosPedido?.data || '...'}</Text>
          </View>
          <Text style={styles.horariosLabel}>Horarios de preferencia</Text>
          <View style={styles.horariosRow}>
            {horarios.map((h, i) => (
              <View key={i} style={styles.horarioTag}>
                <Text style={styles.horarioTagTexto}>{h}</Text>
              </View>
            ))}
          </View>
          <View style={styles.resumoLinha}>
            <Text style={styles.resumoLabel}>Valor do servico</Text>
            <Text style={styles.resumoValor}>R$ {valorBase.toFixed(2).replace('.', ',')}</Text>
          </View>
          {dadosPedido?.taxaUrgencia && (
            <View style={styles.resumoLinha}>
              <Text style={styles.resumoLabel}>Taxa urgencia</Text>
              <Text style={styles.taxaValor}>+ R$ 10,00</Text>
            </View>
          )}
          {metodoPagamento !== '' && (
            <View style={styles.resumoLinha}>
              <Text style={styles.resumoLabel}>Taxa de operacao</Text>
              <Text style={styles.taxaValor}>+ R$ {taxaOperacao.replace('.', ',')}</Text>
            </View>
          )}
          <View style={styles.separador} />
          <View style={styles.resumoLinha}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValor}>R$ {valorComTaxa.toFixed(2).replace('.', ',')}</Text>
          </View>
        </View>

        <Text style={styles.label}>Como quer pagar?</Text>

        {metodos.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={metodoPagamento === m.id ? styles.metodoAtivo : styles.metodo}
            onPress={() => setMetodoPagamento(m.id)}
          >
            <Text style={styles.metodoEmoji}>{m.emoji}</Text>
            <View style={styles.metodoInfo}>
              <Text style={styles.metodoNome}>{m.nome}</Text>
              <Text style={styles.metodoDescricao}>Total: R$ {m.taxa.toFixed(2).replace('.', ',')}</Text>
            </View>
            {metodoPagamento === m.id && <Text style={styles.check}>✓</Text>}
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={metodoPagamento ? styles.botao : styles.botaoDesabilitado}
          onPress={confirmarPagamento}
          disabled={!metodoPagamento}
        >
          <Text style={styles.botaoTexto}>
            {metodoPagamento === 'pix' ? 'Gerar QR Code PIX' : metodoPagamento ? 'Inserir dados do cartao' : 'Selecione uma forma de pagamento'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: '#E8DCCF' },
  container: { padding: 20, paddingTop: 60 },
  voltar: { marginBottom: 15 },
  voltarTexto: { color: '#D4AF7F', fontSize: 16, fontWeight: 'bold' },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#6B4F3A', marginBottom: 25 },
  resumoCard: { backgroundColor: '#F7F3EF', borderRadius: 15, padding: 20, marginBottom: 25, shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  resumoTitulo: { fontSize: 16, fontWeight: 'bold', color: '#6B4F3A', marginBottom: 15 },
  resumoLinha: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  resumoLabel: { color: '#CBB8A6', fontSize: 14, flex: 1 },
  resumoValor: { color: '#6B4F3A', fontSize: 14, fontWeight: 'bold', flex: 2, textAlign: 'right' },
  taxaValor: { color: '#B5651D', fontSize: 14, fontWeight: 'bold' },
  horariosLabel: { color: '#CBB8A6', fontSize: 14, marginBottom: 8 },
  horariosRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  horarioTag: { backgroundColor: '#D4AF7F', borderRadius: 15, paddingVertical: 5, paddingHorizontal: 12, margin: 3 },
  horarioTagTexto: { color: '#4A3020', fontSize: 13, fontWeight: 'bold' },
  separador: { height: 1, backgroundColor: '#D9CEC5', marginVertical: 10 },
  totalLabel: { color: '#6B4F3A', fontSize: 16, fontWeight: 'bold' },
  totalValor: { color: '#D4AF7F', fontSize: 18, fontWeight: 'bold' },
  label: { fontSize: 16, color: '#6B4F3A', fontWeight: 'bold', marginBottom: 15 },
  metodo: { backgroundColor: '#F7F3EF', borderRadius: 12, padding: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#F7F3EF', shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  metodoAtivo: { backgroundColor: '#F7F3EF', borderRadius: 12, padding: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#D4AF7F' },
  metodoEmoji: { fontSize: 28, marginRight: 15 },
  metodoInfo: { flex: 1 },
  metodoNome: { color: '#6B4F3A', fontSize: 16, fontWeight: 'bold' },
  metodoDescricao: { color: '#CBB8A6', fontSize: 12, marginTop: 2 },
  check: { color: '#D4AF7F', fontSize: 22, fontWeight: 'bold' },
  botao: { width: '100%', backgroundColor: '#D4AF7F', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 20, marginBottom: 30 },
  botaoDesabilitado: { width: '100%', backgroundColor: '#CBB8A6', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 20, marginBottom: 30 },
  botaoTexto: { color: '#4A3020', fontWeight: 'bold', fontSize: 16 },
  cartaoCard: { backgroundColor: '#F7F3EF', borderRadius: 15, padding: 20, marginBottom: 20, shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  cartaoLabel: { color: '#6B4F3A', fontSize: 13, fontWeight: 'bold', marginBottom: 6, marginTop: 4 },
  cartaoRow: { flexDirection: 'row' },
  input: { backgroundColor: '#E8DCCF', borderRadius: 10, padding: 14, color: '#6B4F3A', marginBottom: 10, fontSize: 16, borderWidth: 1, borderColor: '#D9CEC5' },
  pixCard: { backgroundColor: '#F7F3EF', borderRadius: 15, padding: 25, alignItems: 'center', marginBottom: 20, shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  pixTitulo: { color: '#6B4F3A', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  pixQr: { width: 220, height: 220, marginBottom: 20 },
  pixQrPlaceholder: { width: 220, height: 220, backgroundColor: '#E8DCCF', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  pixValor: { color: '#D4AF7F', fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  pixDica: { color: '#CBB8A6', fontSize: 13, marginBottom: 15 },
  pixCopiaBotao: { backgroundColor: '#E8DCCF', borderRadius: 10, padding: 12, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#D9CEC5' },
  pixCopiaTexto: { color: '#CBB8A6', fontSize: 11, flex: 1, marginRight: 8 },
  pixCopiaBtn: { color: '#D4AF7F', fontWeight: 'bold', fontSize: 14 },
  pixAguardando: { backgroundColor: '#F7F3EF', borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#D4AF7F' },
  pixAguardandoTexto: { color: '#6B4F3A', fontSize: 14 },
  botaoJaPaguei: { width: '100%', backgroundColor: '#7BAE7F', borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 30 },
});
