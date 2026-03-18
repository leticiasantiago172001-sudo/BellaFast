import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../config-supabase';

export default function Admin() {
  const [aba, setAba] = useState('dashboard');
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    buscarDados();
  }, []);

  async function buscarDados() {
    try {
      const { data: pedidosData } = await supabase.from('pedidos').select('*').order('cliente_id', { ascending: false });
      const { data: usuariosData } = await supabase.from('usuarios').select('*');
      const { data: profissionaisData } = await supabase.from('profissionais').select('*');
      setPedidos(pedidosData || []);
      setUsuarios(usuariosData || []);
      setProfissionais(profissionaisData || []);
    } catch (e) {
      console.log('Erro:', e);
    } finally {
      setCarregando(false);
    }
  }

  async function aprovarProfissional(usuario_id: string) {
    await supabase.from('profissionais').update({ status: 'ativo' }).eq('usuario_id', usuario_id);
    Alert.alert('✅ Aprovada!', 'Profissional aprovada com sucesso!');
    buscarDados();
  }

  async function reprovarProfissional(usuario_id: string) {
    Alert.prompt(
      'Motivo da reprovacao',
      'Informe o motivo para a profissional:',
      async (motivo) => {
        if (motivo) {
          await supabase.from('profissionais').update({
            status: 'reprovada',
            motivo_reprovacao: motivo,
          }).eq('usuario_id', usuario_id);
          Alert.alert('❌ Reprovada', 'Profissional reprovada!');
          buscarDados();
        }
      }
    );
  }

  const pedidosPendentes = pedidos.filter((p) => p.status === 'pendente');
  const pedidosAceitos = pedidos.filter((p) => p.status === 'aceito');
  const faturamentoTotal = pedidos.reduce((t, p) => t + parseFloat(p.valor || 0), 0);
  const comissao = faturamentoTotal * 0.20;
  const emAnalise = profissionais.filter((p) => p.status === 'em_analise');
  const ativas = profissionais.filter((p) => p.status === 'ativo');
  const reprovadas = profissionais.filter((p) => p.status === 'reprovada');

  const corStatus = (s: string) => {
    if (s === 'concluido') return '#00cc66';
    if (s === 'aceito') return '#f0a500';
    if (s === 'pendente') return '#4488ff';
    return '#ff4444';
  };

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>
        <Text style={styles.titulo}>Painel Admin</Text>
        <Text style={styles.subtitulo}>BellaFast</Text>

        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.abasScroll}>
          {['dashboard', 'aprovacoes', 'pedidos', 'clientes', 'financeiro'].map((a) => (
            <TouchableOpacity key={a} style={aba === a ? styles.abaAtiva : styles.abaInativa} onPress={() => setAba(a)}>
              <Text style={aba === a ? styles.abaTextoAtivo : styles.abaTexto}>
                {a === 'aprovacoes' && emAnalise.length > 0 ? `Aprovacoes (${emAnalise.length})` : a.charAt(0).toUpperCase() + a.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {aba === 'dashboard' && (
          <View>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>📦</Text>
                <Text style={styles.statNumero}>{pedidos.length}</Text>
                <Text style={styles.statLabel}>Total pedidos</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>⏳</Text>
                <Text style={styles.statNumero}>{pedidosPendentes.length}</Text>
                <Text style={styles.statLabel}>Pendentes</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>👩</Text>
                <Text style={styles.statNumero}>{usuarios.length}</Text>
                <Text style={styles.statLabel}>Clientes</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>⚠️</Text>
                <Text style={[styles.statNumero, emAnalise.length > 0 && { color: '#ff4444' }]}>{emAnalise.length}</Text>
                <Text style={styles.statLabel}>Em analise</Text>
              </View>
            </View>

            {emAnalise.length > 0 && (
              <View style={styles.alertaCard}>
                <Text style={styles.alertaTexto}>⚠️ Voce tem {emAnalise.length} profissional(is) aguardando aprovacao!</Text>
                <TouchableOpacity onPress={() => setAba('aprovacoes')}>
                  <Text style={styles.alertaLink}>Ver agora →</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.secao}>Ultimos pedidos</Text>
            {carregando && <Text style={styles.carregando}>Carregando...</Text>}
            {pedidos.slice(0, 5).map((p, index) => (
              <View key={index} style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.clienteNome}>Pedido #{p.cliente_id}</Text>
                  <Text style={{ color: corStatus(p.status), fontWeight: 'bold' }}>{p.status}</Text>
                </View>
                <Text style={styles.info}>Servico: {p.servico}</Text>
                <Text style={styles.valor}>R$ {p.valor},00</Text>
              </View>
            ))}
          </View>
        )}

        {aba === 'aprovacoes' && (
          <View>
            <Text style={styles.secao}>Em analise ({emAnalise.length})</Text>
            {emAnalise.length === 0 && <Text style={styles.vazio}>Nenhuma profissional aguardando aprovacao!</Text>}
            {emAnalise.map((p, index) => (
              <View key={index} style={styles.cardAnalise}>
                <Text style={styles.clienteNome}>{p.endereco_completo}</Text>
                <Text style={styles.info}>Especialidades: {p.especialidades}</Text>
                <Text style={styles.info}>Raio: {p.raio_atendimento} km</Text>
                <Text style={styles.info}>Cidade: {p.cidade}</Text>
                <Text style={[styles.info, { color: '#ffaa00' }]}>Status: Em analise ⏳</Text>
                <View style={styles.row}>
                  <TouchableOpacity style={styles.botaoReprovar} onPress={() => reprovarProfissional(p.usuario_id)}>
                    <Text style={styles.botaoReprovarTexto}>❌ Reprovar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.botaoAprovar} onPress={() => aprovarProfissional(p.usuario_id)}>
                    <Text style={styles.botaoAprovarTexto}>✅ Aprovar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <Text style={styles.secao}>Ativas ({ativas.length})</Text>
            {ativas.map((p, index) => (
              <View key={index} style={styles.cardAtiva}>
                <Text style={styles.clienteNome}>{p.endereco_completo}</Text>
                <Text style={styles.info}>Especialidades: {p.especialidades}</Text>
                <Text style={[styles.info, { color: '#00cc66' }]}>Status: Ativa ✅</Text>
              </View>
            ))}

            <Text style={styles.secao}>Reprovadas ({reprovadas.length})</Text>
            {reprovadas.map((p, index) => (
              <View key={index} style={styles.cardReprovada}>
                <Text style={styles.clienteNome}>{p.endereco_completo}</Text>
                <Text style={styles.info}>Especialidades: {p.especialidades}</Text>
                <Text style={[styles.info, { color: '#ff4444' }]}>Status: Reprovada ❌</Text>
                {p.motivo_reprovacao && <Text style={styles.info}>Motivo: {p.motivo_reprovacao}</Text>}
                <TouchableOpacity style={styles.botaoAprovar} onPress={() => aprovarProfissional(p.usuario_id)}>
                  <Text style={styles.botaoAprovarTexto}>✅ Aprovar agora</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {aba === 'pedidos' && (
          <View>
            <Text style={styles.secao}>Todos os pedidos ({pedidos.length})</Text>
            {pedidos.map((p, index) => (
              <View key={index} style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.clienteNome}>Pedido #{p.cliente_id}</Text>
                  <Text style={{ color: corStatus(p.status), fontWeight: 'bold', fontSize: 12 }}>{p.status}</Text>
                </View>
                <Text style={styles.servico}>{p.servico}</Text>
                <Text style={styles.info}>Data: {p.data} as {p.horario}</Text>
                <Text style={styles.info}>Local: {p.endereco}</Text>
                <Text style={styles.info}>Pagamento: {p.metodo_pagamento}</Text>
                <Text style={styles.valor}>R$ {p.valor},00</Text>
              </View>
            ))}
          </View>
        )}

        {aba === 'clientes' && (
          <View>
            <Text style={styles.secao}>Clientes cadastrados ({usuarios.length})</Text>
            {usuarios.map((u, index) => (
              <View key={index} style={styles.card}>
                <Text style={styles.clienteNome}>{u.nome}</Text>
                <Text style={styles.info}>{u.email}</Text>
                <Text style={styles.info}>Tel: {u.telefone}</Text>
              </View>
            ))}
            {usuarios.length === 0 && !carregando && <Text style={styles.vazio}>Nenhum cliente cadastrado</Text>}
          </View>
        )}

        {aba === 'financeiro' && (
          <View>
            <View style={styles.finCard}>
              <Text style={styles.finLabel}>Faturamento total</Text>
              <Text style={styles.finValor}>R$ {faturamentoTotal.toFixed(2).replace('.', ',')}</Text>
            </View>
            <View style={styles.finCard}>
              <Text style={styles.finLabel}>Comissao BellaFast (20%)</Text>
              <Text style={styles.finValor}>R$ {comissao.toFixed(2).replace('.', ',')}</Text>
            </View>
            <View style={styles.finCard}>
              <Text style={styles.finLabel}>Repasses profissionais (80%)</Text>
              <Text style={styles.finValor}>R$ {(faturamentoTotal - comissao).toFixed(2).replace('.', ',')}</Text>
            </View>
            <View style={styles.finCard}>
              <Text style={styles.finLabel}>Total de pedidos</Text>
              <Text style={styles.finValor}>{pedidos.length}</Text>
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
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#f0a500' },
  subtitulo: { fontSize: 14, color: '#999', marginBottom: 20 },
  carregando: { color: '#999', textAlign: 'center', padding: 20 },
  abasScroll: { marginBottom: 20 },
  abaAtiva: { backgroundColor: '#f0a500', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, marginRight: 8 },
  abaInativa: { backgroundColor: '#2d1b4e', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, marginRight: 8 },
  abaTextoAtivo: { color: '#1a0a2e', fontWeight: 'bold', fontSize: 13 },
  abaTexto: { color: '#999', fontSize: 13 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  statCard: { backgroundColor: '#2d1b4e', borderRadius: 12, padding: 15, width: '47%', margin: '1.5%', alignItems: 'center' },
  statEmoji: { fontSize: 28, marginBottom: 8 },
  statNumero: { color: '#f0a500', fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#999', fontSize: 12, textAlign: 'center', marginTop: 4 },
  alertaCard: { backgroundColor: '#2d1b4e', borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 2, borderColor: '#ff4444', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alertaTexto: { color: '#ffffff', fontSize: 13, flex: 1 },
  alertaLink: { color: '#f0a500', fontWeight: 'bold', fontSize: 13 },
  secao: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 12, marginTop: 5 },
  card: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 15, marginBottom: 15 },
  cardAnalise: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 15, marginBottom: 15, borderWidth: 2, borderColor: '#ffaa00' },
  cardAtiva: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 15, marginBottom: 15, borderWidth: 2, borderColor: '#00cc66' },
  cardReprovada: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 15, marginBottom: 15, borderWidth: 2, borderColor: '#ff4444' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  clienteNome: { color: '#ffffff', fontSize: 15, fontWeight: 'bold', marginBottom: 5 },
  servico: { color: '#f0a500', fontSize: 13, marginBottom: 6 },
  info: { color: '#999', fontSize: 13, marginBottom: 3 },
  valor: { color: '#ffffff', fontWeight: 'bold', fontSize: 15, marginTop: 6 },
  vazio: { color: '#999', textAlign: 'center', padding: 20 },
  botaoAprovar: { flex: 1, backgroundColor: '#00cc66', borderRadius: 8, padding: 10, alignItems: 'center', marginLeft: 5, marginTop: 10 },
  botaoAprovarTexto: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  botaoReprovar: { flex: 1, backgroundColor: '#ff4444', borderRadius: 8, padding: 10, alignItems: 'center', marginRight: 5, marginTop: 10 },
  botaoReprovarTexto: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  finCard: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 20, marginBottom: 12, alignItems: 'center' },
  finLabel: { color: '#999', fontSize: 14, marginBottom: 8 },
  finValor: { color: '#f0a500', fontSize: 28, fontWeight: 'bold' },
});