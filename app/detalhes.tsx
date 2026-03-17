import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const todosServicos: { [key: string]: { nome: string; preco: string }[] } = {
  Unhas: [
    { nome: 'Manicure simples', preco: 'R$ 45' },
    { nome: 'Manicure gel', preco: 'R$ 80' },
    { nome: 'Manicure + Pedicure', preco: 'R$ 75' },
    { nome: 'Pedicure simples', preco: 'R$ 40' },
  ],
  Cabelo: [
    { nome: 'Corte simples', preco: 'R$ 80' },
    { nome: 'Escova', preco: 'R$ 60' },
    { nome: 'Corte + Escova', preco: 'R$ 120' },
  ],
  Massagem: [
    { nome: 'Massagem relaxante 1h', preco: 'R$ 120' },
    { nome: 'Drenagem linfatica', preco: 'R$ 130' },
    { nome: 'Massagem modeladora', preco: 'R$ 130' },
  ],
  Depilacao: [
    { nome: 'Pernas completas', preco: 'R$ 80' },
    { nome: 'Axilas', preco: 'R$ 35' },
    { nome: 'Buco', preco: 'R$ 25' },
    { nome: 'Virilha', preco: 'R$ 45' },
    { nome: 'Corpo completo', preco: 'R$ 180' },
  ],
  Maquiagem: [
    { nome: 'Maquiagem social', preco: 'R$ 100' },
    { nome: 'Maquiagem noiva', preco: 'R$ 300' },
  ],
  Estetica: [
    { nome: 'Limpeza de pele', preco: 'R$ 90' },
    { nome: 'Peeling facial', preco: 'R$ 110' },
  ],
};

export default function Detalhes() {
  const router = useRouter();
  const { servico } = useLocalSearchParams();
  const nome = String(servico);
  const opcoes = todosServicos[nome] || [];

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>
        <Text style={styles.titulo}>{nome}</Text>
        <Text style={styles.subtitulo}>Escolha uma opcao</Text>

        {opcoes.map((opcao, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => router.push('/agendamento')}
          >
            <View style={styles.info}>
              <Text style={styles.nome}>{opcao.nome}</Text>
            </View>
            <Text style={styles.preco}>{opcao.preco}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: '#1a0a2e',
  },
  container: {
    padding: 20,
    paddingTop: 60,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f0a500',
    marginBottom: 5,
  },
  subtitulo: {
    fontSize: 14,
    color: '#999',
    marginBottom: 25,
  },
  card: {
    backgroundColor: '#2d1b4e',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
  },
  nome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  preco: {
    fontSize: 16,
    color: '#f0a500',
    fontWeight: 'bold',
  },
});