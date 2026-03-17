import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const servicos = [
  { id: 1, nome: 'Unhas', emoji: '💅', descricao: 'Manicure e pedicure', preco: 'A partir de R$ 45' },
  { id: 2, nome: 'Cabelo', emoji: '✂️', descricao: 'Corte, escova', preco: 'A partir de R$ 80' },
  { id: 3, nome: 'Massagem', emoji: '🌿', descricao: 'Relaxante e terapeutica', preco: 'A partir de R$ 120' },
  { id: 4, nome: 'Depilacao', emoji: '✨', descricao: 'Cera e linha', preco: 'A partir de R$ 35' },
  { id: 5, nome: 'Maquiagem', emoji: '💄', descricao: 'Social e artistica', preco: 'A partir de R$ 100' },
  { id: 6, nome: 'Estetica', emoji: '🌸', descricao: 'Limpeza de pele', preco: 'A partir de R$ 90' },
];

const historico = [
  { id: 1, servico: 'Manicure simples', profissional: 'Jessica Oliveira', data: '10/03', valor: 'R$ 45,00', nota: 5 },
  { id: 2, servico: 'Escova', profissional: 'Camila Santos', data: '05/03', valor: 'R$ 60,00', nota: 5 },
  { id: 3, servico: 'Limpeza de pele', profissional: 'Fernanda Lima', data: '28/02', valor: 'R$ 90,00', nota: 4 },
];

export default function Servicos() {
  const router = useRouter();

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>

        <View style={styles.header}>
          <View>
            <Text style={styles.ola}>Ola, Leticia!</Text>
            <Text style={styles.subtitulo}>O que voce quer hoje?</Text>
          </View>
          <TouchableOpacity style={styles.notifBotao} onPress={() => router.push('/notificacoes')}>
            <Text style={styles.notifEmoji}>🔔</Text>
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeTexto}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.bannerPromo} onPress={() => router.push('/servicos')}>
          <Text style={styles.bannerEmoji}>🎁</Text>
          <View>
            <Text style={styles.bannerTitulo}>Oferta especial!</Text>
            <Text style={styles.bannerDescricao}>20% off em massagens essa semana</Text>
          </View>
          <Text style={styles.bannerSeta}>›</Text>
        </TouchableOpacity>

        <Text style={styles.secao}>Servicos</Text>
        <View style={styles.servicosGrid}>
          {servicos.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.servicoCard}
              onPress={() => router.push({ pathname: '/detalhes', params: { servico: s.nome } })}
            >
              <Text style={styles.servicoEmoji}>{s.emoji}</Text>
              <Text style={styles.servicoNome}>{s.nome}</Text>
              <Text style={styles.servicoPreco}>{s.preco}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.secao}>Seu historico</Text>
        {historico.map((h) => (
          <View key={h.id} style={styles.historicoCard}>
            <View style={styles.row}>
              <Text style={styles.historicoServico}>{h.servico}</Text>
              <Text style={styles.historicoValor}>{h.valor}</Text>
            </View>
            <Text style={styles.historicoProfissional}>{h.profissional}</Text>
            <View style={styles.row}>
              <Text style={styles.historicoData}>{h.data}</Text>
              <Text style={styles.historicoNota}>{'★'.repeat(h.nota)}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.botaoAcompanhamento} onPress={() => router.push('/acompanhamento')}>
          <Text style={styles.botaoAcompanhamentoTexto}>Ver pedido em andamento</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: '#1a0a2e' },
  container: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  ola: { fontSize: 26, fontWeight: 'bold', color: '#f0a500' },
  subtitulo: { fontSize: 14, color: '#999', marginTop: 3 },
  notifBotao: { position: 'relative', padding: 5 },
  notifEmoji: { fontSize: 28 },
  notifBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#ff4444', borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  notifBadgeTexto: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  bannerPromo: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 25, borderWidth: 1, borderColor: '#f0a500' },
  bannerEmoji: { fontSize: 30, marginRight: 12 },
  bannerTitulo: { color: '#f0a500', fontWeight: 'bold', fontSize: 15 },
  bannerDescricao: { color: '#999', fontSize: 13, marginTop: 2 },
  bannerSeta: { color: '#f0a500', fontSize: 24, marginLeft: 'auto' },
  secao: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 15 },
  servicosGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 25 },
  servicoCard: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 15, width: '30%', margin: '1.5%', alignItems: 'center' },
  servicoEmoji: { fontSize: 30, marginBottom: 8 },
  servicoNome: { color: '#ffffff', fontWeight: 'bold', fontSize: 13, textAlign: 'center' },
  servicoPreco: { color: '#f0a500', fontSize: 11, textAlign: 'center', marginTop: 4 },
  historicoCard: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 15, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  historicoServico: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  historicoValor: { color: '#f0a500', fontWeight: 'bold', fontSize: 15 },
  historicoProfissional: { color: '#999', fontSize: 13, marginBottom: 5 },
  historicoData: { color: '#666', fontSize: 13 },
  historicoNota: { color: '#f0a500', fontSize: 14 },
  botaoAcompanhamento: { backgroundColor: '#f0a500', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 10, marginBottom: 30 },
  botaoAcompanhamentoTexto: { color: '#1a0a2e', fontWeight: 'bold', fontSize: 16 },
});