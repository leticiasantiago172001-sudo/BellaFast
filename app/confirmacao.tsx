import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../config-supabase';

export default function Confirmacao() {
  const router = useRouter();
  const [dadosPedido, setDadosPedido] = useState<any>(null);

  useEffect(() => {
    carregarESalvar();
  }, []);

  async function carregarESalvar() {
    try {
      const dados = await AsyncStorage.getItem('pedido_atual');
      if (dados) {
        const pedido = JSON.parse(dados);
        setDadosPedido(pedido);
        await supabase.from('pedidos').insert({
          servico: 'Manicure simples',
          data: pedido.data,
          horario: pedido.horario,
          endereco: pedido.endereco,
          latitude: pedido.latitude,
          longitude: pedido.longitude,
          valor: 45.00,
          status: 'pendente',
          metodo_pagamento: 'pix',
        });
        await AsyncStorage.removeItem('pedido_atual');
      }
    } catch (e) {
      console.log('Erro:', e);
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
      <Text style={styles.aviso}>Estamos buscando a profissional mais proxima de voce!</Text>
      <TouchableOpacity style={styles.botao} onPress={() => router.push('/servicos')}>
        <Text style={styles.botaoTexto}>Voltar para inicio</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e', padding: 20, paddingTop: 80, alignItems: 'center' },
  icone: { fontSize: 70, marginBottom: 15 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#f0a500', marginBottom: 8, textAlign: 'center' },
  subtitulo: { fontSize: 15, color: '#999', marginBottom: 30, textAlign: 'center' },
  card: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 20, width: '100%', marginBottom: 20 },
  cardTitulo: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 15 },
  linha: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { color: '#999', fontSize: 14 },
  valor: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', flex: 1, textAlign: 'right' },
  status: { color: '#f0a500', fontSize: 14, fontWeight: 'bold' },
  separador: { height: 1, backgroundColor: '#444', marginVertical: 10 },
  totalLabel: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  totalValor: { color: '#f0a500', fontSize: 18, fontWeight: 'bold' },
  aviso: { color: '#999', fontSize: 13, textAlign: 'center', marginBottom: 30, paddingHorizontal: 10 },
  botao: { width: '100%', backgroundColor: '#f0a500', borderRadius: 10, padding: 15, alignItems: 'center' },
  botaoTexto: { color: '#1a0a2e', fontWeight: 'bold', fontSize: 16 },
});