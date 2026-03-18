import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../config-supabase';

export default function Confirmacao() {
  const router = useRouter();
  const [dadosPedido, setDadosPedido] = useState<any>(null);
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

        const horariosPedido = pedido.horarios || [pedido.horario];

        await supabase.from('pedidos').insert({
          servico: 'Manicure simples',
          data: pedido.data,
          horario: horariosPedido[0],
          horarios: JSON.stringify(horariosPedido),
          endereco: pedido.endereco,
          latitude: pedido.latitude,
          longitude: pedido.longitude,
          valor: pedido.valorFinal || 45.00,
          status: 'pendente',
          metodo_pagamento: pedido.metodo_pagamento || 'pix',
        });

        await AsyncStorage.removeItem('pedido_atual');
      }
    } catch (e) {
      console.log('Erro:', e);
    } finally {
      setCarregando(false);
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
          <Text style={styles.valor} numberOfLines={2}>{dadosPedido ? dadosPedido.endereco : '...'}</Text>
        </View>
        <View style={styles.linha}>
          <Text style={styles.label}>Data</Text>
          <Text style={styles.valor}>{dadosPedido ? dadosPedido.data : '...'}</Text>
        </View>

        <Text style={styles.horariosLabel}>Horarios de preferencia</Text>
        <View style={styles.horariosRow}>
          {dadosPedido?.horarios ? dadosPedido.horarios.map((h: string, i: number) => (
            <View key={i} style={styles.horarioTag}>
              <Text style={styles.horarioTagTexto}>{h}</Text>
            </View>
          )) : dadosPedido?.horario ? (
            <View style={styles.horarioTag}>
              <Text style={styles.horarioTagTexto}>{dadosPedido.horario}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.linha}>
          <Text style={styles.label}>Pagamento</Text>
          <Text style={styles.valor}>{dadosPedido?.metodo_pagamento?.toUpperCase() || 'PIX'}</Text>
        </View>
        {dadosPedido?.taxaUrgencia && (
          <View style={styles.linha}>
            <Text style={styles.label}>Taxa urgencia</Text>
            <Text style={styles.urgencia}>+ R$ 10,00</Text>
          </View>
        )}
        <View style={styles.linha}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.status}>Aguardando profissional</Text>
        </View>
        <View style={styles.separador} />
        <View style={styles.linha}>
          <Text style={styles.totalLabel}>Total pago</Text>
          <Text style={styles.totalValor}>R$ {dadosPedido ? (dadosPedido.valorFinal || 45).toFixed(2).replace('.', ',') : '45,00'}</Text>
        </View>
      </View>

      {carregando ? (
        <View style={styles.buscandoCard}>
          <ActivityIndicator color="#D4AF7F" size="large" />
          <Text style={styles.buscandoTexto}>Processando seu pedido...</Text>
        </View>
      ) : (
        <View style={styles.aguardandoCard}>
          <Text style={styles.aguardandoEmoji}>🔍</Text>
          <Text style={styles.aguardandoTitulo}>Buscando profissional!</Text>
          <Text style={styles.aguardandoTexto}>Estamos encontrando a melhor profissional disponivel para voce. Voce sera notificada em breve!</Text>
        </View>
      )}

      <TouchableOpacity style={styles.botao} onPress={() => router.push('/servicos')}>
        <Text style={styles.botaoTexto}>Voltar para inicio</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8DCCF', padding: 20, paddingTop: 60, alignItems: 'center' },
  icone: { fontSize: 60, marginBottom: 10 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#6B4F3A', marginBottom: 5, textAlign: 'center' },
  subtitulo: { fontSize: 14, color: '#CBB8A6', marginBottom: 20, textAlign: 'center' },
  card: { backgroundColor: '#F7F3EF', borderRadius: 15, padding: 20, width: '100%', marginBottom: 15, shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  cardTitulo: { fontSize: 16, fontWeight: 'bold', color: '#6B4F3A', marginBottom: 15 },
  linha: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { color: '#CBB8A6', fontSize: 13, flex: 1 },
  valor: { color: '#6B4F3A', fontSize: 13, fontWeight: 'bold', flex: 2, textAlign: 'right' },
  urgencia: { color: '#C0392B', fontSize: 13, fontWeight: 'bold' },
  status: { color: '#D4AF7F', fontSize: 13, fontWeight: 'bold' },
  horariosLabel: { color: '#CBB8A6', fontSize: 13, marginBottom: 8 },
  horariosRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  horarioTag: { backgroundColor: '#D4AF7F', borderRadius: 15, paddingVertical: 5, paddingHorizontal: 12, margin: 3 },
  horarioTagTexto: { color: '#4A3020', fontSize: 13, fontWeight: 'bold' },
  separador: { height: 1, backgroundColor: '#D9CEC5', marginVertical: 10 },
  totalLabel: { color: '#6B4F3A', fontSize: 15, fontWeight: 'bold' },
  totalValor: { color: '#D4AF7F', fontSize: 17, fontWeight: 'bold' },
  buscandoCard: { backgroundColor: '#F7F3EF', borderRadius: 15, padding: 20, width: '100%', marginBottom: 15, alignItems: 'center', shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  buscandoTexto: { color: '#CBB8A6', marginTop: 10, fontSize: 14 },
  aguardandoCard: { backgroundColor: '#F7F3EF', borderRadius: 15, padding: 20, width: '100%', marginBottom: 15, alignItems: 'center', borderWidth: 2, borderColor: '#D4AF7F' },
  aguardandoEmoji: { fontSize: 40, marginBottom: 10 },
  aguardandoTitulo: { color: '#D4AF7F', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  aguardandoTexto: { color: '#CBB8A6', fontSize: 13, textAlign: 'center' },
  botao: { width: '100%', backgroundColor: '#D4AF7F', borderRadius: 10, padding: 15, alignItems: 'center' },
  botaoTexto: { color: '#4A3020', fontWeight: 'bold', fontSize: 16 },
});