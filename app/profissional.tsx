import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { calcularDistanciaKm } from '../config-maps';
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

const DIAS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

const HORARIOS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00',
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
  const [diasAtivos, setDiasAtivos] = useState<string[]>([]);
  const [horariosAtivos, setHorariosAtivos] = useState<string[]>([]);
  const [pedidoExpandido, setPedidoExpandido] = useState<number | null>(null);
  const [horarioEscolhido, setHorarioEscolhido] = useState<{ [key: number]: string }>({});
  const [minhaLatitude, setMinhaLatitude] = useState<number | null>(null);
  const [minhaLongitude, setMinhaLongitude] = useState<number | null>(null);
  const [clientes, setClientes] = useState<any[]>([]);

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
        if (usuario.foto_url) setFoto(usuario.foto_url + '?t=' + Date.now());
      }

      const { data: profissional } = await supabase
        .from('profissionais')
        .select('*')
        .eq('usuario_id', usuarioAuth.user.id)
        .single();

      if (profissional) {
        setEndereco(profissional.endereco_completo || '');
        setRaio(String(profissional.raio_atendimento || 10));
        setMinhaLatitude(profissional.latitude);
        setMinhaLongitude(profissional.longitude);
        if (profissional.especialidades) {
          setCategoriasSelecionadas(profissional.especialidades.split(', ').filter(Boolean));
        }
        if (profissional.dias_disponiveis) {
          try {
            const agenda = JSON.parse(profissional.dias_disponiveis);
            setDiasAtivos(agenda.dias || []);
            setHorariosAtivos(agenda.horarios || []);
          } catch (e) {}
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

      const { data: usuariosData } = await supabase
        .from('usuarios')
        .select('*');

      if (!error) {
        setPedidos(data || []);
        setClientes(usuariosData || []);
      }
    } catch (e) {
      console.log('Erro:', String(e));
    } finally {
      setCarregando(false);
    }
  }

  function getCliente(pedido: any) {
    return clientes.find((c) => c.email?.toLowerCase().trim() === pedido.email_cliente?.toLowerCase().trim()) || null;
  }

  function calcularMinutos(lat1: number, lng1: number, lat2: number, lng2: number) {
    const km = calcularDistanciaKm(lat1, lng1, lat2, lng2);
    const minutos = Math.round(km / 0.5);
    return minutos < 1 ? '1 min' : `${minutos} min`;
  }

  async function aceitar(cliente_id: number) {
    const horario = horarioEscolhido[cliente_id];
    if (!horario) {
      Alert.alert('Escolha um horario!', 'Selecione um dos horarios antes de aceitar!');
      return;
    }
    await supabase.from('pedidos').update({ status: 'aceito', horario }).eq('cliente_id', cliente_id);
    await enviarNotificacaoLocal('Pedido aceito!', `Sua profissional confirmou o horario: ${horario}`);
    await agendarNotificacao30min(horario);
    buscarPedidos();
    Alert.alert('✅ Aceito!', `Pedido aceito para as ${horario}!`);
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

  function toggleDia(dia: string) {
    setDiasAtivos((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  }

  function toggleHorario(horario: string) {
    setHorariosAtivos((prev) =>
      prev.includes(horario) ? prev.filter((h) => h !== horario) : [...prev, horario]
    );
  }

  async function salvarAgenda() {
    try {
      const { data: usuarioAuth } = await supabase.auth.getUser();
      if (!usuarioAuth?.user) return;
      const agenda = JSON.stringify({ dias: diasAtivos, horarios: horariosAtivos });
      await supabase.from('profissionais').update({ dias_disponiveis: agenda }).eq('usuario_id', usuarioAuth.user.id);
      Alert.alert('Sucesso!', 'Agenda salva com sucesso!');
    } catch (e) {
      Alert.alert('Erro', 'Nao foi possivel salvar a agenda!');
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
      await supabase.from('profissionais').update({
        especialidades: categoriasSelecionadas.join(', '),
        endereco_completo: endereco,
        raio_atendimento: parseInt(raio),
      }).eq('usuario_id', usuarioAuth.user.id);
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
            {pendentes.map((p, index) => {
              const horariosArray = p.horarios ? (typeof p.horarios === 'string' ? JSON.parse(p.horarios) : p.horarios) : [p.horario];
              const expandido = pedidoExpandido === p.cliente_id;
              const temCoordenadas = minhaLatitude && minhaLongitude && p.latitude && p.longitude;
              const minutos = temCoordenadas ? calcularMinutos(minhaLatitude!, minhaLongitude!, p.latitude, p.longitude) : null;

              return (
                <View key={index} style={styles.card}>
                  <TouchableOpacity onPress={() => setPedidoExpandido(expandido ? null : p.cliente_id)}>
                    <View style={styles.clienteHeader}>
                      <View style={styles.clienteFotoPlaceholder}>
                        <Text style={styles.clienteFotoTexto}>👩</Text>
                      </View>
                      <View style={styles.clienteInfo}>
                        <Text style={styles.clienteNome}>Cliente #{p.cliente_id}</Text>
                        <Text style={styles.servico}>{p.servico}</Text>
                        <Text style={styles.valor}>R$ {parseFloat(p.valor).toFixed(2).replace('.', ',')}</Text>
                      </View>
                      <Text style={styles.expandirIcon}>{expandido ? '▲' : '▼'}</Text>
                    </View>

                    {(p.is_influencer || getCliente(p)?.tipo_usuario === 'influencer') && (
                      <View style={styles.influencerAviso}>
                        <Text style={styles.influencerAvisoTexto}>⭐ Cliente influencer — ao aceitar este pedido, você concorda que pode aparecer em fotos ou videos nas redes sociais dela.</Text>
                      </View>
                    )}

                    <View style={styles.enderecoRow}>
                      <Text style={styles.enderecoTexto}>📍 {p.endereco}</Text>
                      {minutos && <Text style={styles.minutosTexto}>🚗 {minutos}</Text>}
                    </View>

                    <Text style={styles.dataTexto}>📅 {p.data}</Text>
                  </TouchableOpacity>

                  {expandido && (
                    <View style={styles.expandidoContainer}>
                      <Text style={styles.horariosTitulo}>Escolha um horario para atender:</Text>
                      <View style={styles.horariosRow}>
                        {horariosArray.map((h: string) => (
                          <TouchableOpacity
                            key={h}
                            style={horarioEscolhido[p.cliente_id] === h ? styles.horarioAtivo : styles.horarioInativo}
                            onPress={() => setHorarioEscolhido((prev) => ({ ...prev, [p.cliente_id]: h }))}
                          >
                            <Text style={horarioEscolhido[p.cliente_id] === h ? styles.horarioTextoAtivo : styles.horarioTexto}>{h}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {horarioEscolhido[p.cliente_id] && (
                        <Text style={styles.horarioSelecionado}>✅ Horario: {horarioEscolhido[p.cliente_id]}</Text>
                      )}

                      <View style={styles.botoesRow}>
                        <TouchableOpacity style={styles.botaoRecusar} onPress={() => recusar(p.cliente_id)}>
                          <Text style={styles.botaoRecusarTexto}>❌ Recusar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.botaoAceitar} onPress={() => aceitar(p.cliente_id)}>
                          <Text style={styles.botaoAceitarTexto}>✅ Aceitar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            <Text style={styles.secao}>Aceitos ({aceitos.length})</Text>
            {aceitos.map((p, index) => (
              <View key={index} style={styles.cardAceito}>
                <Text style={styles.clienteNome}>Pedido #{p.cliente_id}</Text>
                <Text style={styles.servico}>{p.servico}</Text>
                <Text style={styles.info}>📅 {p.data} as {p.horario}</Text>
                <Text style={styles.info}>📍 {p.endereco}</Text>
                <Text style={styles.valor}>R$ {parseFloat(p.valor).toFixed(2).replace('.', ',')}</Text>
                <Text style={styles.statusAceito}>Aceito ✅</Text>
                <TouchableOpacity style={styles.botaoAtendimento} onPress={() => {}}>
                  <Text style={styles.botaoAtendimentoTexto}>▶ Iniciar atendimento</Text>
                </TouchableOpacity>
              </View>
            ))}

            <Text style={styles.secao}>Concluidos ({concluidos.length})</Text>
            {concluidos.map((p, index) => (
              <View key={index} style={styles.cardConcluido}>
                <Text style={styles.clienteNome}>Pedido #{p.cliente_id}</Text>
                <Text style={styles.servico}>{p.servico}</Text>
                <Text style={styles.valor}>R$ {parseFloat(p.valor).toFixed(2).replace('.', ',')}</Text>
              </View>
            ))}
          </View>
        )}

        {aba === 'agenda' && (
          <View>
            <Text style={styles.secao}>Minha disponibilidade</Text>
            <Text style={styles.dica}>Verde = disponivel | Vermelho = indisponivel</Text>
            <Text style={styles.label}>Dias da semana</Text>
            <View style={styles.diasGrid}>
              {DIAS.map((dia) => (
                <TouchableOpacity
                  key={dia}
                  style={diasAtivos.includes(dia) ? styles.diaAtivo : styles.diaInativo}
                  onPress={() => toggleDia(dia)}
                >
                  <Text style={styles.diaTextoAtivo}>{dia}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Horarios disponíveis</Text>
            <View style={styles.horariosGrid}>
              {HORARIOS.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={horariosAtivos.includes(h) ? styles.horarioAtivoAgenda : styles.horarioInativoAgenda}
                  onPress={() => toggleHorario(h)}
                >
                  <Text style={styles.diaTextoAtivo}>{h}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.legendaRow}>
              <View style={styles.legendaItem}>
                <View style={[styles.legendaCor, { backgroundColor: '#7BAE7F' }]} />
                <Text style={styles.legendaTexto}>Disponivel</Text>
              </View>
              <View style={styles.legendaItem}>
                <View style={[styles.legendaCor, { backgroundColor: '#C0392B' }]} />
                <Text style={styles.legendaTexto}>Indisponivel</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.botaoSalvarAgenda} onPress={salvarAgenda}>
              <Text style={styles.botaoSalvarAgendaTexto}>Salvar disponibilidade</Text>
            </TouchableOpacity>
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

        {aba === 'perfil' && (
          <View>
            <View style={styles.perfilFotoContainer}>
              <TouchableOpacity onPress={escolherFoto}>
                <View style={styles.perfilFoto}>
                  {foto ? (
                    <Image source={{ uri: foto }} style={{ width: 100, height: 100, borderRadius: 50 }} />
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
                <TextInput style={styles.input} placeholder="Seu nome completo" placeholderTextColor="#CBB8A6" value={nome} onChangeText={setNome} />
                <TextInput style={styles.input} placeholder="Seu telefone" placeholderTextColor="#CBB8A6" keyboardType="phone-pad" value={telefone} onChangeText={setTelefone} />
                <TextInput style={styles.input} placeholder="Seu endereco completo" placeholderTextColor="#CBB8A6" value={endereco} onChangeText={setEndereco} />
                <TextInput style={styles.input} placeholder="Raio de atendimento (km)" placeholderTextColor="#CBB8A6" keyboardType="numeric" value={raio} onChangeText={setRaio} />
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
  scroll: { backgroundColor: '#E8DCCF' },
  container: { padding: 20, paddingTop: 60 },
  carregando: { color: '#CBB8A6', textAlign: 'center', padding: 20 },
  abas: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#F7F3EF', borderRadius: 10, padding: 4, shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  abaAtiva: { flex: 1, backgroundColor: '#D4AF7F', borderRadius: 8, padding: 8, alignItems: 'center' },
  abaInativa: { flex: 1, padding: 8, alignItems: 'center' },
  abaTextoAtivo: { color: '#4A3020', fontWeight: 'bold', fontSize: 11 },
  abaTexto: { color: '#CBB8A6', fontSize: 11 },
  secao: { fontSize: 16, fontWeight: 'bold', color: '#6B4F3A', marginBottom: 12, marginTop: 5 },
  vazio: { color: '#CBB8A6', textAlign: 'center', padding: 20 },
  dica: { color: '#CBB8A6', fontSize: 12, marginBottom: 15 },
  label: { color: '#6B4F3A', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  influencerAviso: { backgroundColor: '#FFF9F0', borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#D4AF7F', flexDirection: 'row' },
  influencerAvisoTexto: { color: '#6B4F3A', fontSize: 12, flex: 1, lineHeight: 18 },
  card: { backgroundColor: '#F7F3EF', borderRadius: 15, padding: 15, marginBottom: 15, borderWidth: 2, borderColor: '#D4AF7F', shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  cardAceito: { backgroundColor: '#F7F3EF', borderRadius: 15, padding: 15, marginBottom: 15, borderWidth: 2, borderColor: '#7BAE7F', shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  cardConcluido: { backgroundColor: '#F7F3EF', borderRadius: 15, padding: 15, marginBottom: 15, shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  clienteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  clienteFotoPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#D4AF7F', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  clienteFotoTexto: { fontSize: 24 },
  clienteInfo: { flex: 1 },
  clienteNome: { color: '#6B4F3A', fontSize: 15, fontWeight: 'bold' },
  expandirIcon: { color: '#D4AF7F', fontSize: 16 },
  servico: { color: '#D4AF7F', fontSize: 13, marginTop: 2 },
  valor: { color: '#7BAE7F', fontSize: 15, fontWeight: 'bold', marginTop: 2 },
  enderecoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  enderecoTexto: { color: '#CBB8A6', fontSize: 12, flex: 1 },
  minutosTexto: { color: '#7B9BB5', fontSize: 12, fontWeight: 'bold', marginLeft: 8 },
  dataTexto: { color: '#CBB8A6', fontSize: 12, marginBottom: 5 },
  info: { color: '#CBB8A6', fontSize: 13, marginBottom: 4 },
  expandidoContainer: { borderTopWidth: 1, borderTopColor: '#D9CEC5', paddingTop: 12, marginTop: 5 },
  horariosTitulo: { color: '#6B4F3A', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  horariosRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  horarioAtivo: { backgroundColor: '#D4AF7F', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, margin: 4 },
  horarioInativo: { backgroundColor: '#E8DCCF', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, margin: 4, borderWidth: 1, borderColor: '#D9CEC5' },
  horarioTextoAtivo: { color: '#4A3020', fontSize: 13, fontWeight: 'bold' },
  horarioTexto: { color: '#CBB8A6', fontSize: 13 },
  horarioSelecionado: { color: '#7BAE7F', fontSize: 13, fontWeight: 'bold', marginBottom: 10 },
  botoesRow: { flexDirection: 'row', marginTop: 5 },
  botaoRecusar: { flex: 1, borderWidth: 2, borderColor: '#C0392B', borderRadius: 8, padding: 10, alignItems: 'center', marginRight: 8 },
  botaoRecusarTexto: { color: '#C0392B', fontWeight: 'bold' },
  botaoAceitar: { flex: 1, backgroundColor: '#D4AF7F', borderRadius: 8, padding: 10, alignItems: 'center' },
  botaoAceitarTexto: { color: '#4A3020', fontWeight: 'bold' },
  statusAceito: { color: '#7BAE7F', fontWeight: 'bold', marginTop: 8, marginBottom: 8 },
  botaoAtendimento: { backgroundColor: '#7BAE7F', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 5 },
  botaoAtendimentoTexto: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  faturamentoCard: { backgroundColor: '#F7F3EF', borderRadius: 15, padding: 25, alignItems: 'center', marginBottom: 15, shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  faturamentoLabel: { color: '#CBB8A6', fontSize: 14, marginBottom: 8 },
  faturamentoValor: { color: '#D4AF7F', fontSize: 36, fontWeight: 'bold' },
  faturamentoSub: { color: '#CBB8A6', fontSize: 13, marginTop: 5 },
  diasGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  diaAtivo: { backgroundColor: '#7BAE7F', borderRadius: 10, padding: 12, margin: 4, alignItems: 'center', minWidth: 45 },
  diaInativo: { backgroundColor: '#C0392B', borderRadius: 10, padding: 12, margin: 4, alignItems: 'center', minWidth: 45 },
  diaTextoAtivo: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  horariosGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  horarioAtivoAgenda: { backgroundColor: '#7BAE7F', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, margin: 4 },
  horarioInativoAgenda: { backgroundColor: '#C0392B', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, margin: 4 },
  legendaRow: { flexDirection: 'row', marginBottom: 20 },
  legendaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  legendaCor: { width: 16, height: 16, borderRadius: 8, marginRight: 6 },
  legendaTexto: { color: '#CBB8A6', fontSize: 13 },
  botaoSalvarAgenda: { width: '100%', backgroundColor: '#D4AF7F', borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 20 },
  botaoSalvarAgendaTexto: { color: '#4A3020', fontWeight: 'bold', fontSize: 16 },
  perfilFotoContainer: { alignItems: 'center', marginBottom: 20 },
  perfilFoto: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F7F3EF', alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 3, borderColor: '#D4AF7F', overflow: 'hidden' },
  perfilFotoTexto: { fontSize: 50 },
  botaoFoto: { backgroundColor: '#F7F3EF', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: '#D4AF7F' },
  botaoFotoTexto: { color: '#D4AF7F', fontSize: 13, fontWeight: 'bold' },
  perfilCard: { backgroundColor: '#F7F3EF', borderRadius: 12, padding: 15, marginBottom: 10, shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  perfilLabel: { color: '#CBB8A6', fontSize: 12, marginBottom: 5 },
  perfilValor: { color: '#6B4F3A', fontSize: 15, fontWeight: 'bold' },
  categoriasRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 },
  categoriaTag: { backgroundColor: '#D4AF7F', borderRadius: 15, paddingVertical: 4, paddingHorizontal: 10, margin: 3 },
  categoriaTagTexto: { color: '#4A3020', fontSize: 12, fontWeight: 'bold' },
  botaoEditar: { width: '100%', borderWidth: 2, borderColor: '#D4AF7F', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 10 },
  botaoEditarTexto: { color: '#D4AF7F', fontWeight: 'bold', fontSize: 16 },
  input: { width: '100%', backgroundColor: '#F7F3EF', borderRadius: 10, padding: 15, color: '#6B4F3A', marginBottom: 15, fontSize: 16, shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  categoriasGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  categoriaAtiva: { backgroundColor: '#D4AF7F', borderRadius: 12, padding: 12, margin: 5, alignItems: 'center', width: '28%' },
  categoriaInativa: { backgroundColor: '#F7F3EF', borderRadius: 12, padding: 12, margin: 5, alignItems: 'center', width: '28%', borderWidth: 1, borderColor: '#D9CEC5' },
  categoriaEmoji: { fontSize: 24, marginBottom: 5 },
  categoriaTextoAtivo: { color: '#4A3020', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  categoriaTexto: { color: '#CBB8A6', fontSize: 12, textAlign: 'center' },
  botaoSalvar: { width: '100%', backgroundColor: '#D4AF7F', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 10 },
  botaoSalvarTexto: { color: '#4A3020', fontWeight: 'bold', fontSize: 16 },
  botaoCancelar: { width: '100%', borderWidth: 2, borderColor: '#C0392B', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 10 },
  botaoCancelarTexto: { color: '#C0392B', fontWeight: 'bold', fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
});