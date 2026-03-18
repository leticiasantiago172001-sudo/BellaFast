import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { enderecoParaCoordenadas } from '../config-maps';
import { supabase } from '../config-supabase';

const CATEGORIAS = [
  { id: 'unhas', nome: 'Unhas', emoji: '💅' },
  { id: 'cabelo', nome: 'Cabelo', emoji: '✂️' },
  { id: 'massagem', nome: 'Massagem', emoji: '🌿' },
  { id: 'depilacao', nome: 'Depilacao', emoji: '✨' },
  { id: 'maquiagem', nome: 'Maquiagem', emoji: '💄' },
  { id: 'estetica', nome: 'Estetica', emoji: '🌸' },
];

export default function CadastroProfissional() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>([]);
  const [raio, setRaio] = useState('10');
  const [carregando, setCarregando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [certificados, setCertificados] = useState<string[]>([]);
  const [tipoDocumento, setTipoDocumento] = useState<'cpf' | 'cnpj'>('cpf');
  const [cpf, setCpf] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [banco, setBanco] = useState('');
  const [agencia, setAgencia] = useState('');
  const [conta, setConta] = useState('');
  const [digitoConta, setDigitoConta] = useState('');
  const [tipoConta, setTipoConta] = useState<'corrente' | 'poupanca'>('corrente');

  function toggleCategoria(id: string) {
    setCategoriasSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
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
          Alert.alert('CEP nao encontrado', 'Verifique o CEP e tente novamente!');
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

  async function adicionarCertificado() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissao negada', 'Precisamos de acesso a sua galeria!');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
    });
    if (!resultado.canceled) {
      setCertificados((prev) => [...prev, resultado.assets[0].uri]);
    }
  }

  async function tirarFotoCertificado() {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissao negada', 'Precisamos de acesso a sua camera!');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.7,
    });
    if (!resultado.canceled) {
      setCertificados((prev) => [...prev, resultado.assets[0].uri]);
    }
  }

  function removerCertificado(index: number) {
    setCertificados((prev) => prev.filter((_, i) => i !== index));
  }

  async function cadastrar() {
    if (!nome || !email || !senha || !telefone || !cpf || !cep || !rua || !numero) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatorios!');
      return;
    }
    if (tipoDocumento === 'cnpj' && !razaoSocial) {
      Alert.alert('Erro', 'Preencha a razao social da empresa!');
      return;
    }
    if (categoriasSelecionadas.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos uma especialidade!');
      return;
    }
    if (!banco || !agencia || !conta || !digitoConta) {
      Alert.alert('Erro', 'Preencha todos os dados bancarios!');
      return;
    }
    setCarregando(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password: senha });
      if (error) {
        Alert.alert('Erro', error.message);
        return;
      }
      const enderecoCompleto = `${rua}, ${numero}, ${bairro}, ${cidade}, ${estado}`;
      const coords = await enderecoParaCoordenadas(enderecoCompleto);

      await supabase.from('usuarios').insert({
        nome, email, telefone, cpf: cpf.replace(/\D/g, ''), tipo: 'profissional',
      });

      const { data: profData } = await supabase.from('profissionais').insert({
        usuario_id: data.user?.id,
        especialidades: categoriasSelecionadas.join(', '),
        endereco: enderecoCompleto,
        cidade,
        raio_atendimento: parseInt(raio),
        avaliacao: 5.0,
        total_atendimentos: 0,
        status: 'em_analise',
        latitude: coords ? coords.latitude : null,
        longitude: coords ? coords.longitude : null,
        endereco_completo: enderecoCompleto,
      }).select().single();

      const { data: recipientData } = await supabase.functions.invoke('cadastrar-recebedor', {
        body: {
          nome: tipoDocumento === 'cnpj' ? razaoSocial : nome,
          email,
          documento: cpf.replace(/\D/g, ''),
          tipo_pessoa: tipoDocumento === 'cnpj' ? 'company' : 'individual',
          telefone: telefone.replace(/\D/g, ''),
          banco,
          agencia: agencia.replace(/\D/g, ''),
          conta: conta.replace(/\D/g, ''),
          digito: digitoConta,
          tipo_conta: tipoConta,
          usuario_id: data.user?.id,
        },
      });

      if (recipientData?.recipient_id) {
        await supabase.from('profissionais').update({
          recipient_id: recipientData.recipient_id,
        }).eq('usuario_id', data.user?.id);
      }

      Alert.alert(
        'Cadastro enviado! ⏳',
        'Seus dados foram enviados para analise. Voce sera notificada quando for aprovada!',
        [{ text: 'OK', onPress: () => router.push('/') }]
      );
    } catch (e) {
      Alert.alert('Erro', 'Algo deu errado. Tente novamente!');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>
        <Text style={styles.logo}>BellaFast</Text>
        <Text style={styles.titulo}>Cadastro Profissional</Text>

        <TextInput style={styles.input} placeholder="Seu nome completo" placeholderTextColor="#CBB8A6" value={nome} onChangeText={setNome} />
        <TextInput style={styles.input} placeholder="Seu email" placeholderTextColor="#CBB8A6" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Crie uma senha" placeholderTextColor="#CBB8A6" secureTextEntry={true} value={senha} onChangeText={setSenha} />
        <TextInput style={styles.input} placeholder="Seu telefone" placeholderTextColor="#CBB8A6" keyboardType="phone-pad" value={telefone} onChangeText={setTelefone} />

        <Text style={styles.label}>Endereco da sua casa</Text>
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
        <TextInput style={[styles.input, styles.inputDesabilitado]} placeholder="Cidade" placeholderTextColor="#CBB8A6" value={cidade} editable={false} />
        <TextInput style={[styles.input, styles.inputDesabilitado]} placeholder="Estado" placeholderTextColor="#CBB8A6" value={estado} editable={false} />

        <Text style={styles.label}>Raio de atendimento (km)</Text>
        <TextInput style={styles.input} placeholder="10" placeholderTextColor="#CBB8A6" keyboardType="numeric" value={raio} onChangeText={setRaio} />

        <Text style={styles.label}>Suas especialidades</Text>
        <Text style={styles.dica}>Selecione todas que se aplicam</Text>
        <View style={styles.categoriasGrid}>
          {CATEGORIAS.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={categoriasSelecionadas.includes(c.id) ? styles.categoriaAtiva : styles.categoriaInativa}
              onPress={() => toggleCategoria(c.id)}
            >
              <Text style={styles.categoriaEmoji}>{c.emoji}</Text>
              <Text style={categoriasSelecionadas.includes(c.id) ? styles.categoriaTextoAtivo : styles.categoriaTexto}>{c.nome}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Diplomas e certificados <Text style={styles.opcional}>(opcional)</Text></Text>
        <Text style={styles.dica}>Adicione fotos dos seus certificados para aumentar sua credibilidade!</Text>

        <View style={styles.certBotoesRow}>
          <TouchableOpacity style={styles.certBotao} onPress={adicionarCertificado}>
            <Text style={styles.certBotaoEmoji}>🖼️</Text>
            <Text style={styles.certBotaoTexto}>Da galeria</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.certBotao} onPress={tirarFotoCertificado}>
            <Text style={styles.certBotaoEmoji}>📷</Text>
            <Text style={styles.certBotaoTexto}>Tirar foto</Text>
          </TouchableOpacity>
        </View>

        {certificados.length > 0 && (
          <View style={styles.certGrid}>
            {certificados.map((uri, index) => (
              <View key={index} style={styles.certItem}>
                <Image source={{ uri }} style={styles.certImagem} />
                <TouchableOpacity style={styles.certRemover} onPress={() => removerCertificado(index)}>
                  <Text style={styles.certRemoverTexto}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.label}>Tipo de documento</Text>
        <View style={styles.cepRow}>
          <TouchableOpacity
            style={[styles.tipoBotao, tipoDocumento === 'cpf' && styles.tipoBotaoAtivo]}
            onPress={() => setTipoDocumento('cpf')}
          >
            <Text style={tipoDocumento === 'cpf' ? styles.tipoBotaoTextoAtivo : styles.tipoBotaoTexto}>CPF (Pessoa Fisica)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tipoBotao, tipoDocumento === 'cnpj' && styles.tipoBotaoAtivo]}
            onPress={() => setTipoDocumento('cnpj')}
          >
            <Text style={tipoDocumento === 'cnpj' ? styles.tipoBotaoTextoAtivo : styles.tipoBotaoTexto}>CNPJ (Empresa)</Text>
          </TouchableOpacity>
        </View>

        {tipoDocumento === 'cnpj' && (
          <TextInput style={styles.input} placeholder="Razao social da empresa" placeholderTextColor="#CBB8A6" value={razaoSocial} onChangeText={setRazaoSocial} />
        )}

        <TextInput
          style={styles.input}
          placeholder={tipoDocumento === 'cpf' ? '000.000.000-00' : '00.000.000/0001-00'}
          placeholderTextColor="#CBB8A6"
          keyboardType="numeric"
          maxLength={tipoDocumento === 'cpf' ? 14 : 18}
          value={cpf}
          onChangeText={setCpf}
        />

        <Text style={styles.label}>Dados bancarios para receber pagamentos</Text>
        <Text style={styles.dica}>Voce recebera 80% de cada servico realizado</Text>

        <TextInput style={styles.input} placeholder="Codigo do banco (ex: 341 para Itau)" placeholderTextColor="#CBB8A6" keyboardType="numeric" maxLength={5} value={banco} onChangeText={setBanco} />
        <TextInput style={styles.input} placeholder="Agencia (sem digito)" placeholderTextColor="#CBB8A6" keyboardType="numeric" maxLength={6} value={agencia} onChangeText={setAgencia} />

        <View style={styles.cepRow}>
          <TextInput style={[styles.input, { flex: 1, marginRight: 10 }]} placeholder="Numero da conta" placeholderTextColor="#CBB8A6" keyboardType="numeric" maxLength={12} value={conta} onChangeText={setConta} />
          <TextInput style={[styles.input, { width: 70 }]} placeholder="Digito" placeholderTextColor="#CBB8A6" keyboardType="numeric" maxLength={2} value={digitoConta} onChangeText={setDigitoConta} />
        </View>

        <Text style={styles.label}>Tipo de conta</Text>
        <View style={styles.cepRow}>
          <TouchableOpacity
            style={[styles.tipoBotao, tipoConta === 'corrente' && styles.tipoBotaoAtivo]}
            onPress={() => setTipoConta('corrente')}
          >
            <Text style={tipoConta === 'corrente' ? styles.tipoBotaoTextoAtivo : styles.tipoBotaoTexto}>Corrente</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tipoBotao, tipoConta === 'poupanca' && styles.tipoBotaoAtivo]}
            onPress={() => setTipoConta('poupanca')}
          >
            <Text style={tipoConta === 'poupanca' ? styles.tipoBotaoTextoAtivo : styles.tipoBotaoTexto}>Poupanca</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={carregando ? styles.botaoDesabilitado : styles.botao} onPress={cadastrar} disabled={carregando}>
          <Text style={styles.botaoTexto}>{carregando ? 'Enviando cadastro...' : 'Enviar cadastro para analise'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.login}>Ja tem conta? <Text style={styles.link}>Entrar</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: '#E8DCCF' },
  container: { alignItems: 'center', padding: 30, paddingTop: 60 },
  logo: { fontSize: 30, fontWeight: 'bold', color: '#6B4F3A', marginBottom: 5 },
  titulo: { fontSize: 20, color: '#6B4F3A', marginBottom: 30 },
  label: { width: '100%', fontSize: 14, color: '#6B4F3A', fontWeight: 'bold', marginBottom: 5 },
  opcional: { color: '#CBB8A6', fontWeight: 'normal', fontSize: 12 },
  dica: { width: '100%', fontSize: 12, color: '#CBB8A6', marginBottom: 10 },
  input: { width: '100%', backgroundColor: '#F7F3EF', borderRadius: 10, padding: 15, color: '#6B4F3A', marginBottom: 15, fontSize: 16, shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  inputDesabilitado: { opacity: 0.6 },
  cepRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  buscando: { color: '#D4AF7F', fontSize: 13 },
  categoriasGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20, width: '100%' },
  categoriaAtiva: { backgroundColor: '#D4AF7F', borderRadius: 12, padding: 12, margin: 5, alignItems: 'center', width: '28%' },
  categoriaInativa: { backgroundColor: '#F7F3EF', borderRadius: 12, padding: 12, margin: 5, alignItems: 'center', width: '28%', borderWidth: 1, borderColor: '#D9CEC5' },
  categoriaEmoji: { fontSize: 24, marginBottom: 5 },
  categoriaTextoAtivo: { color: '#4A3020', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  categoriaTexto: { color: '#CBB8A6', fontSize: 12, textAlign: 'center' },
  certBotoesRow: { flexDirection: 'row', width: '100%', marginBottom: 15 },
  certBotao: { flex: 1, backgroundColor: '#F7F3EF', borderRadius: 12, padding: 15, alignItems: 'center', marginHorizontal: 5, borderWidth: 1, borderColor: '#D4AF7F' },
  certBotaoEmoji: { fontSize: 28, marginBottom: 5 },
  certBotaoTexto: { color: '#D4AF7F', fontSize: 13, fontWeight: 'bold' },
  certGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', marginBottom: 15 },
  certItem: { position: 'relative', margin: 5 },
  certImagem: { width: 90, height: 90, borderRadius: 10 },
  certRemover: { position: 'absolute', top: -8, right: -8, backgroundColor: '#C0392B', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  certRemoverTexto: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  botao: { width: '100%', backgroundColor: '#D4AF7F', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 10 },
  botaoDesabilitado: { width: '100%', backgroundColor: '#CBB8A6', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 10 },
  botaoTexto: { color: '#4A3020', fontWeight: 'bold', fontSize: 16 },
  login: { color: '#6B4F3A', marginTop: 20, fontSize: 14 },
  link: { color: '#D4AF7F', fontWeight: 'bold' },
  tipoBotao: { flex: 1, backgroundColor: '#F7F3EF', borderRadius: 10, padding: 14, alignItems: 'center', marginHorizontal: 5, marginBottom: 15, borderWidth: 1, borderColor: '#D9CEC5' },
  tipoBotaoAtivo: { backgroundColor: '#D4AF7F', borderColor: '#D4AF7F' },
  tipoBotaoTexto: { color: '#CBB8A6', fontWeight: 'bold', fontSize: 14 },
  tipoBotaoTextoAtivo: { color: '#4A3020', fontWeight: 'bold', fontSize: 14 },
});