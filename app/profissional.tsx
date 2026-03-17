import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../config-supabase';
import { agendarNotificacao30min, enviarNotificacaoLocal } from './notificacoes-config';

export default function Profissional() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [aba, setAba] = useState('pedidos');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    buscarPedidos();
  }, []);

  async function buscarPedidos() {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('cliente_id', { ascending: false });
      if (error) {
        console.log('Erro:', JSON.stringify(error));
      } else {
        setPedidos(data || []);
      }
    } catch (e) {
      console.log('Erro:', String(e));
    } finally {
      setCarregando(false);
    }
  }

  async function aceitar(cliente_id: number, horario: string) {
    await supabase.from('pedidos').update({ status: 'aceito' }).eq('cliente_id', cliente_id);
    await enviarNotificacaoLocal('Pedido aceito!', 'Uma profissional aceitou seu pedido!');
    await agendarNotificacao30min(horario);
    buscarPedidos();
  }

  async function recusar(cliente_id: number) {
    await supabase.from('pedidos').update({ status: 'recusado' }).eq('cliente_id', cliente_id);
    buscarPedidos();
  }

  const pendentes = pedidos.filter((p) => p.status === 'pendente');
  const aceitos = pedidos.filter((p) => p.status === 'aceito');
  const concluidos = pedidos.filter((p) => p.status === 'concluido');

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>
        <View style={styles.abas}>
          {['pedidos', 'agenda', 'ganhos', 'perfil'].map((a) => (
            <TouchableOpacity key={a} style={aba === a ? styles.abaAtiva : styles.abaInativa} onPress={() => setAba(a)}>
              <Text style={aba === a ? styles.abaTextoAtivo : styles.abaTexto}>{a.charAt(0).toUpperCase() + a.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {aba === 'pedidos' && (
          <View>
            {carregando && <Text style={styles.carregando}>Carregando pedidos...</Text>}
            <Text style={styles.secao}>Pendentes ({pendentes.length})</Text>
            {pendentes.length === 0 && !carregando && <Text style={styles.vazio}>Nenhum pedido pendente</Text>}
            {pendentes.map((p, index) => (
              <View key={index} style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.clienteNome}>Pedido #{p.cliente_id}</Text>
                  <Text style={styles.distancia}>Novo!</Text>
                </View>
                <Text style={styles.servico}>{p.servico}</Text>
                <Text style={styles.info}>Data: {p.data} as {p.horario}</Text>
                <Text style={styles.info}>Local: {p.endereco}</Text>
                <Text style={styles.valor}>R$ {p.valor},00</Text>
                <View style={styles.row}>
                  <TouchableOpacity style={styles.botaoRecusar} onPress={() => recusar(p.cliente_id)}>
                    <Text style={styles.botaoRecusarTexto}>Recusar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.botaoAceitar} onPress={() => aceitar(p.cliente_id, p.horario)}>
                    <Text style={styles.botaoAceitarTexto}>Aceitar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <Text style={styles.secao}>Aceitos ({aceitos.length})</Text>
            {aceitos.map((p, index) => (
              <View key={index} style={styles.cardAceito}>
                <Text style={styles.clienteNome}>Pedido #{p.cliente_id}</Text>
                <Text style={styles.servico}>{p.servico}</Text>
                <Text style={styles.info}>Data: {p.data} as {p.horario}</Text>
                <Text style={styles.valor}>R$ {p.valor},00</Text>
                <Text style={styles.statusAceito}>Aceito ✅</Text>
              </View>
            ))}
            <Text style={styles.secao}>Concluidos ({concluidos.length})</Text>
            {concluidos.map((p, index) => (
              <View key={index} style={styles.cardConcluido}>
                <Text style={styles.clienteNome}>Pedido #{p.cliente_id}</Text>
                <Text style={styles.servico}>{p.servico}</Text>
                <Text style={styles.valor}>R$ {p.valor},00</Text>
              </View>
            ))}
          </View>
        )}

        {aba === 'ganhos' && (
          <View>
            <View style={styles.faturamentoCard}>
              <Text style={styles.faturamentoLabel}>Total a receber</Text>
              <Text style={styles.faturamentoValor}>
                R$ {aceitos.reduce((t, p) => t + parseFloat(p.valor), 0).toFixed(2).replace('.', ',')}
              </Text>
              <Text style={styles.faturamentoSub}>{aceitos.length} servicos aceitos</Text>
            </View>
          </View>
        )}

        {aba === 'agenda' && (
          <View>
            <Text style={styles.secao}>Agenda em breve!</Text>
          </View>
        )}

        {aba === 'perfil' && (
          <View style={styles.perfilContainer}>
            <View style={styles.perfilFoto}>
              <Text style={styles.perfilFotoTexto}>J</Text>
            </View>
            <Text style={styles.perfilNome}>Jessica Oliveira</Text>
            <Text style={styles.perfilProfissao}>Manicure e Esteticista</Text>
            <View style={styles.avaliacaoRow}>
              <Text style={styles.estrelas}>★★★★★</Text>
              <Text style={styles.avaliacaoTexto}>4.9 (127 avaliacoes)</Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: '#1a0a2e' },
  container: { padding: 20, paddingTop: 60 },
  carregando: { color: '#999', textAlign: 'center', padding: 20 },
  abas: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#2d1b4e', borderRadius: 10, padding: 4 },
  abaAtiva: { flex: 1, backgroundColor: '#f0a500', borderRadius: 8, padding: 8, alignItems: 'center' },
  abaInativa: { flex: 1, padding: 8, alignItems: 'center' },
  abaTextoAtivo: { color: '#1a0a2e', fontWeight: 'bold', fontSize: 11 },
  abaTexto: { color: '#999', fontSize: 11 },
  secao: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 12, marginTop: 5 },
  vazio: { color: '#999', textAlign: 'center', padding: 20 },
  card: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 15, marginBottom: 15, borderWidth: 2, borderColor: '#f0a500' },
  cardAceito: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 15, marginBottom: 15, borderWidth: 2, borderColor: '#00cc66' },
  cardConcluido: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 15, marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  clienteNome: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  distancia: { color: '#f0a500', fontWeight: 'bold' },
  servico: { color: '#f0a500', fontSize: 14, marginBottom: 8 },
  info: { color: '#999', fontSize: 13, marginBottom: 4 },
  valor: { color: '#ffffff', fontWeight: 'bold', fontSize: 16, marginTop: 8, marginBottom: 10 },
  botaoRecusar: { flex: 1, borderWidth: 2, borderColor: '#ff4444', borderRadius: 8, padding: 10, alignItems: 'center', marginRight: 8 },
  botaoRecusarTexto: { color: '#ff4444', fontWeight: 'bold' },
  botaoAceitar: { flex: 1, backgroundColor: '#f0a500', borderRadius: 8, padding: 10, alignItems: 'center' },
  botaoAceitarTexto: { color: '#1a0a2e', fontWeight: 'bold' },
  statusAceito: { color: '#00cc66', fontWeight: 'bold', marginTop: 8 },
  faturamentoCard: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 25, alignItems: 'center', marginBottom: 15 },
  faturamentoLabel: { color: '#999', fontSize: 14, marginBottom: 8 },
  faturamentoValor: { color: '#f0a500', fontSize: 36, fontWeight: 'bold' },
  faturamentoSub: { color: '#999', fontSize: 13, marginTop: 5 },
  perfilContainer: { alignItems: 'center' },
  perfilFoto: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0a500', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  perfilFotoTexto: { fontSize: 40, fontWeight: 'bold', color: '#1a0a2e' },
  perfilNome: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', marginBottom: 5 },
  perfilProfissao: { fontSize: 14, color: '#999', marginBottom: 10 },
  avaliacaoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  estrelas: { color: '#f0a500', fontSize: 18, marginRight: 8 },
  avaliacaoTexto: { color: '#999', fontSize: 14 },
});