import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { enderecoParaCoordenadas } from '../config-maps';

const dias = [
  { dia: 'SEG', data: '17/03' },
  { dia: 'TER', data: '18/03' },
  { dia: 'QUA', data: '19/03' },
  { dia: 'QUI', data: '20/03' },
  { dia: 'SEX', data: '21/03' },
  { dia: 'SAB', data: '22/03' },
];

const horarios = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00',
];

export default function Agendamento() {
  const router = useRouter();
  const [diaSelecionado, setDiaSelecionado] = useState('');
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [endereco, setEndereco] = useState('');
  const [carregando, setCarregando] = useState(false);

  function toggleHorario(h: string) {
    setSelecionados((prev) =>
      prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]
    );
  }

  async function continuar() {
    if (!endereco) {
      Alert.alert('Erro', 'Por favor informe o endereco do atendimento!');
      return;
    }
    if (!diaSelecionado) {
      Alert.alert('Erro', 'Por favor selecione um dia!');
      return;
    }
    if (selecionados.length === 0) {
      Alert.alert('Erro', 'Por favor selecione um horario!');
      return;
    }
    setCarregando(true);
    try {
      const coords = await enderecoParaCoordenadas(endereco);
      const dadosPedido = {
        endereco,
        data: diaSelecionado,
        horario: selecionados[0],
        latitude: coords ? coords.latitude : null,
        longitude: coords ? coords.longitude : null,
      };
      await AsyncStorage.setItem('pedido_atual', JSON.stringify(dadosPedido));
      router.push('/pagamento');
    } catch (e) {
      console.log('Erro:', e);
      router.push('/pagamento');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>
        <Text style={styles.titulo}>Agendamento</Text>

        <Text style={styles.label}>Endereco do atendimento</Text>
        <Text style={styles.dica}>Coloque o endereco onde voce quer ser atendida</Text>
        <TextInput
          style={styles.input}
          placeholder="Rua, numero, bairro, cidade"
          placeholderTextColor="#999"
          value={endereco}
          onChangeText={setEndereco}
        />

        <Text style={styles.label}>Selecione um dia</Text>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.diasScroll}>
          {dias.map((d) => (
            <TouchableOpacity
              key={d.data}
              style={diaSelecionado === d.data ? styles.diaAtivo : styles.diaInativo}
              onPress={() => setDiaSelecionado(d.data)}
            >
              <Text style={diaSelecionado === d.data ? styles.textoSelecionado : styles.diaTexto}>{d.dia}</Text>
              <Text style={diaSelecionado === d.data ? styles.textoSelecionado : styles.diaTexto}>{d.data}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Selecione um ou mais horarios</Text>
        <View style={styles.grade}>
          {horarios.map((h) => (
            <TouchableOpacity
              key={h}
              style={selecionados.includes(h) ? styles.hAtivo : styles.hInativo}
              onPress={() => toggleHorario(h)}
            >
              <Text style={selecionados.includes(h) ? styles.hTextoAtivo : styles.hTexto}>{h}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.botao} onPress={continuar} disabled={carregando}>
          <Text style={styles.botaoTexto}>{carregando ? 'Processando...' : 'Continuar'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: '#1a0a2e' },
  container: { padding: 20, paddingTop: 60 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#f0a500', marginBottom: 20 },
  label: { fontSize: 15, color: '#ffffff', marginBottom: 5, fontWeight: 'bold' },
  dica: { fontSize: 12, color: '#999', marginBottom: 10 },
  input: { width: '100%', backgroundColor: '#2d1b4e', borderRadius: 10, padding: 15, color: '#ffffff', marginBottom: 20, fontSize: 16 },
  diasScroll: { marginBottom: 25 },
  diaInativo: { borderWidth: 2, borderColor: '#2d1b4e', borderRadius: 12, padding: 12, marginRight: 10, alignItems: 'center', width: 70 },
  diaAtivo: { borderWidth: 2, borderColor: '#f0a500', borderRadius: 12, padding: 12, marginRight: 10, alignItems: 'center', width: 70, backgroundColor: '#2d1b4e' },
  diaTexto: { fontSize: 14, fontWeight: 'bold', color: '#999' },
  textoSelecionado: { fontSize: 14, fontWeight: 'bold', color: '#f0a500' },
  grade: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 30 },
  hInativo: { backgroundColor: '#2d1b4e', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 14, margin: 5 },
  hAtivo: { backgroundColor: '#2d1b4e', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 14, margin: 5, borderWidth: 2, borderColor: '#f0a500' },
  hTexto: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  hTextoAtivo: { color: '#f0a500', fontSize: 14, fontWeight: 'bold' },
  botao: { width: '100%', backgroundColor: '#f0a500', borderRadius: 10, padding: 15, alignItems: 'center' },
  botaoTexto: { color: '#1a0a2e', fontWeight: 'bold', fontSize: 16 },
});