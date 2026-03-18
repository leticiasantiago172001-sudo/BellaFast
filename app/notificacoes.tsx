import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const notificacoesIniciais = [
  { id: 1, tipo: 'pedido', titulo: 'Pedido confirmado!', mensagem: 'Sua manicure simples foi confirmada para 17/03 as 09:00', hora: 'Agora', lida: false, emoji: '✅' },
  { id: 2, tipo: 'profissional', titulo: 'Profissional encontrada!', mensagem: 'Jessica Oliveira aceitou seu pedido e esta a caminho!', hora: '2 min', lida: false, emoji: '💅' },
  { id: 3, tipo: 'aviso', titulo: 'Faltam 30 minutos!', mensagem: 'Seu atendimento comeca em 30 minutos. Prepare-se!', hora: '1h', lida: false, emoji: '⏰' },
  { id: 4, tipo: 'concluido', titulo: 'Atendimento concluido!', mensagem: 'Seu atendimento foi finalizado. Avalie Jessica Oliveira!', hora: '2h', lida: true, emoji: '🎉' },
  { id: 5, tipo: 'promo', titulo: 'Oferta especial!', mensagem: '20% de desconto em massagens essa semana. Aproveite!', hora: '1d', lida: true, emoji: '🎁' },
  { id: 6, tipo: 'pedido', titulo: 'Pagamento aprovado!', mensagem: 'Seu pagamento de R$ 45,00 via PIX foi aprovado com sucesso!', hora: '2d', lida: true, emoji: '💰' },
  { id: 7, tipo: 'aviso', titulo: 'Avalie seu atendimento', mensagem: 'Voce ainda nao avaliou Camila Santos. Sua opiniao e importante!', hora: '3d', lida: true, emoji: '⭐' },
];

export default function Notificacoes() {
  const [notificacoes, setNotificacoes] = useState(notificacoesIniciais);
  const [filtro, setFiltro] = useState('todas');

  function marcarLida(id: number) {
    setNotificacoes((prev) => prev.map((n) => n.id === id ? Object.assign({}, n, { lida: true }) : n));
  }

  function marcarTodasLidas() {
    setNotificacoes((prev) => prev.map((n) => Object.assign({}, n, { lida: true })));
  }

  const naoLidas = notificacoes.filter((n) => !n.lida).length;
  const filtradas = filtro === 'nao_lidas' ? notificacoes.filter((n) => !n.lida) : notificacoes;

  const corTipo = (tipo: string) => {
    if (tipo === 'pedido') return '#D4AF7F';
    if (tipo === 'profissional') return '#7BAE7F';
    if (tipo === 'aviso') return '#7B9BB5';
    if (tipo === 'concluido') return '#7BAE7F';
    if (tipo === 'promo') return '#B5651D';
    return '#CBB8A6';
  };

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>

        <View style={styles.header}>
          <View>
            <Text style={styles.titulo}>Notificacoes</Text>
            {naoLidas > 0 && <Text style={styles.badge}>{naoLidas} nao lidas</Text>}
          </View>
          {naoLidas > 0 && (
            <TouchableOpacity onPress={marcarTodasLidas}>
              <Text style={styles.marcarTodas}>Marcar todas como lidas</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filtros}>
          <TouchableOpacity
            style={filtro === 'todas' ? styles.filtroAtivo : styles.filtroInativo}
            onPress={() => setFiltro('todas')}
          >
            <Text style={filtro === 'todas' ? styles.filtroTextoAtivo : styles.filtroTexto}>Todas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={filtro === 'nao_lidas' ? styles.filtroAtivo : styles.filtroInativo}
            onPress={() => setFiltro('nao_lidas')}
          >
            <Text style={filtro === 'nao_lidas' ? styles.filtroTextoAtivo : styles.filtroTexto}>Nao lidas {naoLidas > 0 ? '(' + naoLidas + ')' : ''}</Text>
          </TouchableOpacity>
        </View>

        {filtradas.length === 0 && (
          <View style={styles.vazio}>
            <Text style={styles.vazioEmoji}>🔔</Text>
            <Text style={styles.vazioTexto}>Nenhuma notificacao</Text>
          </View>
        )}

        {filtradas.map((n) => (
          <TouchableOpacity
            key={n.id}
            style={n.lida ? styles.cardLida : styles.cardNaoLida}
            onPress={() => marcarLida(n.id)}
          >
            <View style={styles.cardEsquerda}>
              <View style={[styles.emojiCirculo, { backgroundColor: corTipo(n.tipo) + '22', borderColor: corTipo(n.tipo) }]}>
                <Text style={styles.emoji}>{n.emoji}</Text>
              </View>
            </View>
            <View style={styles.cardDireita}>
              <View style={styles.cardHeader}>
                <Text style={n.lida ? styles.tituloLido : styles.tituloNaoLido}>{n.titulo}</Text>
                <Text style={styles.hora}>{n.hora}</Text>
              </View>
              <Text style={styles.mensagem}>{n.mensagem}</Text>
              {!n.lida && <View style={styles.bolinha} />}
            </View>
          </TouchableOpacity>
        ))}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: '#E8DCCF' },
  container: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#6B4F3A' },
  badge: { color: '#C0392B', fontSize: 13, marginTop: 3 },
  marcarTodas: { color: '#D4AF7F', fontSize: 13, marginTop: 8 },
  filtros: { flexDirection: 'row', marginBottom: 20 },
  filtroAtivo: { backgroundColor: '#D4AF7F', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, marginRight: 10 },
  filtroInativo: { backgroundColor: '#F7F3EF', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, marginRight: 10 },
  filtroTextoAtivo: { color: '#4A3020', fontWeight: 'bold', fontSize: 13 },
  filtroTexto: { color: '#CBB8A6', fontSize: 13 },
  vazio: { alignItems: 'center', paddingVertical: 50 },
  vazioEmoji: { fontSize: 50, marginBottom: 15 },
  vazioTexto: { color: '#CBB8A6', fontSize: 16 },
  cardNaoLida: { backgroundColor: '#F7F3EF', borderRadius: 15, padding: 15, marginBottom: 12, flexDirection: 'row', borderLeftWidth: 3, borderLeftColor: '#D4AF7F', shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  cardLida: { backgroundColor: '#F7F3EF', borderRadius: 15, padding: 15, marginBottom: 12, flexDirection: 'row', opacity: 0.7 },
  cardEsquerda: { marginRight: 12 },
  emojiCirculo: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 22 },
  cardDireita: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  tituloNaoLido: { color: '#6B4F3A', fontWeight: 'bold', fontSize: 14, flex: 1, marginRight: 8 },
  tituloLido: { color: '#CBB8A6', fontSize: 14, flex: 1, marginRight: 8 },
  hora: { color: '#CBB8A6', fontSize: 12 },
  mensagem: { color: '#CBB8A6', fontSize: 13, lineHeight: 18 },
  bolinha: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D4AF7F', position: 'absolute', right: 0, top: 0 },
});