import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Pagamento() {
  const router = useRouter();
  const [metodoPagamento, setMetodoPagamento] = useState('');

  const metodos = [
    { id: 'pix', nome: 'PIX', emoji: '⚡', descricao: 'Aprovacao imediata' },
    { id: 'credito', nome: 'Cartao de Credito', emoji: '💳', descricao: 'Visa, Master, Elo' },
    { id: 'debito', nome: 'Cartao de Debito', emoji: '🏦', descricao: 'Visa, Master, Elo' },
  ];

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>
        <Text style={styles.titulo}>Pagamento</Text>

        <View style={styles.resumoCard}>
          <Text style={styles.resumoTitulo}>Resumo do pedido</Text>
          <View style={styles.resumoLinha}>
            <Text style={styles.resumoLabel}>Servico</Text>
            <Text style={styles.resumoValor}>Manicure simples</Text>
          </View>
          <View style={styles.resumoLinha}>
            <Text style={styles.resumoLabel}>Data</Text>
            <Text style={styles.resumoValor}>17/03 as 09:00</Text>
          </View>
          <View style={styles.separador} />
          <View style={styles.resumoLinha}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValor}>R$ 45,00</Text>
          </View>
        </View>

        <Text style={styles.label}>Como quer pagar?</Text>

        {metodos.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={metodoPagamento === m.id ? styles.metodoAtivo : styles.metodo}
            onPress={() => setMetodoPagamento(m.id)}
          >
            <Text style={styles.metodoEmoji}>{m.emoji}</Text>
            <View style={styles.metodoInfo}>
              <Text style={styles.metodoNome}>{m.nome}</Text>
              <Text style={styles.metodoDescricao}>{m.descricao}</Text>
            </View>
            {metodoPagamento === m.id && (
              <Text style={styles.check}>✓</Text>
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.botao}
          onPress={() => router.push('/confirmacao')}
        >
          <Text style={styles.botaoTexto}>Confirmar pagamento</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: '#1a0a2e' },
  container: { padding: 20, paddingTop: 60 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#f0a500', marginBottom: 25 },
  resumoCard: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 20, marginBottom: 25 },
  resumoTitulo: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 15 },
  resumoLinha: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  resumoLabel: { color: '#999', fontSize: 14 },
  resumoValor: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  separador: { height: 1, backgroundColor: '#444', marginVertical: 10 },
  totalLabel: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  totalValor: { color: '#f0a500', fontSize: 18, fontWeight: 'bold' },
  label: { fontSize: 16, color: '#ffffff', fontWeight: 'bold', marginBottom: 15 },
  metodo: { backgroundColor: '#2d1b4e', borderRadius: 12, padding: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#2d1b4e' },
  metodoAtivo: { backgroundColor: '#2d1b4e', borderRadius: 12, padding: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#f0a500' },
  metodoEmoji: { fontSize: 28, marginRight: 15 },
  metodoInfo: { flex: 1 },
  metodoNome: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  metodoDescricao: { color: '#999', fontSize: 13, marginTop: 2 },
  check: { color: '#f0a500', fontSize: 22, fontWeight: 'bold' },
  botao: { width: '100%', backgroundColor: '#f0a500', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 20 },
  botaoTexto: { color: '#1a0a2e', fontWeight: 'bold', fontSize: 16 },
});