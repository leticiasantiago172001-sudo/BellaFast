import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { calcularDistanciaKm } from '../config-maps';
import { supabase } from '../config-supabase';

export default function Confirmacao() {
  const router = useRouter();
  const [dadosPedido, setDadosPedido] = useState<any>(null);
  const [profissionalProxima, setProfissionalProxima] = useState<any>(null);
  const [distancia, setDistancia] = useState<string>('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarESalvar();
  }, []);

  async function carregarESalvar() {
    try {
      const dados = await AsyncStorage.getItem('pedido_atual');
      if (dados) {
        const pedido = JSON.parse(dados);
        setDadosPedido(pedido);

        const { data: novoPedido } = await supabase
          .from('pedidos')
          .insert({
            servico: 'Manicure simples',
            data: pedido.data,
            horario: pedido.horario,
            endereco: pedido.endereco,
            latitude: pedido.latitude,
            longitude: pedido.longitude,
            valor: 45.00,
            status: 'pendente',
            metodo_pagamento: 'pix',
            profissionais_notificadas: [],
          })
          .select()
          .single();

        await AsyncStorage.removeItem('pedido_atual');

        if (pedido.latitude && pedido.longitude) {
          await buscarProfissionalProxima(pedido.latitude, pedido.longitude, novoPedido?.cliente_id);
        }
      }
    } catch (e) {
      console.log('Erro:', e);
    } finally {
      setCarregando(false);
    }
  }

  async function buscarProfissionalProxima(lat: number, lng: number, pedidoId?: number) {
    try {
      const { data: profissionais } = await supabase
        .from('profissionais')
        .select('*')
        .eq('status', 'ativo');

      if (!profissionais || profissionais.length === 0) return;

      const comDistancia = profissionais
        .filter((p) => p.latitude && p.longitude)
        .map((p) => ({
          ...p,
          distanciaKm: calcularDistanciaKm(lat, lng, p.latitude, p.longitude),
        }))
        .filter((p) => p.distanciaKm <= (p.raio_atendimento || 10))
        .sort((a, b) => a.distanciaKm - b.distanciaKm);

      if (comDistancia.length > 0) {
        const proxima = comDistancia[0];
        setProfissionalProxima(proxima);
        const d = proxima.distanciaKm;
        setDistancia(d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`);

        if (pedidoId) {
          await supabase
            .from('pedidos')
            .update({ profissionais_notificadas: [proxima.usuario_id] })
            .eq('cliente_id', pedidoId);
        }
      }
    } catch (e) {
      console.log('Erro ao buscar profissional:', e);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icone}>🎉</Text>
      <Text style={styles.titulo}>Pedido confirmado!</Text>
      <Text style={styles.subtitulo}>Sua solicitacao foi enviada com sucesso!</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitulo}>Detalhes do pedido</Text>
        <View style={styles.linha}>
          <Text style={styles.label}>Servico</Text>
          <Text style={styles.valor}>Manicure simples</Text>
        </View>
        <View style={styles.linha}>
          <Text style={styles.label}>Endereco</Text>
          <Text style={styles.valor}>{dadosPedido ? dadosPedido.endereco : '...'}</Text>
        </View>
        <View style={styles.linha}>
          <Text style={styles.label}>Data</Text>
          <Text style={styles.valor}>{dadosPedido ? dadosPedido.data : '...'} as {dadosPedido ? dadosPedido.horario : '...'}</Text>
        </View>
        <View style={styles.linha}>
          <Text style={styles.label}>Pagamento</Text>
          <Text style={styles.valor}>PIX</Text>
        </View>
        <View style={styles.linha}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.status}>Aguardando profissional</Text>
        </View>
        <View style={styles.separador} />
        <View style={styles.linha}>
          <Text style={styles.totalLabel}>Total pago</Text>
          <Text style={styles.totalValor}>R$ 45,00</Text>
        </View>
      </View>

      {carregando ? (
        <View style={styles.buscandoCard}>
          <ActivityIndicator color="#f0a500" size="large" />
          <Text style={styles.buscandoTexto}>Buscando profissional proxima...</Text>
        </View>
      ) : profissionalProxima ? (
        <View style={styles.profissionalCard}>
          <Text style={styles.profissionalTitulo}>✅ Profissional encontrada!</Text>
          <Text style={styles.profissionalEspecialidades}>{profissionalProxima.especialidades}</Text>
          <View style={styles.profissionalInfo}>
            <Text style={styles.distanciaTexto}>📍 {distancia} de voce</Text>
            <Text style={styles.avaliacaoTexto}>⭐ {profissionalProxima.avaliacao}</Text>
          </View>
          <Text style={styles.aguardandoTexto}>Aguardando ela aceitar seu pedido nos proximos 5 minutos...</Text>
        </View>
      ) : (
        <View style={styles.semProfissionalCard}>
          <Text style={styles.semProfissionalTexto}>😔 Nenhuma profissional disponivel na sua area no momento.</Text>
          <Text style={styles.semProfissionalDica}>Tente novamente mais tarde!</Text>
        </View>
      )}

      <TouchableOpacity style={styles.botao} onPress={() => router.push('/servicos')}>
        <Text style={styles.botaoTexto}>Voltar para inicio</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e', padding: 20, paddingTop: 60, alignItems: 'center' },
  icone: { fontSize: 60, marginBottom: 10 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#f0a500', marginBottom: 5, textAlign: 'center' },
  subtitulo: { fontSize: 14, color: '#999', marginBottom: 20, textAlign: 'center' },
  card: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 20, width: '100%', marginBottom: 15 },
  cardTitulo: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 15 },
  linha: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { color: '#999', fontSize: 13 },
  valor: { color: '#ffffff', fontSize: 13, fontWeight: 'bold', flex: 1, textAlign: 'right' },
  status: { color: '#f0a500', fontSize: 13, fontWeight: 'bold' },
  separador: { height: 1, backgroundColor: '#444', marginVertical: 10 },
  totalLabel: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  totalValor: { color: '#f0a500', fontSize: 17, fontWeight: 'bold' },
  buscandoCard: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 20, width: '100%', marginBottom: 15, alignItems: 'center' },
  buscandoTexto: { color: '#999', marginTop: 10, fontSize: 14 },
  profissionalCard: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 20, width: '100%', marginBottom: 15, borderWidth: 2, borderColor: '#00cc66' },
  profissionalTitulo: { color: '#00cc66', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  profissionalEspecialidades: { color: '#f0a500', fontSize: 13, marginBottom: 10 },
  profissionalInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  distanciaTexto: { color: '#999', fontSize: 13 },
  avaliacaoTexto: { color: '#f0a500', fontSize: 13 },
  aguardandoTexto: { color: '#999', fontSize: 12, textAlign: 'center' },
  semProfissionalCard: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 20, width: '100%', marginBottom: 15, borderWidth: 2, borderColor: '#ff4444' },
  semProfissionalTexto: { color: '#ffffff', fontSize: 14, textAlign: 'center', marginBottom: 8 },
  semProfissionalDica: { color: '#999', fontSize: 12, textAlign: 'center' },
  botao: { width: '100%', backgroundColor: '#f0a500', borderRadius: 10, padding: 15, alignItems: 'center' },
  botaoTexto: { color: '#1a0a2e', fontWeight: 'bold', fontSize: 16 },
});