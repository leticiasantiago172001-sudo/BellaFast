import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../config-supabase';

const SERVICOS = [
  { id: 'unhas', nome: 'Unhas', emoji: '💅', descricao: 'Manicure, pedicure e nail art' },
  { id: 'cabelo', nome: 'Cabelo', emoji: '✂️', descricao: 'Corte, escova e coloracao' },
  { id: 'massagem', nome: 'Massagem', emoji: '🌿', descricao: 'Relaxante e terapeutica' },
  { id: 'depilacao', nome: 'Depilacao', emoji: '✨', descricao: 'Cera e linha' },
  { id: 'maquiagem', nome: 'Maquiagem', emoji: '💄', descricao: 'Social e artistica' },
  { id: 'estetica', nome: 'Estetica', emoji: '🌸', descricao: 'Limpeza de pele e mais' },
];

export default function Servicos() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [usuario, setUsuario] = useState<any>(null);
  const [enderecos, setEnderecos] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const { data: usuarioAuth } = await supabase.auth.getUser();
      if (!usuarioAuth?.user) return;

      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', usuarioAuth.user.email)
        .single();

      if (usuarioData) {
        setUsuario(usuarioData);
        const enderecosSalvos = usuarioData.enderecos ? JSON.parse(usuarioData.enderecos) : [];
        setEnderecos(enderecosSalvos);
      }

      const { data: pedidosData } = await supabase
        .from('pedidos')
        .select('*')
        .order('cliente_id', { ascending: false });

      setPedidos(pedidosData || []);
    } catch (e) {
      console.log('Erro:', e);
    } finally {
      setCarregando(false);
    }
  }

  const pedidosAtivos = pedidos.filter((p) => p.status === 'pendente' || p.status === 'aceito');
  const pedidosConcluidos = pedidos.filter((p) => p.status === 'concluido');

  const corStatus = (s: string) => {
    if (s === 'aceito') return '#7BAE7F';
    if (s === 'pendente') return '#D4AF7F';
    return '#C0392B';
  };

  const textoStatus = (s: string) => {
    if (s === 'aceito') return 'Confirmado ✅';
    if (s === 'pendente') return 'Aguardando ⏳';
    return s;
  };

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>

        <View style={styles.header}>
          <View>
            <Text style={styles.ola}>Ola, {usuario?.nome?.split(' ')[0] || 'Cliente'}! 👋</Text>
            <Text style={styles.subtitulo}>O que deseja hoje?</Text>
          </View>
          <View style={styles.headerIcones}>
            <TouchableOpacity style={styles.iconeBtn} onPress={() => router.push('/notificacoes')}>
              <Text style={styles.icone}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconeBtn} onPress={() => router.push('/perfil')}>
              <Text style={styles.icone}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {enderecos.length > 0 && (
          <View style={styles.enderecoCard}>
            <Text style={styles.enderecoEmoji}>📍</Text>
            <View style={styles.enderecoInfo}>
              <Text style={styles.enderecoPadrao}>Endereco padrao</Text>
              <Text style={styles.enderecoTexto} numberOfLines={1}>{enderecos[0]}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/perfil')}>
              <Text style={styles.enderecoTrocar}>Trocar</Text>
            </TouchableOpacity>
          </View>
        )}

        {enderecos.length === 0 && (
          <TouchableOpacity style={styles.adicionarEnderecoCard} onPress={() => router.push('/perfil')}>
            <Text style={styles.adicionarEnderecoEmoji}>📍</Text>
            <Text style={styles.adicionarEnderecoTexto}>Adicione um endereco no seu perfil!</Text>
            <Text style={styles.adicionarEnderecoLink}>Adicionar →</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.secao}>Servicos</Text>
        <View style={styles.grid}>
          {SERVICOS.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.servicoCard}
              onPress={() => router.push({ pathname: '/detalhes', params: { servico: s.id, nome: s.nome, emoji: s.emoji } })}
            >
              <Text style={styles.servicoEmoji}>{s.emoji}</Text>
              <Text style={styles.servicoNome}>{s.nome}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {pedidosAtivos.length > 0 && (
          <View>
            <Text style={styles.secao}>Pedidos em andamento</Text>
            {pedidosAtivos.map((p, index) => (
              <TouchableOpacity
                key={index}
                style={styles.pedidoCard}
                onPress={() => router.push('/acompanhamento')}
              >
                <View style={styles.pedidoHeader}>
                  <Text style={styles.pedidoServico}>{p.servico}</Text>
                  <Text style={[styles.pedidoStatus, { color: corStatus(p.status) }]}>{textoStatus(p.status)}</Text>
                </View>
                <Text style={styles.pedidoInfo}>📅 {p.data} {p.horario ? `as ${p.horario}` : ''}</Text>
                <Text style={styles.pedidoInfo}>📍 {p.endereco}</Text>
                {p.status === 'aceito' && (
                  <View style={styles.profissionalConfirmada}>
                    <Text style={styles.profissionalConfirmadaTexto}>✅ Confirmado para as {p.horario}!</Text>
                    <Text style={styles.verDetalhes}>Toque para ver detalhes →</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {pedidosConcluidos.length > 0 && (
          <View>
            <Text style={styles.secao}>Historico</Text>
            {pedidosConcluidos.slice(0, 3).map((p, index) => (
              <View key={index} style={styles.historicoCard}>
                <Text style={styles.historicoServico}>{p.servico}</Text>
                <Text style={styles.historicoInfo}>{p.data} • R$ {parseFloat(p.valor).toFixed(2).replace('.', ',')}</Text>
              </View>
            ))}
          </View>
        )}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: '#E8DCCF' },
  container: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  ola: { fontSize: 22, fontWeight: 'bold', color: '#6B4F3A' },
  subtitulo: { fontSize: 13, color: '#CBB8A6', marginTop: 3 },
  headerIcones: { flexDirection: 'row' },
  iconeBtn: { backgroundColor: '#F7F3EF', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: 8, shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  icone: { fontSize: 20 },
  enderecoCard: { backgroundColor: '#F7F3EF', borderRadius: 12, padding: 12, marginBottom: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  enderecoEmoji: { fontSize: 20, marginRight: 10 },
  enderecoInfo: { flex: 1 },
  enderecoPadrao: { color: '#D4AF7F', fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  enderecoTexto: { color: '#6B4F3A', fontSize: 13 },
  enderecoTrocar: { color: '#D4AF7F', fontSize: 12, fontWeight: 'bold' },
  adicionarEnderecoCard: { backgroundColor: '#F7F3EF', borderRadius: 12, padding: 15, marginBottom: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D4AF7F', borderStyle: 'dashed' },
  adicionarEnderecoEmoji: { fontSize: 20, marginRight: 10 },
  adicionarEnderecoTexto: { color: '#CBB8A6', fontSize: 13, flex: 1 },
  adicionarEnderecoLink: { color: '#D4AF7F', fontWeight: 'bold', fontSize: 13 },
  secao: { fontSize: 17, fontWeight: 'bold', color: '#6B4F3A', marginBottom: 12, marginTop: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 25 },
  servicoCard: { backgroundColor: '#F7F3EF', borderRadius: 15, padding: 20, width: '30%', margin: '1.5%', alignItems: 'center', shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  servicoEmoji: { fontSize: 32, marginBottom: 8 },
  servicoNome: { color: '#6B4F3A', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  pedidoCard: { backgroundColor: '#F7F3EF', borderRadius: 15, padding: 15, marginBottom: 12, borderWidth: 2, borderColor: '#D4AF7F', shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  pedidoHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  pedidoServico: { color: '#6B4F3A', fontSize: 15, fontWeight: 'bold' },
  pedidoStatus: { fontSize: 12, fontWeight: 'bold' },
  pedidoInfo: { color: '#CBB8A6', fontSize: 13, marginBottom: 4 },
  profissionalConfirmada: { backgroundColor: '#E8DCCF', borderRadius: 8, padding: 10, marginTop: 8 },
  profissionalConfirmadaTexto: { color: '#7BAE7F', fontSize: 13, fontWeight: 'bold' },
  verDetalhes: { color: '#D4AF7F', fontSize: 12, marginTop: 4 },
  historicoCard: { backgroundColor: '#F7F3EF', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  historicoServico: { color: '#6B4F3A', fontSize: 14, fontWeight: 'bold' },
  historicoInfo: { color: '#CBB8A6', fontSize: 12 },
});