import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../config-supabase';

export default function Perfil() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [enderecos, setEnderecos] = useState<string[]>([]);
  const [novoEndereco, setNovoEndereco] = useState('');
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [adicionandoEndereco, setAdicionandoEndereco] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const { data: usuarioAuth } = await supabase.auth.getUser();
      if (!usuarioAuth?.user) return;

      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', usuarioAuth.user.email)
        .single();

      if (usuarioData) {
        setUsuario(usuarioData);
        setNome(usuarioData.nome || '');
        setTelefone(usuarioData.telefone || '');
        if (usuarioData.foto_url) setFoto(usuarioData.foto_url + '?t=' + Date.now());
        if (usuarioData.enderecos) {
          setEnderecos(JSON.parse(usuarioData.enderecos));
        }
      }

      const { data: pedidosData } = await supabase
        .from('pedidos')
        .select('*')
        .order('cliente_id', { ascending: false });

      setPedidos(pedidosData || []);
    } catch (e) {
      console.log('Erro:', e);
    }
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

  async function adicionarEndereco() {
    if (!rua || !numero || !cidade) {
      Alert.alert('Erro', 'Preencha pelo menos rua, numero e cidade!');
      return;
    }
    const enderecoCompleto = `${rua}, ${numero}, ${bairro}, ${cidade}, ${estado}`;
    const novosEnderecos = [...enderecos, enderecoCompleto];

    try {
      const { data: usuarioAuth } = await supabase.auth.getUser();
      if (!usuarioAuth?.user) return;
      await supabase.from('usuarios').update({ enderecos: JSON.stringify(novosEnderecos) }).eq('email', usuarioAuth.user.email);
      setEnderecos(novosEnderecos);
      setCep(''); setRua(''); setNumero(''); setBairro(''); setCidade(''); setEstado('');
      setAdicionandoEndereco(false);
      Alert.alert('✅ Endereco adicionado!');
    } catch (e) {
      Alert.alert('Erro', 'Nao foi possivel salvar o endereco!');
    }
  }

  async function removerEndereco(index: number) {
    const novosEnderecos = enderecos.filter((_, i) => i !== index);
    try {
      const { data: usuarioAuth } = await supabase.auth.getUser();
      if (!usuarioAuth?.user) return;
      await supabase.from('usuarios').update({ enderecos: JSON.stringify(novosEnderecos) }).eq('email', usuarioAuth.user.email);
      setEnderecos(novosEnderecos);
    } catch (e) {
      Alert.alert('Erro', 'Nao foi possivel remover o endereco!');
    }
  }

  async function escolherFoto() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) return;
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!resultado.canceled) {
      const uri = resultado.assets[0].uri;
      setFoto(uri);
      await uploadFoto(uri);
    }
  }

  async function uploadFoto(uri: string) {
    try {
      const { data: usuarioAuth } = await supabase.auth.getUser();
      if (!usuarioAuth?.user) return;
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const fileName = `${usuarioAuth.user.id}.jpg`;
      const { error } = await supabase.storage.from('fotos-perfil').upload(fileName, arrayBuffer, { upsert: true, contentType: 'image/jpeg' });
      if (!error) {
        const { data } = supabase.storage.from('fotos-perfil').getPublicUrl(fileName);
        await supabase.from('usuarios').update({ foto_url: data.publicUrl }).eq('email', usuarioAuth.user.email);
        setFoto(data.publicUrl + '?t=' + Date.now());
      } else {
        Alert.alert('Erro ao salvar foto', error.message);
      }
    } catch (e: any) {
      Alert.alert('Erro ao salvar foto', e?.message || String(e));
    }
  }

  async function salvarPerfil() {
    try {
      const { data: usuarioAuth } = await supabase.auth.getUser();
      if (!usuarioAuth?.user) return;
      await supabase.from('usuarios').update({ nome, telefone }).eq('email', usuarioAuth.user.email);
      Alert.alert('✅ Perfil atualizado!');
      setEditando(false);
      carregarDados();
    } catch (e) {
      Alert.alert('Erro', 'Nao foi possivel salvar!');
    }
  }

  const pedidosConcluidos = pedidos.filter((p) => p.status === 'concluido');

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>

        <View style={styles.fotoContainer}>
          <TouchableOpacity onPress={escolherFoto}>
            <View style={styles.foto}>
              {foto ? (
                <Image source={{ uri: foto }} style={{ width: 100, height: 100, borderRadius: 50 }} />
              ) : (
                <Text style={styles.fotoEmoji}>👩</Text>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botaoFoto} onPress={escolherFoto}>
            <Text style={styles.botaoFotoTexto}>Alterar foto</Text>
          </TouchableOpacity>
        </View>

        {!editando ? (
          <View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Nome</Text>
              <Text style={styles.infoValor}>{nome || 'Nao informado'}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValor}>{usuario?.email || ''}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Telefone</Text>
              <Text style={styles.infoValor}>{telefone || 'Nao informado'}</Text>
            </View>
            <TouchableOpacity style={styles.botaoEditar} onPress={() => setEditando(true)}>
              <Text style={styles.botaoEditarTexto}>Editar perfil</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <TextInput style={styles.input} placeholder="Seu nome completo" placeholderTextColor="#CBB8A6" value={nome} onChangeText={setNome} />
            <TextInput style={styles.input} placeholder="Seu telefone" placeholderTextColor="#CBB8A6" keyboardType="phone-pad" value={telefone} onChangeText={setTelefone} />
            <TouchableOpacity style={styles.botaoSalvar} onPress={salvarPerfil}>
              <Text style={styles.botaoSalvarTexto}>Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.botaoCancelar} onPress={() => setEditando(false)}>
              <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.secao}>Meus enderecos</Text>
        {enderecos.map((e, i) => (
          <View key={i} style={styles.enderecoCard}>
            <View style={styles.enderecoInfo}>
              <Text style={styles.enderecoEmoji}>📍</Text>
              <Text style={styles.enderecoTexto}>{e}</Text>
              {i === 0 && <Text style={styles.enderecoPadrao}>Padrao</Text>}
            </View>
            <TouchableOpacity onPress={() => removerEndereco(i)}>
              <Text style={styles.enderecoRemover}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        {!adicionandoEndereco ? (
          <TouchableOpacity style={styles.botaoAdicionarEndereco} onPress={() => setAdicionandoEndereco(true)}>
            <Text style={styles.botaoAdicionarEnderecoTexto}>+ Adicionar endereco</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.novoEnderecoCard}>
            <Text style={styles.novoEnderecoTitulo}>Novo endereco</Text>
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
            <TouchableOpacity style={styles.botaoSalvar} onPress={adicionarEndereco}>
              <Text style={styles.botaoSalvarTexto}>Salvar endereco</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.botaoCancelar} onPress={() => setAdicionandoEndereco(false)}>
              <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}

        {pedidosConcluidos.length > 0 && (
          <View>
            <Text style={styles.secao}>Historico</Text>
            {pedidosConcluidos.map((p, index) => (
              <View key={index} style={styles.historicoCard}>
                <View style={styles.historicoInfo}>
                  <Text style={styles.historicoServico}>{p.servico}</Text>
                  <Text style={styles.historicoData}>{p.data}</Text>
                </View>
                <Text style={styles.historicoValor}>R$ {parseFloat(p.valor).toFixed(2).replace('.', ',')}</Text>
              </View>
            ))}
          </View>
        )}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: '#E8DCCF' },
  container: { padding: 20, paddingTop: 60 },
  fotoContainer: { alignItems: 'center', marginBottom: 25 },
  foto: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F7F3EF', alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 3, borderColor: '#D4AF7F', overflow: 'hidden' },
  fotoEmoji: { fontSize: 50 },
  botaoFoto: { backgroundColor: '#F7F3EF', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: '#D4AF7F' },
  botaoFotoTexto: { color: '#D4AF7F', fontSize: 13, fontWeight: 'bold' },
  infoCard: { backgroundColor: '#F7F3EF', borderRadius: 12, padding: 15, marginBottom: 10, shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  infoLabel: { color: '#CBB8A6', fontSize: 12, marginBottom: 4 },
  infoValor: { color: '#6B4F3A', fontSize: 15, fontWeight: 'bold' },
  input: { width: '100%', backgroundColor: '#F7F3EF', borderRadius: 10, padding: 15, color: '#6B4F3A', marginBottom: 12, fontSize: 16, shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  botaoEditar: { width: '100%', borderWidth: 2, borderColor: '#D4AF7F', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 5, marginBottom: 20 },
  botaoEditarTexto: { color: '#D4AF7F', fontWeight: 'bold', fontSize: 16 },
  botaoSalvar: { width: '100%', backgroundColor: '#D4AF7F', borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 10 },
  botaoSalvarTexto: { color: '#4A3020', fontWeight: 'bold', fontSize: 16 },
  botaoCancelar: { width: '100%', borderWidth: 2, borderColor: '#C0392B', borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 20 },
  botaoCancelarTexto: { color: '#C0392B', fontWeight: 'bold', fontSize: 16 },
  secao: { fontSize: 17, fontWeight: 'bold', color: '#6B4F3A', marginBottom: 12, marginTop: 10 },
  enderecoCard: { backgroundColor: '#F7F3EF', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  enderecoInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  enderecoEmoji: { fontSize: 20, marginRight: 10 },
  enderecoTexto: { color: '#6B4F3A', fontSize: 13, flex: 1 },
  enderecoPadrao: { color: '#D4AF7F', fontSize: 10, fontWeight: 'bold', marginLeft: 5 },
  enderecoRemover: { color: '#C0392B', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  botaoAdicionarEndereco: { borderWidth: 2, borderColor: '#D4AF7F', borderStyle: 'dashed', borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 20 },
  botaoAdicionarEnderecoTexto: { color: '#D4AF7F', fontWeight: 'bold', fontSize: 15 },
  novoEnderecoCard: { backgroundColor: '#F7F3EF', borderRadius: 15, padding: 20, marginBottom: 20, shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  novoEnderecoTitulo: { color: '#6B4F3A', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  cepRow: { flexDirection: 'row', alignItems: 'center' },
  buscando: { color: '#D4AF7F', fontSize: 13 },
  historicoCard: { backgroundColor: '#F7F3EF', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  historicoInfo: {},
  historicoServico: { color: '#6B4F3A', fontSize: 14, fontWeight: 'bold' },
  historicoData: { color: '#CBB8A6', fontSize: 12, marginTop: 3 },
  historicoValor: { color: '#D4AF7F', fontSize: 15, fontWeight: 'bold' },
});