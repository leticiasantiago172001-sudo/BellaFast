import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Timer() {
  const router = useRouter();
  const [segundos, setSegundos] = useState(300);
  const [aceito, setAceito] = useState(false);
  const [recusado, setRecusado] = useState(false);

  useEffect(() => {
    if (aceito || recusado) return;
    if (segundos === 0) {
      setRecusado(true);
      return;
    }
    const timer = setTimeout(() => setSegundos(segundos - 1), 1000);
    return () => clearTimeout(timer);
  }, [segundos, aceito, recusado]);

  const minutos = Math.floor(segundos / 60);
  const segs = segundos % 60;
  const porcentagem = (segundos / 300) * 100;
  const corTimer = segundos > 150 ? '#00cc66' : segundos > 60 ? '#f0a500' : '#ff4444';

  if (aceito) {
    return (
      <View style={styles.container}>
        <Text style={styles.sucessoEmoji}>✅</Text>
        <Text style={styles.sucessoTitulo}>Pedido aceito!</Text>
        <Text style={styles.sucessoDescricao}>Otimo! A cliente foi notificada. Prepare-se para o atendimento!</Text>
        <TouchableOpacity style={styles.botaoVerde} onPress={() => router.push('/esterilizacao')}>
          <Text style={styles.botaoVerdeTexto}>Ver detalhes do atendimento</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (recusado || segundos === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.falhaEmoji}>⏰</Text>
        <Text style={styles.falhaTitulo}>Tempo esgotado!</Text>
        <Text style={styles.falhaDescricao}>O pedido foi enviado para outra profissional disponivel.</Text>
        <TouchableOpacity style={styles.botaoVoltar} onPress={() => router.push('/profissional')}>
          <Text style={styles.botaoVoltarTexto}>Voltar para pedidos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Novo pedido!</Text>
      <Text style={styles.subtitulo}>Voce tem 5 minutos para aceitar</Text>

      <View style={styles.timerCirculo}>
        <Text style={[styles.timerNumero, { color: corTimer }]}>
          {String(minutos).padStart(2, '0')}:{String(segs).padStart(2, '0')}
        </Text>
        <Text style={styles.timerLabel}>restantes</Text>
      </View>

      <View style={styles.barraFundo}>
        <View style={[styles.barraProgresso, { width: porcentagem as any, backgroundColor: corTimer }]} />
      </View>

      <View style={styles.pedidoCard}>
        <Text style={styles.pedidoTitulo}>Detalhes do pedido</Text>
        <View style={styles.linha}>
          <Text style={styles.label}>Cliente</Text>
          <Text style={styles.valor}>Ana Silva</Text>
        </View>
        <View style={styles.linha}>
          <Text style={styles.label}>Servico</Text>
          <Text style={styles.valor}>Manicure simples</Text>
        </View>
        <View style={styles.linha}>
          <Text style={styles.label}>Data</Text>
          <Text style={styles.valor}>17/03 as 09:00</Text>
        </View>
        <View style={styles.linha}>
          <Text style={styles.label}>Distancia</Text>
          <Text style={styles.distancia}>0.8 km de voce</Text>
        </View>
        <View style={styles.linha}>
          <Text style={styles.label}>Valor</Text>
          <Text style={styles.valorDestaque}>R$ 45,00</Text>
        </View>
      </View>

      <View style={styles.botoesRow}>
        <TouchableOpacity style={styles.botaoRecusar} onPress={() => setRecusado(true)}>
          <Text style={styles.botaoRecusarTexto}>Recusar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botaoAceitar} onPress={() => setAceito(true)}>
          <Text style={styles.botaoAceitarTexto}>Aceitar!</Text>
        </TouchableOpacity>
      </View>

      {segundos <= 30 && (
        <Text style={styles.avisoUrgente}>Menos de 30 segundos! O pedido sera repassado em breve!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e', padding: 20, paddingTop: 60, alignItems: 'center' },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#f0a500', marginBottom: 5 },
  subtitulo: { fontSize: 14, color: '#999', marginBottom: 30 },
  timerCirculo: { width: 150, height: 150, borderRadius: 75, borderWidth: 6, borderColor: '#2d1b4e', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  timerNumero: { fontSize: 36, fontWeight: 'bold' },
  timerLabel: { color: '#999', fontSize: 13 },
  barraFundo: { width: '100%', height: 8, backgroundColor: '#2d1b4e', borderRadius: 4, marginBottom: 25 },
  barraProgresso: { height: 8, borderRadius: 4 },
  pedidoCard: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 20, width: '100%', marginBottom: 20 },
  pedidoTitulo: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  linha: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { color: '#999', fontSize: 14 },
  valor: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  distancia: { color: '#00cc66', fontSize: 14, fontWeight: 'bold' },
  valorDestaque: { color: '#f0a500', fontSize: 16, fontWeight: 'bold' },
  botoesRow: { flexDirection: 'row', width: '100%' },
  botaoRecusar: { flex: 1, borderWidth: 2, borderColor: '#ff4444', borderRadius: 10, padding: 15, alignItems: 'center', marginRight: 10 },
  botaoRecusarTexto: { color: '#ff4444', fontWeight: 'bold', fontSize: 16 },
  botaoAceitar: { flex: 1, backgroundColor: '#f0a500', borderRadius: 10, padding: 15, alignItems: 'center' },
  botaoAceitarTexto: { color: '#1a0a2e', fontWeight: 'bold', fontSize: 16 },
  avisoUrgente: { color: '#ff4444', fontWeight: 'bold', textAlign: 'center', marginTop: 15, fontSize: 13 },
  sucessoEmoji: { fontSize: 80, marginBottom: 20 },
  sucessoTitulo: { fontSize: 26, fontWeight: 'bold', color: '#00cc66', marginBottom: 10 },
  sucessoDescricao: { color: '#999', textAlign: 'center', fontSize: 14, marginBottom: 30 },
  botaoVerde: { width: '100%', backgroundColor: '#00cc66', borderRadius: 10, padding: 15, alignItems: 'center' },
  botaoVerdeTexto: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  falhaEmoji: { fontSize: 80, marginBottom: 20 },
  falhaTitulo: { fontSize: 26, fontWeight: 'bold', color: '#ff4444', marginBottom: 10 },
  falhaDescricao: { color: '#999', textAlign: 'center', fontSize: 14, marginBottom: 30 },
  botaoVoltar: { width: '100%', borderWidth: 2, borderColor: '#f0a500', borderRadius: 10, padding: 15, alignItems: 'center' },
  botaoVoltarTexto: { color: '#f0a500', fontWeight: 'bold', fontSize: 16 },
});