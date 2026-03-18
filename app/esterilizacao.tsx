import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../config-supabase';

const ETAPAS = [
  { id: 0, titulo: 'Sair de casa', emoji: '🚗', descricao: 'Confirme que saiu para o atendimento' },
  { id: 1, titulo: 'Chegou na cliente', emoji: '🏠', descricao: 'Confirme que chegou no endereco' },
  { id: 2, titulo: 'Esterilizacao', emoji: '🧴', descricao: 'Fotografe os materiais esterilizados' },
  { id: 3, titulo: 'Em atendimento', emoji: '✨', descricao: 'Atendimento em andamento' },
  { id: 4, titulo: 'Finalizado', emoji: '✅', descricao: 'Atendimento concluido!' },
];

export default function Esterilizacao() {
  const router = useRouter();
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [fotoEsterilizacao, setFotoEsterilizacao] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [timerAtivo, setTimerAtivo] = useState(false);
  const [pedidoAtual, setPedidoAtual] = useState<any>(null);
  const [profissional, setProfissional] = useState<any>(null);

  useEffect(() => {
    carregarDados();
    let interval: any;
    if (timerAtivo) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerAtivo]);

  async function carregarDados() {
    try {
      const dados = await AsyncStorage.getItem('pedido_atual');
      if (dados) setPedidoAtual(JSON.parse(dados));

      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        const { data: prof } = await supabase
          .from('profissionais')
          .select('id, recipient_id')
          .eq('usuario_id', auth.user.id)
          .single();
        if (prof) setProfissional(prof);
      }
    } catch (e) {
      console.log('Erro ao carregar dados:', e);
    }
  }

  async function finalizarAtendimento() {
    try {
      const liberarEm = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      const { data: auth } = await supabase.auth.getUser();

      if (pedidoAtual?.pagamento_id && auth?.user) {
        await supabase.from('pedidos')
          .update({
            status: 'aguardando_repasse',
            profissional_id: profissional?.id || null,
            recipient_id_profissional: profissional?.recipient_id || null,
            repasse_em: liberarEm,
            concluido_em: new Date().toISOString(),
          })
          .eq('pagamento_id', pedidoAtual.pagamento_id);
      }
    } catch (e) {
      console.log('Erro ao finalizar:', e);
    }
  }

  const minutos = Math.floor(timer / 60);
  const segundos = timer % 60;

  async function tirarFoto() {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      const permissaoGaleria = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissaoGaleria.granted) {
        Alert.alert('Permissao negada', 'Precisamos de acesso a sua camera ou galeria!');
        return;
      }
      const resultado = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.7,
      });
      if (!resultado.canceled) {
        setFotoEsterilizacao(resultado.assets[0].uri);
      }
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!resultado.canceled) {
      setFotoEsterilizacao(resultado.assets[0].uri);
    }
  }

  async function avancarEtapa() {
    if (etapaAtual === 2 && !fotoEsterilizacao) {
      Alert.alert('Foto obrigatoria!', 'Tire uma foto dos materiais esterilizados antes de continuar!');
      return;
    }

    if (etapaAtual === 3) {
      setTimerAtivo(true);
    }

    if (etapaAtual === 4) {
      setTimerAtivo(false);
      await finalizarAtendimento();
      Alert.alert('🎉 Parabens!', 'Atendimento finalizado! O pagamento sera liberado para voce em 2 horas.', [
        { text: 'OK', onPress: () => router.push('/profissional') }
      ]);
      return;
    }

    setEtapaAtual((prev) => prev + 1);
  }

  const botaoTexto = () => {
    if (etapaAtual === 0) return '🚗 Sai de casa agora';
    if (etapaAtual === 1) return '🏠 Cheguei na cliente';
    if (etapaAtual === 2) return '✅ Esterilizacao confirmada';
    if (etapaAtual === 3) return '✨ Iniciar atendimento';
    if (etapaAtual === 4) return '✅ Finalizar atendimento';
    return 'Continuar';
  };

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>
        <Text style={styles.titulo}>Atendimento</Text>

        <View style={styles.progressoRow}>
          {ETAPAS.map((e, index) => (
            <View
              key={e.id}
              style={[
                styles.progressoPonto,
                index < etapaAtual ? styles.progressoConcluido :
                index === etapaAtual ? styles.progressoAtual :
                styles.progressoPendente
              ]}
            />
          ))}
        </View>

        <View style={styles.etapaCard}>
          <Text style={styles.etapaEmoji}>{ETAPAS[etapaAtual].emoji}</Text>
          <Text style={styles.etapaTitulo}>{ETAPAS[etapaAtual].titulo}</Text>
          <Text style={styles.etapaDescricao}>{ETAPAS[etapaAtual].descricao}</Text>
        </View>

        {etapaAtual === 0 && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitulo}>📋 Detalhes do atendimento</Text>
            <Text style={styles.infoTexto}>Servico: Manicure simples</Text>
            <Text style={styles.infoTexto}>Cliente: Ana Silva</Text>
            <Text style={styles.infoTexto}>Horario: 09:00</Text>
            <Text style={styles.infoTexto}>Endereco: Rua das Flores, 123</Text>
          </View>
        )}

        {etapaAtual === 1 && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitulo}>🏠 Voce chegou!</Text>
            <Text style={styles.infoTexto}>Agora tire a foto dos materiais esterilizados na proxima etapa!</Text>
          </View>
        )}

        {etapaAtual === 2 && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitulo}>🧴 Foto obrigatoria</Text>
            <Text style={styles.infoTexto}>Fotografe todos os materiais que serao usados no atendimento!</Text>

            <TouchableOpacity style={styles.botaoFoto} onPress={tirarFoto}>
              <Text style={styles.botaoFotoTexto}>📷 {fotoEsterilizacao ? 'Tirar nova foto' : 'Fotografar materiais'}</Text>
            </TouchableOpacity>

            {fotoEsterilizacao && (
              <View style={styles.fotoContainer}>
                <Image source={{ uri: fotoEsterilizacao }} style={styles.foto} />
                <Text style={styles.fotoConfirmado}>✅ Foto registrada!</Text>
              </View>
            )}
          </View>
        )}

        {etapaAtual === 3 && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitulo}>✨ Pronto para iniciar!</Text>
            <Text style={styles.infoTexto}>Materiais esterilizados confirmados!</Text>
            <Text style={styles.infoTexto}>Clique abaixo para iniciar o atendimento!</Text>
          </View>
        )}

        {etapaAtual === 4 && (
          <View>
            <View style={styles.timerCard}>
              <Text style={styles.timerEmoji}>⏱️</Text>
              <Text style={styles.timerTexto}>Tempo de atendimento</Text>
              <Text style={styles.timerNumero}>{String(minutos).padStart(2, '0')}:{String(segundos).padStart(2, '0')}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitulo}>✨ Atendimento em andamento</Text>
              <Text style={styles.infoTexto}>Faca um otimo trabalho!</Text>
              <Text style={styles.infoTexto}>Quando terminar clique em Finalizar.</Text>
            </View>
          </View>
        )}

        <View style={styles.etapasLista}>
          {ETAPAS.map((e, index) => (
            <View key={e.id} style={styles.etapaItem}>
              <Text style={index <= etapaAtual ? styles.etapaItemEmojiAtivo : styles.etapaItemEmoji}>{e.emoji}</Text>
              <Text style={
                index < etapaAtual ? styles.etapaItemTextoConcluido :
                index === etapaAtual ? styles.etapaItemTextoAtual :
                styles.etapaItemTexto
              }>
                {e.titulo}
              </Text>
              {index < etapaAtual && <Text style={styles.check}>✓</Text>}
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.botao} onPress={avancarEtapa}>
          <Text style={styles.botaoTexto}>{botaoTexto()}</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: '#E8DCCF' },
  container: { padding: 20, paddingTop: 60 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#6B4F3A', marginBottom: 20, textAlign: 'center' },
  progressoRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  progressoPonto: { width: 14, height: 14, borderRadius: 7, marginHorizontal: 4 },
  progressoConcluido: { backgroundColor: '#7BAE7F' },
  progressoAtual: { backgroundColor: '#D4AF7F' },
  progressoPendente: { backgroundColor: '#D9CEC5' },
  etapaCard: { backgroundColor: '#F7F3EF', borderRadius: 15, padding: 25, marginBottom: 15, alignItems: 'center', borderWidth: 2, borderColor: '#D4AF7F', shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  etapaEmoji: { fontSize: 50, marginBottom: 10 },
  etapaTitulo: { color: '#6B4F3A', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  etapaDescricao: { color: '#CBB8A6', fontSize: 14, textAlign: 'center' },
  infoCard: { backgroundColor: '#F7F3EF', borderRadius: 15, padding: 20, marginBottom: 15, shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  infoTitulo: { color: '#D4AF7F', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  infoTexto: { color: '#6B4F3A', fontSize: 14, marginBottom: 5 },
  timerCard: { backgroundColor: '#F7F3EF', borderRadius: 15, padding: 20, marginBottom: 15, alignItems: 'center', borderWidth: 2, borderColor: '#7BAE7F', shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  timerEmoji: { fontSize: 30, marginBottom: 5 },
  timerTexto: { color: '#CBB8A6', fontSize: 13, marginBottom: 5 },
  timerNumero: { color: '#7BAE7F', fontSize: 40, fontWeight: 'bold' },
  botaoFoto: { backgroundColor: '#D4AF7F', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 15 },
  botaoFotoTexto: { color: '#4A3020', fontWeight: 'bold', fontSize: 15 },
  fotoContainer: { alignItems: 'center', marginTop: 15 },
  foto: { width: 220, height: 160, borderRadius: 10, marginBottom: 8 },
  fotoConfirmado: { color: '#7BAE7F', fontWeight: 'bold', fontSize: 14 },
  etapasLista: { backgroundColor: '#F7F3EF', borderRadius: 15, padding: 15, marginBottom: 20, shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  etapaItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#D9CEC5' },
  etapaItemEmoji: { fontSize: 20, marginRight: 10, opacity: 0.4 },
  etapaItemEmojiAtivo: { fontSize: 20, marginRight: 10 },
  etapaItemTexto: { color: '#CBB8A6', fontSize: 14, flex: 1 },
  etapaItemTextoAtual: { color: '#D4AF7F', fontSize: 14, fontWeight: 'bold', flex: 1 },
  etapaItemTextoConcluido: { color: '#7BAE7F', fontSize: 14, flex: 1 },
  check: { color: '#7BAE7F', fontWeight: 'bold', fontSize: 16 },
  botao: { width: '100%', backgroundColor: '#D4AF7F', borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 30 },
  botaoTexto: { color: '#4A3020', fontWeight: 'bold', fontSize: 16 },
});