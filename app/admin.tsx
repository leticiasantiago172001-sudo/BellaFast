import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, Image, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { supabase } from '../config-supabase';

const DIAS_SEMANA = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

function getDiaSemana(dataStr: string): string {
  if (!dataStr) return '';
  const [dia, mes] = dataStr.split('/').map(Number);
  const date = new Date(2026, mes - 1, dia);
  return DIAS_SEMANA[date.getDay()];
}

const NAV_ITEMS = [
  { id: 'visao', label: 'Visão Geral', icon: 'grid-outline' },
  { id: 'pedidos', label: 'Pedidos', icon: 'receipt-outline' },
  { id: 'profissionais', label: 'Profissionais', icon: 'people-outline' },
  { id: 'financeiro', label: 'Financeiro', icon: 'wallet-outline' },
  { id: 'influencers', label: 'Influencers', icon: 'star-outline' },
];

export default function Admin() {
  const [aba, setAba] = useState('visao');
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [filtroPedido, setFiltroPedido] = useState('todos');
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [saquesPendentes, setSaquesPendentes] = useState<any[]>([]);
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [plataformaFinanceiro, setPlataformaFinanceiro] = useState<any>(null);
  const [materiais, setMateriais] = useState<any[]>([]);
  const [formInfluencer, setFormInfluencer] = useState({ email: '', cupom: '', comissao: '10' });
  const [mostrarFormInfluencer, setMostrarFormInfluencer] = useState(false);
  const [editandoMaterial, setEditandoMaterial] = useState<any>(null);
  const [adicionandoMaterial, setAdicionandoMaterial] = useState(false);
  const [novoMaterial, setNovoMaterial] = useState({ titulo: '', descricao: '', tipo: 'padrao' });
  const [uploadandoMaterial, setUploadandoMaterial] = useState(false);

  const drawerAnim = useRef(new Animated.Value(-280)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const [{ data: ped }, { data: prof }, { data: cli }, { data: inf }, { data: saqs }, { data: mats }, { data: trans }, { data: plat }] = await Promise.all([
      supabase.from('pedidos').select('*').order('cliente_id', { ascending: false }),
      supabase.from('profissionais').select('*'),
      supabase.from('usuarios').select('*'),
      supabase.from('influencers').select('*').order('indicacoes_mes', { ascending: false }),
      supabase.from('saques').select('*, influencers(cupom)').in('status', ['pendente', 'processando', 'erro']).order('created_at', { ascending: false }),
      supabase.from('materiais_influencer').select('*').order('tipo'),
      supabase.from('transacoes').select('*').order('criado_em', { ascending: false }).limit(50),
      supabase.from('plataforma_financeiro').select('*').limit(1).single(),
    ]);
    setPedidos(ped || []);
    setProfissionais(prof || []);
    setClientes(cli || []);
    setInfluencers(inf || []);
    setSaquesPendentes(saqs || []);
    setMateriais(mats || []);
    setTransacoes(trans || []);
    setPlataformaFinanceiro(plat || null);
  }

  async function cadastrarInfluencer() {
    if (!formInfluencer.email || !formInfluencer.cupom) {
      Alert.alert('Preencha', 'Email e cupom sao obrigatorios');
      return;
    }
    const emailBusca = formInfluencer.email.trim().toLowerCase();
    const usuario = clientes.find((c: any) => c.email?.toLowerCase() === emailBusca);
    if (!usuario) {
      Alert.alert('Nao encontrado', 'Nenhum cliente com esse email');
      return;
    }
    await supabase.from('usuarios').update({ tipo_usuario: 'influencer' }).ilike('email', emailBusca);
    const { error } = await supabase.from('influencers').insert({
      usuario_id: usuario.id,
      cupom: formInfluencer.cupom.toUpperCase().replace(/\s/g, ''),
      comissao_percentual: parseFloat(formInfluencer.comissao) || 10,
    });
    if (error) {
      Alert.alert('Erro', error.message);
      return;
    }
    Alert.alert('Influencer cadastrada!', `${usuario.nome} agora e uma influencer com cupom ${formInfluencer.cupom.toUpperCase()}`);
    setFormInfluencer({ email: '', cupom: '', comissao: '10' });
    setMostrarFormInfluencer(false);
    carregarDados();
  }

  async function salvarMaterial(material: any) {
    await supabase.from('materiais_influencer')
      .update({ titulo: material.titulo, descricao: material.descricao, imagem_url: material.imagem_url, updated_at: new Date().toISOString() })
      .eq('id', material.id);
    setEditandoMaterial(null);
    carregarDados();
    Alert.alert('Material atualizado!');
  }

  async function pagarSaque(saqueId: string, influencerId: string, valor: number) {
    await supabase.from('saques').update({ status: 'pago', pago_em: new Date().toISOString() }).eq('id', saqueId);
    const { data: inf } = await supabase.from('influencers').select('saldo').eq('id', influencerId).single();
    if (inf) {
      await supabase.from('influencers').update({ saldo: Math.max(0, (inf.saldo || 0) - valor) }).eq('id', influencerId);
    }
    Alert.alert('Saque pago!');
    carregarDados();
  }

  async function liberarPagamentos() {
    Alert.alert('Liberar pagamentos?', 'Vai liberar todos os pedidos com repasse_em <= agora.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Liberar', onPress: async () => {
          const { data, error } = await supabase.functions.invoke('liberar-pagamento');
          if (error) { Alert.alert('Erro', error.message); return; }
          Alert.alert('Concluido!', `${data?.processados || 0} pagamento(s) liberado(s).${data?.erros ? '\n\nErros: ' + data.erros.join(', ') : ''}`);
          carregarDados();
        }
      },
    ]);
  }

  async function processarPixAutomatico() {
    Alert.alert('Processar PIX', 'Isso vai enviar PIX automaticamente para todas as influencers com saldo >= R$50. Confirmar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar', onPress: async () => {
          const { data, error } = await supabase.functions.invoke('processar-saques-auto');
          if (error) { Alert.alert('Erro', error.message); return; }
          Alert.alert('Concluido!', `${data?.pagos || 0} pagamento(s) processado(s).${data?.erros ? '\n\nErros: ' + data.erros.join(', ') : ''}`);
          carregarDados();
        }
      },
    ]);
  }

  async function uploadMidia(materialId: string | null, tipoArquivo: 'foto' | 'video') {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: tipoArquivo === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    const uri = asset.uri;
    const ext = uri.split('.').pop()?.toLowerCase() || (tipoArquivo === 'video' ? 'mp4' : 'jpg');
    const fileName = `material_${Date.now()}.${ext}`;

    setUploadandoMaterial(true);
    try {
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('materiais-influencer')
        .upload(fileName, arrayBuffer, {
          contentType: tipoArquivo === 'video' ? `video/${ext}` : `image/${ext}`,
          upsert: false,
        });

      if (uploadError) {
        Alert.alert('Erro no upload', uploadError.message);
        return null;
      }

      const { data: urlData } = supabase.storage.from('materiais-influencer').getPublicUrl(uploadData.path);
      return urlData.publicUrl;
    } catch (e: any) {
      Alert.alert('Erro', e.message);
      return null;
    } finally {
      setUploadandoMaterial(false);
    }
  }

  async function adicionarMaterial(tipoArquivo: 'foto' | 'video') {
    if (!novoMaterial.titulo) {
      Alert.alert('Titulo obrigatorio', 'Preencha o titulo antes de enviar a midia');
      return;
    }
    const url = await uploadMidia(null, tipoArquivo);
    if (!url) return;

    await supabase.from('materiais_influencer').insert({
      titulo: novoMaterial.titulo,
      descricao: novoMaterial.descricao,
      tipo: novoMaterial.tipo,
      imagem_url: url,
      tipo_arquivo: tipoArquivo,
      updated_at: new Date().toISOString(),
    });

    setNovoMaterial({ titulo: '', descricao: '', tipo: 'padrao' });
    setAdicionandoMaterial(false);
    carregarDados();
    Alert.alert('Material adicionado!');
  }

  async function trocarMidiaExistente(material: any, tipoArquivo: 'foto' | 'video') {
    const url = await uploadMidia(material.id, tipoArquivo);
    if (!url) return;
    setEditandoMaterial({ ...editandoMaterial, imagem_url: url, tipo_arquivo: tipoArquivo });
  }

  async function deletarMaterial(id: string) {
    Alert.alert('Confirmar', 'Deletar este material?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Deletar', style: 'destructive', onPress: async () => {
          await supabase.from('materiais_influencer').delete().eq('id', id);
          carregarDados();
        }
      },
    ]);
  }

  function abrirDrawer() {
    setDrawerAberto(true);
    Animated.parallel([
      Animated.timing(drawerAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }

  function fecharDrawer() {
    Animated.parallel([
      Animated.timing(drawerAnim, { toValue: -280, duration: 200, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setDrawerAberto(false));
  }

  function navegarPara(id: string) {
    setAba(id);
    fecharDrawer();
  }

  async function cancelarPedido(id: number) {
    Alert.alert('Cancelar pedido?', 'Esta acao nao pode ser desfeita.', [
      { text: 'Nao', style: 'cancel' },
      { text: 'Sim', style: 'destructive', onPress: async () => {
        await supabase.from('pedidos').update({ status: 'cancelado' }).eq('cliente_id', id);
        carregarDados();
      }},
    ]);
  }

  async function aprovarProfissional(id: string) {
    await supabase.from('profissionais').update({ status: 'aprovado' }).eq('usuario_id', id);
    carregarDados();
    Alert.alert('Profissional aprovada!');
  }

  async function bloquearProfissional(id: string) {
    await supabase.from('profissionais').update({ status: 'bloqueado' }).eq('usuario_id', id);
    carregarDados();
  }

  // KPIs
  const hoje = new Date();
  const hojeStr = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  const pedidosHoje = pedidos.filter((p) => p.data === hojeStr).length;
  const faturamento = pedidos.filter((p) => ['concluido', 'aceito'].includes(p.status))
    .reduce((t, p) => t + parseFloat(p.valor || 0), 0);
  const comissao = faturamento * 0.2;
  const pendentesCount = pedidos.filter((p) => p.status === 'pendente').length;
  const profPendentes = profissionais.filter((p) => p.status === 'em_analise').length;

  // Gráfico dias
  const pedidosPorDia: { [k: string]: number } = { DOM: 0, SEG: 0, TER: 0, QUA: 0, QUI: 0, SEX: 0, SAB: 0 };
  pedidos.forEach((p) => {
    const d = getDiaSemana(p.data);
    if (d) pedidosPorDia[d]++;
  });
  const maxDia = Math.max(...Object.values(pedidosPorDia), 1);
  const melhorDia = Object.entries(pedidosPorDia).sort((a, b) => b[1] - a[1])[0];

  // Distribuição status
  const statusCounts = {
    pendente: pedidos.filter((p) => p.status === 'pendente').length,
    aceito: pedidos.filter((p) => p.status === 'aceito').length,
    concluido: pedidos.filter((p) => p.status === 'concluido').length,
    recusado: pedidos.filter((p) => p.status === 'recusado').length,
  };
  const totalStatus = pedidos.length || 1;

  // Financeiro
  const porMetodo: { [k: string]: number } = { pix: 0, credito: 0, debito: 0 };
  pedidos.forEach((p) => {
    const m = p.metodo_pagamento || 'pix';
    if (porMetodo[m] !== undefined) porMetodo[m] += parseFloat(p.valor || 0);
  });

  const pedidosFiltrados = filtroPedido === 'todos' ? pedidos : pedidos.filter((p) => p.status === filtroPedido);

  const corStatus = (s: string) => {
    if (s === 'concluido') return '#7BAE7F';
    if (s === 'aceito') return '#D4AF7F';
    if (s === 'pendente') return '#CBB8A6';
    return '#C0392B';
  };

  return (
    <View style={styles.tela}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={abrirDrawer}>
          <Ionicons name="menu-outline" size={26} color="#F7F3EF" />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Admin BellaFast</Text>
        <View style={styles.headerAvatar}>
          <Text style={{ fontSize: 16 }}>👤</Text>
        </View>
      </View>

      {/* ── Tab pills ── */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {NAV_ITEMS.map((n) => (
            <TouchableOpacity key={n.id} style={aba === n.id ? styles.tabAtivo : styles.tabInativo} onPress={() => setAba(n.id)}>
              <Ionicons name={n.icon as any} size={14} color={aba === n.id ? '#4A3020' : '#CBB8A6'} />
              <Text style={aba === n.id ? styles.tabTextoAtivo : styles.tabTexto}> {n.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Conteúdo principal ── */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ===== VISÃO GERAL ===== */}
        {aba === 'visao' && (
          <View style={styles.conteudo}>

            {/* Greeting */}
            <View style={styles.greetCard}>
              <View>
                <Text style={styles.greetOla}>Bem-vindo, Admin! 👋</Text>
                <Text style={styles.greetSub}>Ji-Paraná, RO — {hojeStr}</Text>
              </View>
              {pendentesCount > 0 && (
                <View style={styles.alertaBadge}>
                  <Text style={styles.alertaBadgeTexto}>{pendentesCount} pendente{pendentesCount > 1 ? 's' : ''}</Text>
                </View>
              )}
            </View>

            {/* KPI Cards horizontal */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiScroll}>
              {[
                { valor: String(pedidosHoje), label: 'Hoje', icon: 'calendar-outline', cor: '#D4AF7F' },
                { valor: `R$${faturamento.toFixed(0)}`, label: 'Faturamento', icon: 'trending-up-outline', cor: '#7BAE7F' },
                { valor: String(clientes.length), label: 'Clientes', icon: 'person-outline', cor: '#7B9BB5' },
                { valor: String(profissionais.length), label: 'Profissionais', icon: 'briefcase-outline', cor: '#B5651D' },
                { valor: `R$${comissao.toFixed(0)}`, label: 'Comissão', icon: 'cash-outline', cor: '#6B4F3A' },
              ].map((k, i) => (
                <View key={i} style={styles.kpiCard}>
                  <View style={[styles.kpiIconBox, { backgroundColor: k.cor + '22' }]}>
                    <Ionicons name={k.icon as any} size={22} color={k.cor} />
                  </View>
                  <Text style={styles.kpiValor}>{k.valor}</Text>
                  <Text style={styles.kpiLabel}>{k.label}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Gráfico barras */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitulo}>Pedidos por dia da semana</Text>
                {pedidos.length > 0 && (
                  <View style={styles.melhorDiaBadge}>
                    <Text style={styles.melhorDiaBadgeTexto}>🏆 {melhorDia[0]}</Text>
                  </View>
                )}
              </View>
              <View style={styles.grafico}>
                {DIAS_SEMANA.map((dia) => {
                  const qtd = pedidosPorDia[dia];
                  const altura = Math.max((qtd / maxDia) * 90, 4);
                  const ativo = melhorDia[0] === dia && melhorDia[1] > 0;
                  return (
                    <View key={dia} style={styles.barraWrap}>
                      <Text style={styles.barraNro}>{qtd > 0 ? qtd : ''}</Text>
                      <View style={styles.barraTrack}>
                        <View style={[styles.barraFill, { height: altura, backgroundColor: ativo ? '#D4AF7F' : '#E8DCCF' }]} />
                      </View>
                      <Text style={[styles.barraDia, ativo && { color: '#D4AF7F', fontWeight: 'bold' }]}>{dia}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Distribuição status */}
            <View style={styles.card}>
              <Text style={styles.cardTitulo}>Distribuição de pedidos</Text>
              <View style={styles.stackedBar}>
                {statusCounts.pendente > 0 && <View style={{ flex: statusCounts.pendente, backgroundColor: '#CBB8A6' }} />}
                {statusCounts.aceito > 0 && <View style={{ flex: statusCounts.aceito, backgroundColor: '#D4AF7F' }} />}
                {statusCounts.concluido > 0 && <View style={{ flex: statusCounts.concluido, backgroundColor: '#7BAE7F' }} />}
                {statusCounts.recusado > 0 && <View style={{ flex: statusCounts.recusado, backgroundColor: '#C0392B' }} />}
                {pedidos.length === 0 && <View style={{ flex: 1, backgroundColor: '#E8DCCF' }} />}
              </View>
              <View style={styles.legendaRow}>
                {[
                  { label: 'Pendente', qtd: statusCounts.pendente, cor: '#CBB8A6' },
                  { label: 'Aceito', qtd: statusCounts.aceito, cor: '#D4AF7F' },
                  { label: 'Concluído', qtd: statusCounts.concluido, cor: '#7BAE7F' },
                  { label: 'Recusado', qtd: statusCounts.recusado, cor: '#C0392B' },
                ].map((item) => (
                  <View key={item.label} style={styles.legendaItem}>
                    <View style={[styles.legendaPonto, { backgroundColor: item.cor }]} />
                    <Text style={styles.legendaTexto}>{item.label} ({item.qtd})</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Últimos pedidos */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitulo}>Últimos pedidos</Text>
                <TouchableOpacity onPress={() => setAba('pedidos')}>
                  <Text style={styles.verTodos}>Ver todos →</Text>
                </TouchableOpacity>
              </View>
              {/* Cabeçalho tabela */}
              <View style={styles.tabelaHeader}>
                <Text style={[styles.tabelaCol, { flex: 2 }]}>Serviço</Text>
                <Text style={styles.tabelaCol}>Data</Text>
                <Text style={styles.tabelaCol}>Valor</Text>
                <Text style={styles.tabelaCol}>Status</Text>
              </View>
              {pedidos.slice(0, 6).map((p, i) => (
                <View key={i} style={[styles.tabelaLinha, i % 2 === 0 && styles.tabelaLinhaAlternada]}>
                  <Text style={[styles.tabelaTexto, { flex: 2 }]} numberOfLines={1}>{p.servico}</Text>
                  <Text style={styles.tabelaTexto}>{p.data}</Text>
                  <Text style={[styles.tabelaTexto, { color: '#7BAE7F', fontWeight: 'bold' }]}>
                    R${parseFloat(p.valor || 0).toFixed(0)}
                  </Text>
                  <View style={[styles.miniStatus, { backgroundColor: corStatus(p.status) + '22' }]}>
                    <Text style={[styles.miniStatusTexto, { color: corStatus(p.status) }]}>{p.status}</Text>
                  </View>
                </View>
              ))}
              {pedidos.length === 0 && <Text style={styles.vazio}>Nenhum pedido ainda</Text>}
            </View>

            {/* Alerta profissionais pendentes */}
            {profPendentes > 0 && (
              <TouchableOpacity style={styles.alertaCard} onPress={() => setAba('profissionais')}>
                <Ionicons name="alert-circle-outline" size={24} color="#D4AF7F" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.alertaTitulo}>{profPendentes} profissional(is) aguardando aprovação</Text>
                  <Text style={styles.alertaSub}>Toque para revisar →</Text>
                </View>
              </TouchableOpacity>
            )}

          </View>
        )}

        {/* ===== PEDIDOS ===== */}
        {aba === 'pedidos' && (
          <View style={styles.conteudo}>
            <View style={styles.cardHeader}>
              <Text style={styles.tituloPagina}>Pedidos ({pedidos.length})</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {['todos', 'pendente', 'aceito', 'concluido', 'recusado'].map((f) => (
                <TouchableOpacity key={f} style={filtroPedido === f ? styles.filtroAtivo : styles.filtroInativo} onPress={() => setFiltroPedido(f)}>
                  <Text style={filtroPedido === f ? styles.filtroTextoAtivo : styles.filtroTexto}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {pedidosFiltrados.length === 0 && <Text style={styles.vazio}>Nenhum pedido</Text>}
            {pedidosFiltrados.map((p, i) => (
              <View key={i} style={styles.pedidoCard}>
                <View style={[styles.pedidoAccent, { backgroundColor: corStatus(p.status) }]} />
                <View style={styles.pedidoCorpo}>
                  <View style={styles.pedidoTop}>
                    <Text style={styles.pedidoServico}>{p.servico}</Text>
                    <Text style={styles.pedidoValor}>R$ {parseFloat(p.valor || 0).toFixed(2).replace('.', ',')}</Text>
                  </View>
                  <Text style={styles.pedidoInfo}>📅 {p.data}{p.horario ? ` às ${p.horario}` : ''}</Text>
                  <Text style={styles.pedidoInfo} numberOfLines={1}>📍 {p.endereco}</Text>
                  <View style={styles.pedidoRodape}>
                    <View style={[styles.miniStatus, { backgroundColor: corStatus(p.status) + '22' }]}>
                      <Text style={[styles.miniStatusTexto, { color: corStatus(p.status) }]}>{p.status}</Text>
                    </View>
                    {(p.status === 'pendente' || p.status === 'aceito') && (
                      <TouchableOpacity style={styles.cancelarBtn} onPress={() => cancelarPedido(p.cliente_id)}>
                        <Text style={styles.cancelarTexto}>Cancelar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ===== PROFISSIONAIS ===== */}
        {aba === 'profissionais' && (
          <View style={styles.conteudo}>
            <Text style={styles.tituloPagina}>Profissionais ({profissionais.length})</Text>
            {profPendentes > 0 && (
              <View style={styles.alertaCard}>
                <Ionicons name="time-outline" size={20} color="#D4AF7F" />
                <Text style={{ color: '#6B4F3A', marginLeft: 8, fontSize: 13 }}>{profPendentes} aguardando aprovação</Text>
              </View>
            )}
            {profissionais.length === 0 && <Text style={styles.vazio}>Nenhuma profissional cadastrada</Text>}
            {profissionais.map((p, i) => {
              const aprovada = p.status === 'aprovado';
              const cli = clientes.find((c) => c.id === p.usuario_id);
              return (
                <View key={i} style={styles.profCard}>
                  <View style={styles.profTop}>
                    <View style={[styles.profAvatar, { backgroundColor: aprovada ? '#D4AF7F' : '#CBB8A6' }]}>
                      <Text style={{ fontSize: 22 }}>👩</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.profNome}>{cli?.nome || `Profissional #${i + 1}`}</Text>
                      <Text style={styles.profDetalhe}>{p.especialidades || 'Sem especialidades'}</Text>
                      <Text style={styles.profDetalhe}>Raio: {p.raio_atendimento || 10}km</Text>
                    </View>
                    <View style={[styles.miniStatus, { backgroundColor: aprovada ? '#7BAE7F22' : p.status === 'bloqueado' ? '#C0392B22' : '#CBB8A622' }]}>
                      <Text style={[styles.miniStatusTexto, { color: aprovada ? '#7BAE7F' : p.status === 'bloqueado' ? '#C0392B' : '#CBB8A6' }]}>
                        {aprovada ? 'Ativa' : p.status === 'bloqueado' ? 'Bloqueada' : 'Pendente'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.profBotoes}>
                    {!aprovada && (
                      <TouchableOpacity style={styles.btnAprovar} onPress={() => aprovarProfissional(p.usuario_id)}>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                        <Text style={styles.btnAprovarTexto}> Aprovar</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.btnBloquear} onPress={() => bloquearProfissional(p.usuario_id)}>
                      <Ionicons name="ban-outline" size={16} color="#C0392B" />
                      <Text style={styles.btnBloquearTexto}> {aprovada ? 'Bloquear' : 'Negar'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ===== FINANCEIRO ===== */}
        {aba === 'financeiro' && (() => {
          const saldoProfsDisp = profissionais.reduce((t, p) => t + (p.saldo_disponivel || 0), 0);
          const saldoProfsPend = profissionais.reduce((t, p) => t + (p.saldo_pendente || 0), 0);
          const saldoInfsDisp = influencers.reduce((t, i) => t + (i.saldo_disponivel || 0), 0);
          const saldoInfsPend = influencers.reduce((t, i) => t + (i.saldo_pendente || 0), 0);
          const totalRecebido = transacoes.reduce((t, tx) => t + (tx.valor_total || 0), 0);

          return (
            <View style={styles.conteudo}>
              <Text style={styles.tituloPagina}>Financeiro</Text>

              {/* Card plataforma */}
              <View style={[styles.finCard, { borderLeftColor: '#7BAE7F' }]}>
                <View style={styles.finCardRow}>
                  <View>
                    <Text style={styles.finLabel}>💰 Saldo da Plataforma</Text>
                    <Text style={[styles.finValor, { color: '#7BAE7F' }]}>
                      R$ {(plataformaFinanceiro?.saldo_total || 0).toFixed(2).replace('.', ',')}
                    </Text>
                    <Text style={{ color: '#CBB8A6', fontSize: 11, marginTop: 2 }}>Total recebido: R$ {totalRecebido.toFixed(2).replace('.', ',')}</Text>
                  </View>
                  <View style={[styles.kpiIconBox, { backgroundColor: '#7BAE7F22' }]}>
                    <Ionicons name="wallet-outline" size={24} color="#7BAE7F" />
                  </View>
                </View>
              </View>

              {/* Cards profissionais e influencers */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.finCard, { flex: 1, borderLeftColor: '#7B9BB5' }]}>
                  <Text style={[styles.finLabel, { fontSize: 12 }]}>👩 Profissionais</Text>
                  <Text style={[styles.finValor, { color: '#7B9BB5', fontSize: 16 }]}>R$ {saldoProfsDisp.toFixed(2).replace('.', ',')}</Text>
                  <Text style={{ color: '#CBB8A6', fontSize: 10 }}>disp.</Text>
                  <Text style={{ color: '#D4AF7F', fontSize: 13, fontWeight: 'bold' }}>R$ {saldoProfsPend.toFixed(2).replace('.', ',')}</Text>
                  <Text style={{ color: '#CBB8A6', fontSize: 10 }}>pend.</Text>
                </View>
                <View style={[styles.finCard, { flex: 1, borderLeftColor: '#D4AF7F' }]}>
                  <Text style={[styles.finLabel, { fontSize: 12 }]}>⭐ Influencers</Text>
                  <Text style={[styles.finValor, { color: '#D4AF7F', fontSize: 16 }]}>R$ {saldoInfsDisp.toFixed(2).replace('.', ',')}</Text>
                  <Text style={{ color: '#CBB8A6', fontSize: 10 }}>disp.</Text>
                  <Text style={{ color: '#D4AF7F', fontSize: 13, fontWeight: 'bold' }}>R$ {saldoInfsPend.toFixed(2).replace('.', ',')}</Text>
                  <Text style={{ color: '#CBB8A6', fontSize: 10 }}>pend.</Text>
                </View>
              </View>

              {/* Saques com erro */}
              {saquesPendentes.filter(s => s.status === 'erro').length > 0 && (
                <View style={[styles.card, { borderLeftWidth: 3, borderLeftColor: '#C0392B' }]}>
                  <Text style={[styles.cardTitulo, { color: '#C0392B' }]}>⚠️ Saques com erro ({saquesPendentes.filter(s => s.status === 'erro').length})</Text>
                  {saquesPendentes.filter(s => s.status === 'erro').map((s, i) => (
                    <View key={i} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E8DCCF' }}>
                      <Text style={styles.pedidoNome}>R$ {parseFloat(s.valor).toFixed(2).replace('.', ',')} — {s.chave_pix}</Text>
                      <Text style={{ color: '#C0392B', fontSize: 12 }}>{s.erro_mensagem}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Botao liberar pagamentos */}
              <TouchableOpacity
                style={{ backgroundColor: '#7B9BB5', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4, marginBottom: 4, flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                onPress={liberarPagamentos}
              >
                <Ionicons name="time-outline" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Liberar pagamentos (2h concluidos)</Text>
              </TouchableOpacity>

              {/* Botao processar PIX */}
              <TouchableOpacity
                style={{ backgroundColor: '#7BAE7F', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4, marginBottom: 4, flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                onPress={processarPixAutomatico}
              >
                <Ionicons name="flash-outline" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Processar PIX automatico (saldo >= R$50)</Text>
              </TouchableOpacity>

              {/* Ultimas transacoes */}
              <View style={styles.card}>
                <Text style={styles.cardTitulo}>Últimas transações</Text>
                {transacoes.length === 0 && <Text style={{ color: '#CBB8A6', textAlign: 'center', padding: 16 }}>Nenhuma transação ainda</Text>}
                {transacoes.slice(0, 10).map((tx, i) => (
                  <View key={i} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E8DCCF' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#6B4F3A', fontWeight: 'bold' }}>R$ {parseFloat(tx.valor_total || 0).toFixed(2).replace('.', ',')}</Text>
                      <View style={{ backgroundColor: tx.status === 'liberado' ? '#7BAE7F22' : '#D4AF7F22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ color: tx.status === 'liberado' ? '#7BAE7F' : '#D4AF7F', fontSize: 11, fontWeight: 'bold' }}>
                          {tx.status === 'liberado' ? '✅ Liberado' : '⏳ Pendente'}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 14, marginTop: 4 }}>
                      <Text style={{ color: '#CBB8A6', fontSize: 11 }}>👩 R$ {parseFloat(tx.valor_profissional || 0).toFixed(2).replace('.', ',')}</Text>
                      {tx.valor_influencer > 0 && <Text style={{ color: '#CBB8A6', fontSize: 11 }}>⭐ R$ {parseFloat(tx.valor_influencer || 0).toFixed(2).replace('.', ',')}</Text>}
                      <Text style={{ color: '#CBB8A6', fontSize: 11 }}>🏦 R$ {parseFloat(tx.valor_plataforma || 0).toFixed(2).replace('.', ',')}</Text>
                    </View>
                    {tx.cupom_usado && <Text style={{ color: '#D4AF7F', fontSize: 11 }}>🎟 {tx.cupom_usado}</Text>}
                    <Text style={{ color: '#CBB8A6', fontSize: 10, marginTop: 2 }}>{new Date(tx.criado_em).toLocaleDateString('pt-BR')}</Text>
                  </View>
                ))}
              </View>

              {/* Por método */}
              <View style={styles.card}>
                <Text style={styles.cardTitulo}>Por método de pagamento</Text>
                {[
                  { id: 'pix', label: '⚡ PIX', cor: '#7BAE7F' },
                  { id: 'credito', label: '💳 Crédito', cor: '#7B9BB5' },
                  { id: 'debito', label: '🏦 Débito', cor: '#D4AF7F' },
                ].map((m) => {
                  const pct = porMetodo[m.id] > 0 ? (porMetodo[m.id] / faturamento) * 100 : 0;
                  return (
                    <View key={m.id} style={styles.metodoLinha}>
                      <Text style={styles.metodoLabel}>{m.label}</Text>
                      <View style={styles.metodoBarraWrap}>
                        <View style={[styles.metodoBarra, { width: `${pct}%`, backgroundColor: m.cor }]} />
                      </View>
                      <Text style={[styles.metodoValor, { color: m.cor }]}>R${(porMetodo[m.id] || 0).toFixed(0)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })()}

        {/* ===== INFLUENCERS ===== */}
        {aba === 'influencers' && (
          <View style={styles.conteudo}>
            <View style={styles.cardHeader}>
              <Text style={styles.tituloPagina}>Influencers ({influencers.length})</Text>
              <TouchableOpacity
                style={[styles.btnAprovar, { paddingHorizontal: 14 }]}
                onPress={() => setMostrarFormInfluencer(!mostrarFormInfluencer)}
              >
                <Ionicons name="add-outline" size={16} color="#fff" />
                <Text style={styles.btnAprovarTexto}> Cadastrar</Text>
              </TouchableOpacity>
            </View>

            {mostrarFormInfluencer && (
              <View style={styles.card}>
                <Text style={styles.cardTitulo}>Nova influencer</Text>
                <Text style={styles.infLabel}>Email da cliente</Text>
                <TextInput
                  style={styles.infInput}
                  placeholder="email@exemplo.com"
                  placeholderTextColor="#CBB8A6"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formInfluencer.email}
                  onChangeText={(t) => setFormInfluencer({ ...formInfluencer, email: t })}
                />
                <Text style={styles.infLabel}>Cupom (sem espacos)</Text>
                <TextInput
                  style={styles.infInput}
                  placeholder="Ex: LETI10"
                  placeholderTextColor="#CBB8A6"
                  autoCapitalize="characters"
                  value={formInfluencer.cupom}
                  onChangeText={(t) => setFormInfluencer({ ...formInfluencer, cupom: t })}
                />
                <Text style={styles.infLabel}>% de comissao</Text>
                <TextInput
                  style={styles.infInput}
                  placeholder="10"
                  placeholderTextColor="#CBB8A6"
                  keyboardType="numeric"
                  value={formInfluencer.comissao}
                  onChangeText={(t) => setFormInfluencer({ ...formInfluencer, comissao: t })}
                />
                <TouchableOpacity style={styles.btnAprovar} onPress={cadastrarInfluencer}>
                  <Text style={styles.btnAprovarTexto}>Cadastrar influencer</Text>
                </TouchableOpacity>
              </View>
            )}

            {influencers.length === 0 && <Text style={styles.vazio}>Nenhuma influencer cadastrada</Text>}

            {influencers.map((inf, i) => {
              const cli = clientes.find((c) => c.id === inf.usuario_id);
              return (
                <View key={i} style={styles.profCard}>
                  <View style={styles.profTop}>
                    <View style={[styles.profAvatar, { backgroundColor: '#D4AF7F' }]}>
                      <Text style={{ fontSize: 22 }}>⭐</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.profNome}>{cli?.nome || 'Influencer'}</Text>
                      <Text style={styles.profDetalhe}>Cupom: {inf.cupom}</Text>
                      <Text style={styles.profDetalhe}>Comissao: {inf.comissao_percentual}%</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.kpiValor, { fontSize: 16 }]}>{inf.indicacoes_mes}</Text>
                      <Text style={styles.kpiLabel}>este mes</Text>
                    </View>
                  </View>
                  <View style={[styles.profBotoes, { borderTopWidth: 1, borderTopColor: '#E8DCCF', paddingTop: 10 }]}>
                    <View style={[styles.finCard, { flex: 1, marginBottom: 0, marginRight: 6, borderLeftColor: '#D4AF7F', padding: 10 }]}>
                      <Text style={styles.profDetalhe}>Saldo</Text>
                      <Text style={[styles.profNome, { color: '#D4AF7F' }]}>R$ {parseFloat(inf.saldo || 0).toFixed(2).replace('.', ',')}</Text>
                    </View>
                    <View style={[styles.finCard, { flex: 1, marginBottom: 0, borderLeftColor: '#7BAE7F', padding: 10 }]}>
                      <Text style={styles.profDetalhe}>Total</Text>
                      <Text style={[styles.profNome, { color: '#7BAE7F' }]}>{inf.total_indicacoes} indic.</Text>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Materiais de divulgacao */}
            <View style={{ marginTop: 10, marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={[styles.tituloPagina, { fontSize: 16 }]}>Materiais de divulgacao ({materiais.length})</Text>
                <TouchableOpacity
                  style={{ backgroundColor: '#7BAE7F', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => setAdicionandoMaterial(!adicionandoMaterial)}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, marginLeft: 4 }}>Novo</Text>
                </TouchableOpacity>
              </View>

              {/* Formulario novo material */}
              {adicionandoMaterial && (
                <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#D4AF7F', marginBottom: 12 }]}>
                  <Text style={[styles.tituloPagina, { marginBottom: 8, fontSize: 14 }]}>Novo material</Text>
                  <Text style={styles.infLabel}>Titulo</Text>
                  <TextInput style={styles.infInput} value={novoMaterial.titulo} onChangeText={(t) => setNovoMaterial({ ...novoMaterial, titulo: t })} placeholder="Ex: Post para Instagram" placeholderTextColor="#CBB8A6" />
                  <Text style={styles.infLabel}>Descricao (opcional)</Text>
                  <TextInput style={[styles.infInput, { height: 70, textAlignVertical: 'top' }]} value={novoMaterial.descricao} onChangeText={(t) => setNovoMaterial({ ...novoMaterial, descricao: t })} multiline placeholder="Instrucoes de uso..." placeholderTextColor="#CBB8A6" />
                  <Text style={styles.infLabel}>Tipo</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    {['padrao', 'promocao'].map((tp) => (
                      <TouchableOpacity
                        key={tp}
                        style={{ backgroundColor: novoMaterial.tipo === tp ? '#D4AF7F' : '#E8DCCF', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 14 }}
                        onPress={() => setNovoMaterial({ ...novoMaterial, tipo: tp })}
                      >
                        <Text style={{ color: novoMaterial.tipo === tp ? '#4A3020' : '#CBB8A6', fontWeight: 'bold', fontSize: 13 }}>
                          {tp === 'padrao' ? '📌 Padrao' : '🍂 Sazonal'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {uploadandoMaterial ? (
                    <Text style={{ color: '#CBB8A6', textAlign: 'center', padding: 16 }}>Enviando midia...</Text>
                  ) : (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={{ flex: 1, backgroundColor: '#6B4F3A', borderRadius: 10, padding: 12, alignItems: 'center' }}
                        onPress={() => adicionarMaterial('foto')}
                      >
                        <Ionicons name="image-outline" size={20} color="#D4AF7F" />
                        <Text style={{ color: '#D4AF7F', fontWeight: 'bold', fontSize: 12, marginTop: 4 }}>Upload Foto</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ flex: 1, backgroundColor: '#6B4F3A', borderRadius: 10, padding: 12, alignItems: 'center' }}
                        onPress={() => adicionarMaterial('video')}
                      >
                        <Ionicons name="videocam-outline" size={20} color="#D4AF7F" />
                        <Text style={{ color: '#D4AF7F', fontWeight: 'bold', fontSize: 12, marginTop: 4 }}>Upload Video</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <TouchableOpacity style={{ marginTop: 10, alignItems: 'center' }} onPress={() => setAdicionandoMaterial(false)}>
                    <Text style={{ color: '#CBB8A6', fontSize: 13 }}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              )}

              {materiais.map((m) => (
                <View key={m.id} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: m.tipo === 'promocao' ? '#C0392B' : '#7BAE7F' }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View style={[styles.miniStatus, { backgroundColor: m.tipo === 'promocao' ? '#C0392B22' : '#7BAE7F22' }]}>
                      <Text style={[styles.miniStatusTexto, { color: m.tipo === 'promocao' ? '#C0392B' : '#7BAE7F' }]}>
                        {m.tipo === 'promocao' ? '🍂 Sazonal' : '📌 Padrão'}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => deletarMaterial(m.id)}>
                      <Ionicons name="trash-outline" size={18} color="#C0392B" />
                    </TouchableOpacity>
                  </View>

                  {editandoMaterial?.id === m.id ? (
                    <View>
                      <Text style={styles.infLabel}>Título</Text>
                      <TextInput style={styles.infInput} value={editandoMaterial.titulo} onChangeText={(t) => setEditandoMaterial({ ...editandoMaterial, titulo: t })} placeholderTextColor="#CBB8A6" />
                      <Text style={styles.infLabel}>Descrição / Texto</Text>
                      <TextInput style={[styles.infInput, { height: 80, textAlignVertical: 'top' }]} value={editandoMaterial.descricao} onChangeText={(t) => setEditandoMaterial({ ...editandoMaterial, descricao: t })} multiline placeholderTextColor="#CBB8A6" />
                      {editandoMaterial.imagem_url ? (
                        <View style={{ marginBottom: 10 }}>
                          {editandoMaterial.tipo_arquivo === 'video' ? (
                            <Text style={{ color: '#7B9BB5', fontSize: 13 }}>▶ Video anexado</Text>
                          ) : (
                            <Image source={{ uri: editandoMaterial.imagem_url }} style={{ width: '100%', height: 120, borderRadius: 8 }} resizeMode="cover" />
                          )}
                        </View>
                      ) : null}
                      {uploadandoMaterial ? (
                        <Text style={{ color: '#CBB8A6', textAlign: 'center', padding: 10 }}>Enviando...</Text>
                      ) : (
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                          <TouchableOpacity
                            style={{ flex: 1, backgroundColor: '#E8DCCF', borderRadius: 8, padding: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                            onPress={() => trocarMidiaExistente(editandoMaterial, 'foto')}
                          >
                            <Ionicons name="image-outline" size={16} color="#6B4F3A" />
                            <Text style={{ color: '#6B4F3A', fontSize: 12, marginLeft: 4 }}>Trocar foto</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={{ flex: 1, backgroundColor: '#E8DCCF', borderRadius: 8, padding: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                            onPress={() => trocarMidiaExistente(editandoMaterial, 'video')}
                          >
                            <Ionicons name="videocam-outline" size={16} color="#6B4F3A" />
                            <Text style={{ color: '#6B4F3A', fontSize: 12, marginLeft: 4 }}>Trocar video</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      <View style={styles.profBotoes}>
                        <TouchableOpacity style={styles.btnAprovar} onPress={() => salvarMaterial(editandoMaterial)}>
                          <Text style={styles.btnAprovarTexto}>Salvar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnBloquear} onPress={() => setEditandoMaterial(null)}>
                          <Text style={styles.btnBloquearTexto}>Cancelar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View>
                      <Text style={styles.profNome}>{m.titulo}</Text>
                      <Text style={styles.profDetalhe}>{m.descricao}</Text>
                      {m.imagem_url ? (
                        m.tipo_arquivo === 'video'
                          ? <Text style={[styles.profDetalhe, { color: '#7B9BB5' }]}>▶ Video anexado</Text>
                          : <Image source={{ uri: m.imagem_url }} style={{ width: '100%', height: 120, borderRadius: 8, marginTop: 8 }} resizeMode="cover" />
                      ) : (
                        <Text style={styles.profDetalhe}>Sem foto ou video</Text>
                      )}
                      <TouchableOpacity style={[styles.btnAprovar, { marginTop: 10 }]} onPress={() => setEditandoMaterial({ ...m })}>
                        <Ionicons name="pencil-outline" size={14} color="#fff" />
                        <Text style={styles.btnAprovarTexto}> Editar</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={{ backgroundColor: '#7BAE7F', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 10, marginBottom: 4, flexDirection: 'row', justifyContent: 'center', gap: 8 }}
              onPress={processarPixAutomatico}
            >
              <Ionicons name="flash-outline" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Processar PIX automatico (saldo >= R$50)</Text>
            </TouchableOpacity>

            {saquesPendentes.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={[styles.tituloPagina, { fontSize: 16 }]}>Saques pendentes ({saquesPendentes.length})</Text>
                {saquesPendentes.map((s, i) => (
                  <View key={i} style={styles.pedidoCard}>
                    <View style={[styles.pedidoAccent, { backgroundColor: '#D4AF7F' }]} />
                    <View style={styles.pedidoCorpo}>
                      <View style={styles.pedidoTop}>
                        <Text style={styles.pedidoServico}>Saque solicitado</Text>
                        <Text style={styles.pedidoValor}>R$ {parseFloat(s.valor).toFixed(2).replace('.', ',')}</Text>
                      </View>
                      <Text style={styles.pedidoInfo}>Cupom: {s.influencers?.cupom || '---'}</Text>
                      <Text style={styles.pedidoInfo}>Chave PIX: {s.chave_pix}</Text>
                      <Text style={styles.pedidoInfo}>Solicitado em: {new Date(s.created_at).toLocaleDateString('pt-BR')}</Text>
                      <TouchableOpacity style={styles.btnAprovar} onPress={() => pagarSaque(s.id, s.influencer_id, parseFloat(s.valor))}>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                        <Text style={styles.btnAprovarTexto}> Marcar como pago</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Drawer overlay ── */}
      {drawerAberto && (
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} onPress={fecharDrawer} />
        </Animated.View>
      )}

      {/* ── Drawer lateral ── */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnim }] }]}>
        {/* Perfil */}
        <View style={styles.drawerPerfil}>
          <View style={styles.drawerAvatar}>
            <Text style={{ fontSize: 36 }}>👤</Text>
          </View>
          <Text style={styles.drawerNome}>Administrador</Text>
          <Text style={styles.drawerEmail}>BellaFast — Ji-Paraná</Text>
        </View>

        {/* Nav items */}
        <View style={styles.drawerNav}>
          {NAV_ITEMS.map((n) => (
            <TouchableOpacity
              key={n.id}
              style={[styles.drawerItem, aba === n.id && styles.drawerItemAtivo]}
              onPress={() => navegarPara(n.id)}
            >
              <Ionicons name={n.icon as any} size={20} color={aba === n.id ? '#D4AF7F' : '#CBB8A6'} />
              <Text style={[styles.drawerItemTexto, aba === n.id && styles.drawerItemTextoAtivo]}>
                {n.label}
              </Text>
              {n.id === 'profissionais' && profPendentes > 0 && (
                <View style={styles.drawerBadge}>
                  <Text style={styles.drawerBadgeTexto}>{profPendentes}</Text>
                </View>
              )}
              {n.id === 'pedidos' && pendentesCount > 0 && (
                <View style={styles.drawerBadge}>
                  <Text style={styles.drawerBadgeTexto}>{pendentesCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Rodapé drawer */}
        <View style={styles.drawerRodape}>
          <Text style={styles.drawerVersao}>BellaFast Admin v1.0</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#E8DCCF' },

  // Header
  header: { backgroundColor: '#6B4F3A', flexDirection: 'row', alignItems: 'center', paddingTop: 55, paddingBottom: 14, paddingHorizontal: 16 },
  headerBtn: { padding: 4 },
  headerTitulo: { flex: 1, color: '#F7F3EF', fontSize: 18, fontWeight: 'bold', marginLeft: 12 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#D4AF7F', alignItems: 'center', justifyContent: 'center' },

  // Tabs
  tabsWrapper: { backgroundColor: '#F7F3EF', borderBottomWidth: 1, borderBottomColor: '#D9CEC5' },
  tabsRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tabAtivo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D4AF7F', borderRadius: 20, paddingVertical: 7, paddingHorizontal: 14 },
  tabInativo: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingVertical: 7, paddingHorizontal: 14, borderWidth: 1, borderColor: '#D9CEC5' },
  tabTextoAtivo: { color: '#4A3020', fontWeight: 'bold', fontSize: 13 },
  tabTexto: { color: '#CBB8A6', fontSize: 13 },

  scroll: { flex: 1 },
  conteudo: { padding: 16 },
  tituloPagina: { fontSize: 20, fontWeight: 'bold', color: '#6B4F3A', marginBottom: 16 },

  // Greeting
  greetCard: { backgroundColor: '#6B4F3A', borderRadius: 16, padding: 20, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greetOla: { color: '#F7F3EF', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  greetSub: { color: '#CBB8A6', fontSize: 13 },
  alertaBadge: { backgroundColor: '#D4AF7F', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 12 },
  alertaBadgeTexto: { color: '#4A3020', fontSize: 12, fontWeight: 'bold' },

  // KPI Cards
  kpiScroll: { marginBottom: 16 },
  kpiCard: { backgroundColor: '#F7F3EF', borderRadius: 16, padding: 16, marginRight: 12, width: 130, shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  kpiIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  kpiValor: { fontSize: 22, fontWeight: 'bold', color: '#6B4F3A', marginBottom: 4 },
  kpiLabel: { fontSize: 12, color: '#CBB8A6' },

  // Card genérico
  card: { backgroundColor: '#F7F3EF', borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitulo: { fontSize: 15, fontWeight: 'bold', color: '#6B4F3A', marginBottom: 14 },
  verTodos: { fontSize: 13, color: '#D4AF7F', fontWeight: 'bold' },
  melhorDiaBadge: { backgroundColor: '#D4AF7F22', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 },
  melhorDiaBadgeTexto: { color: '#D4AF7F', fontSize: 12, fontWeight: 'bold' },

  // Gráfico
  grafico: { flexDirection: 'row', alignItems: 'flex-end', height: 110 },
  barraWrap: { flex: 1, alignItems: 'center' },
  barraNro: { fontSize: 10, color: '#CBB8A6', marginBottom: 4, height: 14 },
  barraTrack: { width: '60%', height: 90, justifyContent: 'flex-end' },
  barraFill: { width: '100%', borderRadius: 4 },
  barraDia: { fontSize: 10, color: '#CBB8A6', marginTop: 6 },

  // Stacked bar
  stackedBar: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', marginBottom: 14 },
  legendaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  legendaItem: { flexDirection: 'row', alignItems: 'center' },
  legendaPonto: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  legendaTexto: { fontSize: 11, color: '#6B4F3A' },

  // Tabela
  tabelaHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E8DCCF', marginBottom: 4 },
  tabelaCol: { flex: 1, fontSize: 11, color: '#CBB8A6', fontWeight: 'bold' },
  tabelaLinha: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  tabelaLinhaAlternada: { backgroundColor: '#F0EDE8', borderRadius: 8 },
  tabelaTexto: { flex: 1, fontSize: 12, color: '#6B4F3A' },
  miniStatus: { borderRadius: 8, paddingVertical: 2, paddingHorizontal: 7 },
  miniStatusTexto: { fontSize: 10, fontWeight: 'bold' },

  // Alerta
  alertaCard: { backgroundColor: '#F7F3EF', borderRadius: 12, padding: 14, marginBottom: 14, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, borderLeftColor: '#D4AF7F' },
  alertaTitulo: { fontSize: 13, fontWeight: 'bold', color: '#6B4F3A' },
  alertaSub: { fontSize: 12, color: '#D4AF7F', marginTop: 2 },

  // Pedidos
  pedidoCard: { backgroundColor: '#F7F3EF', borderRadius: 14, marginBottom: 10, flexDirection: 'row', overflow: 'hidden', shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  pedidoAccent: { width: 4 },
  pedidoCorpo: { flex: 1, padding: 14 },
  pedidoTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  pedidoServico: { fontSize: 15, fontWeight: 'bold', color: '#6B4F3A' },
  pedidoValor: { fontSize: 15, fontWeight: 'bold', color: '#7BAE7F' },
  pedidoInfo: { fontSize: 12, color: '#CBB8A6', marginBottom: 3 },
  pedidoRodape: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  cancelarBtn: { borderWidth: 1, borderColor: '#C0392B', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 12 },
  cancelarTexto: { color: '#C0392B', fontSize: 12, fontWeight: 'bold' },

  // Profissionais
  profCard: { backgroundColor: '#F7F3EF', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  profTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  profAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  profNome: { fontSize: 15, fontWeight: 'bold', color: '#6B4F3A', marginBottom: 2 },
  profDetalhe: { fontSize: 12, color: '#CBB8A6', marginBottom: 1 },
  profBotoes: { flexDirection: 'row', gap: 8 },
  btnAprovar: { flex: 1, flexDirection: 'row', backgroundColor: '#7BAE7F', borderRadius: 10, padding: 10, alignItems: 'center', justifyContent: 'center' },
  btnAprovarTexto: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  btnBloquear: { flex: 1, flexDirection: 'row', borderWidth: 1, borderColor: '#C0392B', borderRadius: 10, padding: 10, alignItems: 'center', justifyContent: 'center' },
  btnBloquearTexto: { color: '#C0392B', fontWeight: 'bold', fontSize: 13 },

  // Financeiro
  finCard: { backgroundColor: '#F7F3EF', borderRadius: 14, padding: 16, marginBottom: 12, borderLeftWidth: 4, shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  finCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  finLabel: { fontSize: 13, color: '#CBB8A6', marginBottom: 6 },
  finValor: { fontSize: 24, fontWeight: 'bold' },
  metodoLinha: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  metodoLabel: { width: 80, fontSize: 13, color: '#6B4F3A' },
  metodoBarraWrap: { flex: 1, height: 8, backgroundColor: '#E8DCCF', borderRadius: 4, marginHorizontal: 10, overflow: 'hidden' },
  metodoBarra: { height: 8, borderRadius: 4 },
  metodoValor: { width: 60, fontSize: 13, fontWeight: 'bold', textAlign: 'right' },
  metricaLinha: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E8DCCF' },
  metricaLabel: { fontSize: 14, color: '#6B4F3A' },
  metricaValor: { fontSize: 14, fontWeight: 'bold' },

  vazio: { color: '#CBB8A6', textAlign: 'center', padding: 30 },

  // Drawer
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  drawer: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 270, backgroundColor: '#4A3020', paddingTop: 60 },
  drawerPerfil: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#6B4F3A' },
  drawerAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#6B4F3A', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 3, borderColor: '#D4AF7F' },
  drawerNome: { color: '#F7F3EF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  drawerEmail: { color: '#CBB8A6', fontSize: 12 },
  drawerNav: { paddingTop: 12, paddingHorizontal: 12 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 4 },
  drawerItemAtivo: { backgroundColor: '#6B4F3A' },
  drawerItemTexto: { flex: 1, color: '#CBB8A6', fontSize: 15, marginLeft: 12 },
  drawerItemTextoAtivo: { color: '#D4AF7F', fontWeight: 'bold' },
  drawerBadge: { backgroundColor: '#D4AF7F', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  drawerBadgeTexto: { color: '#4A3020', fontSize: 11, fontWeight: 'bold' },
  drawerRodape: { position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center' },
  drawerVersao: { color: '#6B4F3A', fontSize: 12 },
  infLabel: { color: '#6B4F3A', fontSize: 13, fontWeight: 'bold', marginBottom: 6, marginTop: 4 },
  infInput: { backgroundColor: '#E8DCCF', borderRadius: 10, padding: 12, color: '#6B4F3A', marginBottom: 10, fontSize: 15, borderWidth: 1, borderColor: '#D9CEC5' },
});
