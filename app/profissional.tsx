import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../config-supabase';
import { agendarNotificacao30min, enviarNotificacaoLocal } from './notificacoes-config';

const CATEGORIAS = [
  { id: 'unhas', nome: 'Unhas', emoji: '💅' },
  { id: 'cabelo', nome: 'Cabelo', emoji: '✂️' },
  { id: 'massagem', nome: 'Massagem', emoji: '🌿' },
  { id: 'depilacao', nome: 'Depilacao', emoji: '✨' },
  { id: 'maquiagem', nome: 'Maquiagem', emoji: '💄' },
  { id: 'estetica', nome: 'Estetica', emoji: '🌸' },
];

export default function Profissional() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [aba, setAba] = useState('pedidos');
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [raio, setRaio] = useState('10');
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>([]);
  const [foto, setFoto] = useState<string | null>(null);

  useEffect(() => {
    buscarPedidos();
    carregarPerfil();
  }, []);

  async function carregarPerfil() {
    try {
      const { data: usuarioAuth } = await supabase.auth.getUser();
      if (!usuarioAuth?.user) return;

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', usuarioAuth.user.email)
        .single();

      if (usuario) {
        setNome(usuario.nome || '');
        setTelefone(usuario.telefone || '');
        if (usuario.foto_url) {
          setFoto(usuario.foto_url + '?t=' + Date.now());
        }
      }

      const { data: profissional } = await supabase
        .from('profissionais')
        .select('*')
        .eq('usuario_id', usuarioAuth.user.id)
        .single();

      if (profissional) {
        setEndereco(profissional.endereco_completo || '');
        setRaio(String(profissional.raio_atendimento || 10));
        if (profissional.especialidades) {
          setCategoriasSelecionadas(profissional.especialidades.split(', ').filter(Boolean));
        }
      }
    } catch (e) {
      console.log('Erro ao carregar perfil:', e);
    }
  }

  async function buscarPedidos() {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('cliente_id', { ascending: false });
      if (error) {
        console.log('Erro:', JSON.stringify(error));
      } else {
        setPedidos(data || []);
      }
    } catch (e) {
      console.log('Erro:', String(e));
    } finally {
      setCarregando(false);
    }
  }

  async function aceitar(cliente_id: number, horario: string) {
    await supabase.from('pedidos').update({ status: 'aceito' }).eq('cliente_id', cliente_id);
    await enviarNotificacaoLocal('Pedido aceito!', 'Uma profissional aceitou seu pedido!');
    await agendarNotificacao30min(horario);
    buscarPedidos();
  }

  async function recusar(cliente_id: number) {
    await supabase.from('pedidos').update({ status: 'recusado' }).eq('cliente_id', cliente_id);
    buscarPedidos();
  }

  function toggleCategoria(id: string) {
    setCategoriasSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function escolherFoto() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissao negada', 'Precisamos de acesso a sua galeria!');
      return;
    }
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
      const blob = await response.blob();
      const fileName = `${usuarioAuth.user.id}.jpg`;
      const { error } = await supabase.storage
        .from('fotos-perfil')
        .upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' });
      if (!error) {
        const { data } = supabase.storage.from('fotos-perfil').getPublicUrl(fileName);
        await supabase.from('usuarios').update({ foto_url: data.publicUrl }).eq('email', usuarioAuth.user.email);
        setFoto(data.publicUrl + '?t=' + Date.now());
      }
    } catch (e) {
      console.log('Erro upload foto:', e);
    }
  }

  async function salvarPerfil() {
    try {
      const { data: usuarioAuth } = await supabase.auth.getUser();
      if (!usuarioAuth?.user) {
        Alert.alert('Erro', 'Usuario nao encontrado!');
        return;
      }

      await supabase
        .from('usuarios')
        .update({ nome, telefone })
        .eq('email', usuarioAuth.user.email);

      const { error: erroProfissional } = await supabase
        .from('profissionais')
        .update({
          especialidades: categoriasSelecionadas.join(', '),
          endereco_completo: endereco,
          raio_atendimento: parseInt(raio),
        })
        .eq('usuario_id', usuarioAuth.user.id);

      if (erroProfissional) {
        console.log('Erro ao salvar profissional:', JSON.stringify(erroProfissional));
        Alert.alert('Erro', 'Nao foi possivel salvar as especialidades!');
        return;
      }

      Alert.alert('Sucesso!', 'Perfil atualizado!');
      setEditando(false);
      carregarPerfil();
    } catch (e) {
      Alert.alert('Erro', String(e));
    }
  }

  const pendentes = pedidos.filter((p) => p.status === 'pendente');
  const aceitos = pedidos.filter((p) => p.status === 'aceito');
  const concluidos = pedidos.filter((p) => p.status === 'concluido');

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>
        <View style={styles.abas}>
          {['pedidos', 'agenda', 'ganhos', 'perfil'].map((a) => (
            <TouchableOpacity key={a} style={aba === a ? styles.abaAtiva : styles.abaInativa} onPress={() => setAba(a)}>
              <Text style={aba === a ? styles.abaTextoAtivo : styles.abaTexto}>{a.charAt(0).toUpperCase() + a.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {aba === 'pedidos' && (
          <View>
            {carregando && <Text style={styles.carregando}>Carregando pedidos...</Text>}
            <Text style={styles.secao}>Pendentes ({pendentes.length})</Text>
            {pendentes.length === 0 && !carregando && <Text style={styles.vazio}>Nenhum pedido pendente</Text>}
            {pendentes.map((p, index) => (
              <View key={index} style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.clienteNome}>Pedido #{p.cliente_id}</Text>
                  <Text style={styles.distancia}>Novo!</Text>
                </View>
                <Text style={styles.servico}>{p.servico}</Text>
                <Text style={styles.info}>Data: {p.data} as {p.horario}</Text>
                <Text style={styles.info}>Local: {p.endereco}</Text>
                <Text style={styles.valor}>R$ {p.valor},00</Text>
                <View style={styles.row}>
                  <TouchableOpacity style={styles.botaoRecusar} onPress={() => recusar(p.cliente_id)}>
                    <Text style={styles.botaoRecusarTexto}>Recusar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.botaoAceitar} onPress={() => aceitar(p.cliente_id, p.horario)}>
                    <Text style={styles.botaoAceitarTexto}>Aceitar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <Text style={styles.secao}>Aceitos ({aceitos.length})</Text>
            {aceitos.map((p, index) => (
              <View key={index} style={styles.cardAceito}>
                <Text style={styles.clienteNome}>Pedido #{p.cliente_id}</Text>
                <Text style={styles.servico}>{p.servico}</Text>
                <Text style={styles.info}>Data: {p.data} as {p.horario}</Text>
                <Text style={styles.valor}>R$ {p.valor},00</Text>
                <Text style={styles.statusAceito}>Aceito ✅</Text>
              </View>
            ))}
            <Text style={styles.secao}>Concluidos ({concluidos.length})</Text>
            {concluidos.map((p, index) => (
              <View key={index} style={styles.cardConcluido}>
                <Text style={styles.clienteNome}>Pedido #{p.cliente_id}</Text>
                <Text style={styles.servico}>{p.servico}</Text>
                <Text style={styles.valor}>R$ {p.valor},00</Text>
              </View>
            ))}
          </View>
        )}

        {aba === 'ganhos' && (
          <View>
            <View style={styles.faturamentoCard}>
              <Text style={styles.faturamentoLabel}>Total a receber</Text>
              <Text style={styles.faturamentoValor}>
                R$ {aceitos.reduce((t, p) => t + parseFloat(p.valor), 0).toFixed(2).replace('.', ',')}
              </Text>
              <Text style={styles.faturamentoSub}>{aceitos.length} servicos aceitos</Text>
            </View>
          </View>
        )}

        {aba === 'agenda' && (
          <View>
            <Text style={styles.secao}>Agenda em breve!</Text>
          </View>
        )}

        {aba === 'perfil' && (
          <View>
            <View style={styles.perfilFotoContainer}>
              <TouchableOpacity onPress={escolherFoto}>
                <View style={styles.perfilFoto}>
                  {foto ? (
                    <Image
                      source={{ uri: foto }}
                      style={{ width: 100, height: 100, borderRadius: 50 }}
                      onError={() => console.log('Erro ao carregar foto')}
                    />
                  ) : (
                    <Text style={styles.perfilFotoTexto}>👩</Text>
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botaoFoto} onPress={escolherFoto}>
                <Text style={styles.botaoFotoTexto}>Alterar foto</Text>
              </TouchableOpacity>
            </View>

            {!editando ? (
              <View>
                <View style={styles.perfilCard}>
                  <Text style={styles.perfilLabel}>Nome</Text>
                  <Text style={styles.perfilValor}>{nome || 'Clique em editar para preencher'}</Text>
                </View>
                <View style={styles.perfilCard}>
                  <Text style={styles.perfilLabel}>Telefone</Text>
                  <Text style={styles.perfilValor}>{telefone || 'Nao informado'}</Text>
                </View>
                <View style={styles.perfilCard}>
                  <Text style={styles.perfilLabel}>Endereco de atendimento</Text>
                  <Text style={styles.perfilValor}>{endereco || 'Nao informado'}</Text>
                </View>
                <View style={styles.perfilCard}>
                  <Text style={styles.perfilLabel}>Raio de atendimento</Text>
                  <Text style={styles.perfilValor}>{raio} km</Text>
                </View>
                <View style={styles.perfilCard}>
                  <Text style={styles.perfilLabel}>Especialidades</Text>
                  <View style={styles.categoriasRow}>
                    {categoriasSelecionadas.length > 0 ? categoriasSelecionadas.map((c) => {
                      const cat = CATEGORIAS.find((x) => x.id === c);
                      return cat ? (
                        <View key={c} style={styles.categoriaTag}>
                          <Text style={styles.categoriaTagTexto}>{cat.emoji} {cat.nome}</Text>
                        </View>
                      ) : null;
                    }) : <Text style={styles.perfilValor}>Nenhuma selecionada</Text>}
                  </View>
                </View>
                <TouchableOpacity style={styles.botaoEditar} onPress={() => setEditando(true)}>
                  <Text style={styles.botaoEditarTexto}>Editar perfil</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.secao}>Editando perfil</Text>
                <TextInput style={styles.input} placeholder="Seu nome completo" placeholderTextColor="#999" value={nome} onChangeText={setNome} />
                <TextInput style={styles.input} placeholder="Seu telefone" placeholderTextColor="#999" keyboardType="phone-pad" value={telefone} onChangeText={setTelefone} />
                <TextInput style={styles.input} placeholder="Seu endereco completo" placeholderTextColor="#999" value={endereco} onChangeText={setEndereco} />
                <TextInput style={styles.input} placeholder="Raio de atendimento (km)" placeholderTextColor="#999" keyboardType="numeric" value={raio} onChangeText={setRaio} />

                <Text style={styles.secao}>Suas especialidades</Text>
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

                <TouchableOpacity style={styles.botaoSalvar} onPress={salvarPerfil}>
                  <Text style={styles.botaoSalvarTexto}>Salvar perfil</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.botaoCancelar} onPress={() => setEditando(false)}>
                  <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: '#1a0a2e' },
  container: { padding: 20, paddingTop: 60 },
  carregando: { color: '#999', textAlign: 'center', padding: 20 },
  abas: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#2d1b4e', borderRadius: 10, padding: 4 },
  abaAtiva: { flex: 1, backgroundColor: '#f0a500', borderRadius: 8, padding: 8, alignItems: 'center' },
  abaInativa: { flex: 1, padding: 8, alignItems: 'center' },
  abaTextoAtivo: { color: '#1a0a2e', fontWeight: 'bold', fontSize: 11 },
  abaTexto: { color: '#999', fontSize: 11 },
  secao: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 12, marginTop: 5 },
  vazio: { color: '#999', textAlign: 'center', padding: 20 },
  card: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 15, marginBottom: 15, borderWidth: 2, borderColor: '#f0a500' },
  cardAceito: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 15, marginBottom: 15, borderWidth: 2, borderColor: '#00cc66' },
  cardConcluido: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 15, marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  clienteNome: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  distancia: { color: '#f0a500', fontWeight: 'bold' },
  servico: { color: '#f0a500', fontSize: 14, marginBottom: 8 },
  info: { color: '#999', fontSize: 13, marginBottom: 4 },
  valor: { color: '#ffffff', fontWeight: 'bold', fontSize: 16, marginTop: 8, marginBottom: 10 },
  botaoRecusar: { flex: 1, borderWidth: 2, borderColor: '#ff4444', borderRadius: 8, padding: 10, alignItems: 'center', marginRight: 8 },
  botaoRecusarTexto: { color: '#ff4444', fontWeight: 'bold' },
  botaoAceitar: { flex: 1, backgroundColor: '#f0a500', borderRadius: 8, padding: 10, alignItems: 'center' },
  botaoAceitarTexto: { color: '#1a0a2e', fontWeight: 'bold' },
  statusAceito: { color: '#00cc66', fontWeight: 'bold', marginTop: 8 },
  faturamentoCard: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 25, alignItems: 'center', marginBottom: 15 },
  faturamentoLabel: { color: '#999', fontSize: 14, marginBottom: 8 },
  faturamentoValor: { color: '#f0a500', fontSize: 36, fontWeight: 'bold' },
  faturamentoSub: { color: '#999', fontSize: 13, marginTop: 5 },
  perfilFotoContainer: { alignItems: 'center', marginBottom: 20 },
  perfilFoto: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#2d1b4e', alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 3, borderColor: '#f0a500', overflow: 'hidden' },
  perfilFotoTexto: { fontSize: 50 },
  botaoFoto: { backgroundColor: '#2d1b4e', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: '#f0a500' },
  botaoFotoTexto: { color: '#f0a500', fontSize: 13, fontWeight: 'bold' },
  perfilCard: { backgroundColor: '#2d1b4e', borderRadius: 12, padding: 15, marginBottom: 10 },
  perfilLabel: { color: '#999', fontSize: 12, marginBottom: 5 },
  perfilValor: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  categoriasRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 },
  categoriaTag: { backgroundColor: '#f0a500', borderRadius: 15, paddingVertical: 4, paddingHorizontal: 10, margin: 3 },
  categoriaTagTexto: { color: '#1a0a2e', fontSize: 12, fontWeight: 'bold' },
  botaoEditar: { width: '100%', borderWidth: 2, borderColor: '#f0a500', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 10 },
  botaoEditarTexto: { color: '#f0a500', fontWeight: 'bold', fontSize: 16 },
  input: { width: '100%', backgroundColor: '#2d1b4e', borderRadius: 10, padding: 15, color: '#ffffff', marginBottom: 15, fontSize: 16 },
  categoriasGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  categoriaAtiva: { backgroundColor: '#f0a500', borderRadius: 12, padding: 12, margin: 5, alignItems: 'center', width: '28%' },
  categoriaInativa: { backgroundColor: '#2d1b4e', borderRadius: 12, padding: 12, margin: 5, alignItems: 'center', width: '28%', borderWidth: 1, borderColor: '#444' },
  categoriaEmoji: { fontSize: 24, marginBottom: 5 },
  categoriaTextoAtivo: { color: '#1a0a2e', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  categoriaTexto: { color: '#999', fontSize: 12, textAlign: 'center' },
  botaoSalvar: { width: '100%', backgroundColor: '#f0a500', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 10 },
  botaoSalvarTexto: { color: '#1a0a2e', fontWeight: 'bold', fontSize: 16 },
  botaoCancelar: { width: '100%', borderWidth: 2, borderColor: '#ff4444', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 10 },
  botaoCancelarTexto: { color: '#ff4444', fontWeight: 'bold', fontSize: 16 },
});