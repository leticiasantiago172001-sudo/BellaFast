import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { enderecoParaCoordenadas } from '../config-maps';
import { supabase } from '../config-supabase';

const NOMES_DIAS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

function gerarProximosDias(quantidade = 14) {
  const hoje = new Date();
  return Array.from({ length: quantidade }, (_, i) => {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + i);
    return {
      dia: NOMES_DIAS[d.getDay()],
      data: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
    };
  });
}

const DIAS = gerarProximosDias();

const HORARIOS = [
  '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00',
];

export default function Agendamento() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [diaSelecionado, setDiaSelecionado] = useState('');
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [enderecos, setEnderecos] = useState<string[]>([]);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState('');
  const [adicionandoEndereco, setAdicionandoEndereco] = useState(false);
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);

  const agora = new Date();
  const hojeData = `${String(agora.getDate()).padStart(2, '0')}/${String(agora.getMonth() + 1).padStart(2, '0')}`;
  const horaAtual = agora.getHours();
  const minutoAtual = agora.getMinutes();
  const ehHoje = (data: string) => data === hojeData;
  const taxaUrgencia = ehHoje(diaSelecionado);

  useEffect(() => {
    carregarEnderecos();
  }, []);

  async function carregarEnderecos() {
    try {
      const { data: usuarioAuth } = await supabase.auth.getUser();
      if (!usuarioAuth?.user) return;
      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('enderecos')
        .eq('email', usuarioAuth.user.email)
        .single();
      if (usuarioData?.enderecos) {
        const lista = JSON.parse(usuarioData.enderecos);
        setEnderecos(lista);
        if (lista.length > 0) setEnderecoSelecionado(lista[0]);
      }
    } catch (e) {
      console.log('Erro:', e);
    }
  }

  function horarioPermitido(h: string) {
    const [hora, min] = h.split(':').map(Number);
    if (!ehHoje(diaSelecionado)) return true;
    const totalMinutosHorario = hora * 60 + min;
    const totalMinutosAgora = horaAtual * 60 + minutoAtual;
    return totalMinutosHorario >= totalMinutosAgora + 240;
  }

  function toggleHorario(h: string) {
    if (!horarioPermitido(h)) {
      Alert.alert('Horario indisponivel', 'Este horario precisa de pelo menos 4 horas de antecedencia!');
      return;
    }
    if (!selecionados.includes(h) && selecionados.length >= 3) {
      Alert.alert('Limite atingido!', 'Voce pode selecionar no maximo 3 horarios!');
      return;
    }
    setSelecionados((prev) =>
      prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]
    );
  }

  async function buscarCep(cepDigitado: string) {
    const cepLimpo = cepDigitado.replace(/\D/g, '');
    setCep(cepDigitado);
    if (cepLimpo.length === 8) {
      setBuscandoCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await response.json();
        if (data.erro) {
          Alert.alert('CEP nao encontrado!');
          return;
        }
        setRua(data.logradouro || '');
        setBairro(data.bairro || '');
        setCidade(data.localidade || '');
        setEstado(data.uf || '');
      } catch (e) {
        Alert.alert('Erro', 'Nao foi possivel buscar o CEP!');
      } finally {
        setBuscandoCep(false);
      }
    }
  }

  async function salvarNovoEndereco() {
    if (!rua || !numero || !cidade) {
      Alert.alert('Erro', 'Preencha rua, numero e cidade!');
      return;
    }
    const enderecoCompleto = `${rua}, ${numero}, ${bairro}, ${cidade}, ${estado}`;
    const novosEnderecos = [...enderecos, enderecoCompleto];
    try {
      const { data: usuarioAuth } = await supabase.auth.getUser();
      if (!usuarioAuth?.user) return;
      await supabase.from('usuarios').update({ enderecos: JSON.stringify(novosEnderecos) }).eq('email', usuarioAuth.user.email);
      setEnderecos(novosEnderecos);
      setEnderecoSelecionado(enderecoCompleto);
      setCep(''); setRua(''); setNumero(''); setBairro(''); setCidade(''); setEstado('');
      setAdicionandoEndereco(false);
      Alert.alert('✅ Endereco salvo!');
    } catch (e) {
      Alert.alert('Erro', 'Nao foi possivel salvar!');
    }
  }

  async function continuar() {
    if (!enderecoSelecionado) {
      Alert.alert('Erro', 'Por favor informe o endereco do atendimento!');
      return;
    }
    if (!diaSelecionado) {
      Alert.alert('Erro', 'Por favor selecione um dia!');
      return;
    }
    if (selecionados.length < 3) {
      Alert.alert('Selecione mais horarios!', `Voce selecionou ${selecionados.length} horario(s). Selecione exatamente 3!`);
      return;
    }
    setCarregando(true);
    try {
      const coords = await enderecoParaCoordenadas(enderecoSelecionado);
      const valorBase = parseFloat(String(params.preco || 45));
      const valorFinal = taxaUrgencia ? valorBase + 10 : valorBase;
      const dadosPedido = {
        servico: params.servico || 'Servico BellaFast',
        endereco: enderecoSelecionado,
        data: diaSelecionado,
        horario: selecionados[0],
        horarios: selecionados,
        latitude: coords ? coords.latitude : null,
        longitude: coords ? coords.longitude : null,
        taxaUrgencia,
        valorFinal,
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

        {enderecos.length > 0 && !adicionandoEndereco && (
          <View>
            {enderecos.map((e, i) => (
              <TouchableOpacity
                key={i}
                style={enderecoSelecionado === e ? styles.enderecoAtivo : styles.enderecoInativo}
                onPress={() => setEnderecoSelecionado(e)}
              >
                <Text style={styles.enderecoEmoji}>📍</Text>
                <Text style={enderecoSelecionado === e ? styles.enderecoTextoAtivo : styles.enderecoTexto} numberOfLines={1}>{e}</Text>
                {enderecoSelecionado === e && <Text style={styles.enderecoCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.botaoOutroEndereco} onPress={() => setAdicionandoEndereco(true)}>
              <Text style={styles.botaoOutroEnderecoTexto}>+ Usar outro endereco</Text>
            </TouchableOpacity>
          </View>
        )}

        {(enderecos.length === 0 || adicionandoEndereco) && (
          <View style={styles.novoEnderecoContainer}>
            <Text style={styles.dica}>Digite seu CEP para preencher automaticamente</Text>
            <View style={styles.cepRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 10 }]}
                placeholder="CEP"
                placeholderTextColor="#CBB8A6"
                keyboardType="numeric"
                maxLength={9}
                value={cep}
                onChangeText={buscarCep}
              />
              {buscandoCep && <Text style={styles.buscando}>Buscando...</Text>}
            </View>
            <TextInput style={styles.input} placeholder="Rua" placeholderTextColor="#CBB8A6" value={rua} onChangeText={setRua} />
            <TextInput style={styles.input} placeholder="Numero" placeholderTextColor="#CBB8A6" keyboardType="numeric" value={numero} onChangeText={setNumero} />
            <TextInput style={styles.input} placeholder="Bairro" placeholderTextColor="#CBB8A6" value={bairro} onChangeText={setBairro} />
            <TextInput style={[styles.input, { opacity: 0.6 }]} placeholder="Cidade" placeholderTextColor="#CBB8A6" value={cidade} editable={false} />
            <TextInput style={[styles.input, { opacity: 0.6 }]} placeholder="Estado" placeholderTextColor="#CBB8A6" value={estado} editable={false} />

            <TouchableOpacity style={styles.botaoSalvarEndereco} onPress={salvarNovoEndereco}>
              <Text style={styles.botaoSalvarEnderecoTexto}>💾 Salvar e usar este endereco</Text>
            </TouchableOpacity>

            {adicionandoEndereco && (
              <TouchableOpacity style={styles.botaoCancelar} onPress={() => setAdicionandoEndereco(false)}>
                <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text style={styles.label}>Selecione um dia</Text>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.diasScroll}>
          {DIAS.map((d) => (
            <TouchableOpacity
              key={d.data}
              style={diaSelecionado === d.data ? styles.diaAtivo : styles.diaInativo}
              onPress={() => { setDiaSelecionado(d.data); setSelecionados([]); }}
            >
              <Text style={diaSelecionado === d.data ? styles.textoSelecionado : styles.diaTexto}>{d.dia}</Text>
              <Text style={diaSelecionado === d.data ? styles.textoSelecionado : styles.diaTexto}>{d.data}</Text>
              {ehHoje(d.data) && <Text style={styles.urgenciaTag}>+R$10</Text>}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {taxaUrgencia && (
          <View style={styles.urgenciaCard}>
            <Text style={styles.urgenciaEmoji}>⚡</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.urgenciaTitulo}>Taxa de urgencia!</Text>
              <Text style={styles.urgenciaTexto}>Agendamentos no mesmo dia tem taxa de R$ 10,00 a mais.</Text>
            </View>
          </View>
        )}

        <Text style={styles.label}>
          Selecione exatamente 3 horarios
          {selecionados.length > 0 && <Text style={styles.contador}> ({selecionados.length}/3)</Text>}
        </Text>
        <Text style={styles.dica}>Selecione 3 horarios de preferencia!</Text>

        {!diaSelecionado ? (
          <View style={styles.avisoCard}>
            <Text style={styles.avisoTexto}>👆 Selecione um dia primeiro!</Text>
          </View>
        ) : (
          <View style={styles.grade}>
            {HORARIOS.map((h) => {
              const permitido = horarioPermitido(h);
              const selecionado = selecionados.includes(h);
              const bloqueadoPorLimite = !selecionado && selecionados.length >= 3;
              return (
                <TouchableOpacity
                  key={h}
                  style={!permitido || bloqueadoPorLimite ? styles.hBloqueado : selecionado ? styles.hAtivo : styles.hInativo}
                  onPress={() => toggleHorario(h)}
                  disabled={!permitido || bloqueadoPorLimite}
                >
                  <Text style={!permitido || bloqueadoPorLimite ? styles.hTextoBloqueado : selecionado ? styles.hTextoAtivo : styles.hTexto}>{h}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {selecionados.length === 3 && (
          <View style={styles.sucessoCard}>
            <Text style={styles.sucessoTexto}>✅ {selecionados.join(' • ')}</Text>
          </View>
        )}

        <TouchableOpacity
          style={carregando ? styles.botaoDesabilitado : styles.botao}
          onPress={continuar}
          disabled={carregando}
        >
          <Text style={styles.botaoTexto}>{carregando ? 'Processando...' : 'Continuar'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: '#E8DCCF' },
  container: { padding: 20, paddingTop: 60 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#6B4F3A', marginBottom: 20 },
  label: { fontSize: 15, color: '#6B4F3A', marginBottom: 8, fontWeight: 'bold', marginTop: 10 },
  dica: { fontSize: 12, color: '#CBB8A6', marginBottom: 10 },
  enderecoAtivo: { backgroundColor: '#D4AF7F', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  enderecoInativo: { backgroundColor: '#F7F3EF', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D9CEC5' },
  enderecoEmoji: { fontSize: 16, marginRight: 8 },
  enderecoTextoAtivo: { color: '#4A3020', fontSize: 13, fontWeight: 'bold', flex: 1 },
  enderecoTexto: { color: '#CBB8A6', fontSize: 13, flex: 1 },
  enderecoCheck: { color: '#4A3020', fontWeight: 'bold', fontSize: 16 },
  botaoOutroEndereco: { borderWidth: 1, borderColor: '#D4AF7F', borderStyle: 'dashed', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 15 },
  botaoOutroEnderecoTexto: { color: '#D4AF7F', fontSize: 13, fontWeight: 'bold' },
  novoEnderecoContainer: { marginBottom: 10 },
  input: { width: '100%', backgroundColor: '#F7F3EF', borderRadius: 10, padding: 15, color: '#6B4F3A', marginBottom: 12, fontSize: 16, shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  cepRow: { flexDirection: 'row', alignItems: 'center' },
  buscando: { color: '#D4AF7F', fontSize: 13 },
  botaoSalvarEndereco: { backgroundColor: '#D4AF7F', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 10 },
  botaoSalvarEnderecoTexto: { color: '#4A3020', fontWeight: 'bold', fontSize: 14 },
  botaoCancelar: { borderWidth: 2, borderColor: '#C0392B', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 15 },
  botaoCancelarTexto: { color: '#C0392B', fontWeight: 'bold' },
  diasScroll: { marginBottom: 15 },
  diaInativo: { borderWidth: 2, borderColor: '#D9CEC5', borderRadius: 12, padding: 12, marginRight: 10, alignItems: 'center', width: 75, backgroundColor: '#F7F3EF' },
  diaAtivo: { borderWidth: 2, borderColor: '#D4AF7F', borderRadius: 12, padding: 12, marginRight: 10, alignItems: 'center', width: 75, backgroundColor: '#F7F3EF' },
  diaTexto: { fontSize: 13, fontWeight: 'bold', color: '#CBB8A6' },
  textoSelecionado: { fontSize: 13, fontWeight: 'bold', color: '#D4AF7F' },
  urgenciaTag: { color: '#C0392B', fontSize: 10, fontWeight: 'bold', marginTop: 3 },
  urgenciaCard: { backgroundColor: '#F7F3EF', borderRadius: 12, padding: 15, marginBottom: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#C0392B' },
  urgenciaEmoji: { fontSize: 28, marginRight: 12 },
  urgenciaTitulo: { color: '#C0392B', fontWeight: 'bold', fontSize: 14, marginBottom: 3 },
  urgenciaTexto: { color: '#CBB8A6', fontSize: 12 },
  contador: { color: '#D4AF7F', fontSize: 13 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  hInativo: { backgroundColor: '#F7F3EF', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 14, margin: 5, borderWidth: 1, borderColor: '#D9CEC5' },
  hAtivo: { backgroundColor: '#D4AF7F', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 14, margin: 5 },
  hBloqueado: { backgroundColor: '#E8DCCF', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 14, margin: 5, opacity: 0.4 },
  hTexto: { color: '#6B4F3A', fontSize: 14, fontWeight: 'bold' },
  hTextoAtivo: { color: '#4A3020', fontSize: 14, fontWeight: 'bold' },
  hTextoBloqueado: { color: '#CBB8A6', fontSize: 14 },
  avisoCard: { backgroundColor: '#F7F3EF', borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#D4AF7F' },
  avisoTexto: { color: '#D4AF7F', fontSize: 13, textAlign: 'center' },
  sucessoCard: { backgroundColor: '#F7F3EF', borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#7BAE7F' },
  sucessoTexto: { color: '#7BAE7F', fontSize: 13, textAlign: 'center', fontWeight: 'bold' },
  botao: { width: '100%', backgroundColor: '#D4AF7F', borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 30 },
  botaoDesabilitado: { width: '100%', backgroundColor: '#CBB8A6', borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 30 },
  botaoTexto: { color: '#4A3020', fontWeight: 'bold', fontSize: 16 },
});