import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SERVICOS_DETALHES: any = {
  unhas: {
    nome: 'Unhas',
    emoji: '💅',
    itens: [
      { nome: 'Teste R$1', preco: 1 },
      { nome: 'Manicure simples', preco: 45 },
      { nome: 'Pedicure simples', preco: 45 },
      { nome: 'Manicure + Pedicure', preco: 80 },
      { nome: 'Alongamento em gel', preco: 150 },
    ],
  },
  cabelo: {
    nome: 'Cabelo',
    emoji: '✂️',
    itens: [
      { nome: 'Escova', preco: 60 },
      { nome: 'Corte', preco: 80 },
      { nome: 'Corte + Escova', preco: 120 },
      { nome: 'Babyliss ou Chapinha', preco: 70 },
    ],
  },
  massagem: {
    nome: 'Massagem',
    emoji: '🌿',
    itens: [
      { nome: 'Massagem relaxante 60min', preco: 120 },
      { nome: 'Massagem relaxante 90min', preco: 160 },
      { nome: 'Drenagem linfatica', preco: 130 },
    ],
  },
  depilacao: {
    nome: 'Depilacao',
    emoji: '✨',
    itens: [
      { nome: 'Pernas completas', preco: 60 },
      { nome: 'Axilas', preco: 25 },
      { nome: 'Buço', preco: 20 },
      { nome: 'Virilha completa', preco: 55 },
      { nome: 'Corpo completo', preco: 150 },
    ],
  },
  maquiagem: {
    nome: 'Maquiagem',
    emoji: '💄',
    itens: [
      { nome: 'Maquiagem', preco: 100 },
      { nome: 'Maquiagem + Cilios', preco: 115 },
    ],
  },
  estetica: {
    nome: 'Estetica',
    emoji: '🌸',
    itens: [
      { nome: 'Limpeza de pele simples', preco: 90 },
      { nome: 'Limpeza de pele profunda', preco: 130 },
      { nome: 'Peeling facial', preco: 110 },
      { nome: 'Design de sobrancelha', preco: 40 },
    ],
  },
};

export default function Detalhes() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const servicoId = params.servico as string || 'unhas';
  const servico = SERVICOS_DETALHES[servicoId] || SERVICOS_DETALHES['unhas'];

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>

        <TouchableOpacity style={styles.voltar} onPress={() => router.back()}>
          <Text style={styles.voltarTexto}>← Voltar</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.emoji}>{servico.emoji}</Text>
          <Text style={styles.titulo}>{servico.nome}</Text>
        </View>

        <Text style={styles.subtitulo}>Escolha o servico desejado</Text>

        {servico.itens.map((item: any, index: number) => (
          <TouchableOpacity
            key={index}
            style={styles.itemCard}
            onPress={() => router.push({
              pathname: '/agendamento',
              params: { servico: item.nome, preco: item.preco }
            })}
          >
            <View style={styles.itemInfo}>
              <Text style={styles.itemNome}>{item.nome}</Text>
              <Text style={styles.itemPreco}>R$ {item.preco},00</Text>
            </View>
            <Text style={styles.itemSeta}>→</Text>
          </TouchableOpacity>
        ))}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: '#E8DCCF' },
  container: { padding: 20, paddingTop: 60 },
  voltar: { marginBottom: 20 },
  voltarTexto: { color: '#D4AF7F', fontSize: 16, fontWeight: 'bold' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  emoji: { fontSize: 40, marginRight: 15 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#6B4F3A' },
  subtitulo: { color: '#CBB8A6', fontSize: 14, marginBottom: 25 },
  itemCard: { backgroundColor: '#F7F3EF', borderRadius: 15, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  itemInfo: { flex: 1 },
  itemNome: { color: '#6B4F3A', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  itemPreco: { color: '#D4AF7F', fontSize: 14 },
  itemSeta: { color: '#D4AF7F', fontSize: 20, fontWeight: 'bold' },
});