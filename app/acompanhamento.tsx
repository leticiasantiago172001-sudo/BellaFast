import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const etapas = [
  { id: 1, titulo: 'Pedido confirmado', descricao: 'Seu pedido foi recebido e o pagamento aprovado!', icone: '✅' },
  { id: 2, titulo: 'Procurando profissional', descricao: 'Estamos encontrando a melhor profissional perto de voce!', icone: '🔍' },
  { id: 3, titulo: 'Profissional encontrada', descricao: 'Jessica Oliveira aceitou seu pedido!', icone: '💅' },
  { id: 4, titulo: 'A caminho', descricao: 'Jessica esta se preparando e a caminho da sua casa!', icone: '🛵' },
  { id: 5, titulo: 'Chegou!', descricao: 'Jessica chegou no seu endereco. Va abrir a porta!', icone: '🏠' },
  { id: 6, titulo: 'Em atendimento', descricao: 'Seu atendimento esta em andamento. Relaxa!', icone: '💆' },
  { id: 7, titulo: 'Concluido!', descricao: 'Atendimento finalizado! Que tal avaliar o servico?', icone: '🎉' },
];

export default function Acompanhamento() {
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [avaliacao, setAvaliacao] = useState(0);
  const [avaliado, setAvaliado] = useState(false);

  useEffect(() => {
    if (etapaAtual < 7) {
      const timer = setTimeout(() => setEtapaAtual(etapaAtual + 1), 3000);
      return () => clearTimeout(timer);
    }
  }, [etapaAtual]);

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>

        <Text style={styles.titulo}>Seu pedido</Text>
        <Text style={styles.subtitulo}>Manicure simples - 17/03 as 09:00</Text>

        <View style={styles.statusCard}>
          <Text style={styles.statusEmoji}>{etapas[etapaAtual - 1].icone}</Text>
          <Text style={styles.statusTitulo}>{etapas[etapaAtual - 1].titulo}</Text>
          <Text style={styles.statusDescricao}>{etapas[etapaAtual - 1].descricao}</Text>
        </View>

        <View style={styles.progressoContainer}>
          {etapas.map((e) => (
            <View key={e.id} style={styles.etapaRow}>
              <View style={styles.etapaEsquerda}>
                <View style={e.id <= etapaAtual ? styles.circuloAtivo : styles.circulo}>
                  <Text style={e.id <= etapaAtual ? styles.circuloTextoAtivo : styles.circuloTexto}>
                    {e.id <= etapaAtual ? '✓' : e.id}
                  </Text>
                </View>
                {e.id < 7 && <View style={e.id < etapaAtual ? styles.linhaAtiva : styles.linha} />}
              </View>
              <View style={styles.etapaDireita}>
                <Text style={e.id <= etapaAtual ? styles.etapaTituloAtivo : styles.etapaTituloInativo}>{e.titulo}</Text>
                {e.id === etapaAtual && (
                  <Text style={styles.etapaDescricaoAtiva}>{e.descricao}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitulo}>Detalhes do pedido</Text>
          <View style={styles.infoLinha}>
            <Text style={styles.infoLabel}>Profissional</Text>
            <Text style={styles.infoValor}>Jessica Oliveira</Text>
          </View>
          <View style={styles.infoLinha}>
            <Text style={styles.infoLabel}>Servico</Text>
            <Text style={styles.infoValor}>Manicure simples</Text>
          </View>
          <View style={styles.infoLinha}>
            <Text style={styles.infoLabel}>Endereco</Text>
            <Text style={styles.infoValor}>Rua das Flores, 123</Text>
          </View>
          <View style={styles.infoLinha}>
            <Text style={styles.infoLabel}>Pagamento</Text>
            <Text style={styles.infoValor}>PIX - R$ 45,00</Text>
          </View>
        </View>

        {etapaAtual === 7 && !avaliado && (
          <View style={styles.avaliacaoCard}>
            <Text style={styles.avaliacaoTitulo}>Como foi o atendimento?</Text>
            <Text style={styles.avaliacaoSubtitulo}>Avalie Jessica Oliveira</Text>
            <View style={styles.estrelasRow}>
              {[1, 2, 3, 4, 5].map((e) => (
                <TouchableOpacity key={e} onPress={() => setAvaliacao(e)}>
                  <Text style={[styles.estrela, { color: e <= avaliacao ? '#f0a500' : '#555' }]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            {avaliacao > 0 && (
              <TouchableOpacity style={styles.botaoAvaliar} onPress={() => setAvaliado(true)}>
                <Text style={styles.botaoAvaliarTexto}>Enviar avaliacao</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {avaliado && (
          <View style={styles.avaliadoCard}>
            <Text style={styles.avaliadoEmoji}>🌟</Text>
            <Text style={styles.avaliadoTexto}>Obrigada pela avaliacao!</Text>
          </View>
        )}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: '#1a0a2e' },
  container: { padding: 20, paddingTop: 60 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#f0a500', marginBottom: 4 },
  subtitulo: { fontSize: 14, color: '#999', marginBottom: 20 },
  statusCard: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 25, alignItems: 'center', marginBottom: 25, borderWidth: 2, borderColor: '#f0a500' },
  statusEmoji: { fontSize: 50, marginBottom: 10 },
  statusTitulo: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 8, textAlign: 'center' },
  statusDescricao: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 20 },
  progressoContainer: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 20, marginBottom: 20 },
  etapaRow: { flexDirection: 'row', marginBottom: 5 },
  etapaEsquerda: { alignItems: 'center', marginRight: 15 },
  circulo: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#555', alignItems: 'center', justifyContent: 'center' },
  circuloAtivo: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f0a500', alignItems: 'center', justifyContent: 'center' },
  circuloTexto: { color: '#555', fontSize: 12, fontWeight: 'bold' },
  circuloTextoAtivo: { color: '#1a0a2e', fontSize: 12, fontWeight: 'bold' },
  linha: { width: 2, height: 30, backgroundColor: '#555', marginVertical: 3 },
  linhaAtiva: { width: 2, height: 30, backgroundColor: '#f0a500', marginVertical: 3 },
  etapaDireita: { flex: 1, paddingBottom: 15 },
  etapaTituloAtivo: { color: '#ffffff', fontWeight: 'bold', fontSize: 14, marginTop: 4 },
  etapaTituloInativo: { color: '#555', fontSize: 14, marginTop: 4 },
  etapaDescricaoAtiva: { color: '#999', fontSize: 12, marginTop: 4, lineHeight: 18 },
  infoCard: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 20, marginBottom: 20 },
  infoTitulo: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  infoLinha: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  infoLabel: { color: '#999', fontSize: 14 },
  infoValor: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  avaliacaoCard: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 25, alignItems: 'center', marginBottom: 20 },
  avaliacaoTitulo: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  avaliacaoSubtitulo: { color: '#999', fontSize: 14, marginBottom: 20 },
  estrelasRow: { flexDirection: 'row', marginBottom: 20 },
  estrela: { fontSize: 45, marginHorizontal: 5 },
  botaoAvaliar: { width: '100%', backgroundColor: '#f0a500', borderRadius: 10, padding: 15, alignItems: 'center' },
  botaoAvaliarTexto: { color: '#1a0a2e', fontWeight: 'bold', fontSize: 16 },
  avaliadoCard: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 25, alignItems: 'center', marginBottom: 20 },
  avaliadoEmoji: { fontSize: 50, marginBottom: 10 },
  avaliadoTexto: { color: '#00cc66', fontSize: 18, fontWeight: 'bold' },
});