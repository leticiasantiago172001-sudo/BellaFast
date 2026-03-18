import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, ScrollView, StyleSheet, Text,
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
];

export default function Admin() {
  const [aba, setAba] = useState('visao');
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [filtroPedido, setFiltroPedido] = useState('todos');

  const drawerAnim = useRef(new Animated.Value(-280)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const [{ data: ped }, { data: prof }, { data: cli }] = await Promise.all([
      supabase.from('pedidos').select('*').order('cliente_id', { ascending: false }),
      supabase.from('profissionais').select('*'),
      supabase.from('usuarios').select('*'),
    ]);
    setPedidos(ped || []);
    setProfissionais(prof || []);
    setClientes(cli || []);
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
        {aba === 'financeiro' && (
          <View style={styles.conteudo}>
            <Text style={styles.tituloPagina}>Financeiro</Text>

            {/* Cards principais */}
            {[
              { label: 'Faturamento bruto', valor: faturamento, cor: '#D4AF7F', icon: 'trending-up-outline' },
              { label: 'Comissão BellaFast (20%)', valor: comissao, cor: '#7BAE7F', icon: 'cash-outline' },
              { label: 'Repasse profissionais (80%)', valor: faturamento * 0.8, cor: '#7B9BB5', icon: 'people-outline' },
            ].map((item) => (
              <View key={item.label} style={[styles.finCard, { borderLeftColor: item.cor }]}>
                <View style={styles.finCardRow}>
                  <View>
                    <Text style={styles.finLabel}>{item.label}</Text>
                    <Text style={[styles.finValor, { color: item.cor }]}>
                      R$ {item.valor.toFixed(2).replace('.', ',')}
                    </Text>
                  </View>
                  <View style={[styles.kpiIconBox, { backgroundColor: item.cor + '22' }]}>
                    <Ionicons name={item.icon as any} size={24} color={item.cor} />
                  </View>
                </View>
              </View>
            ))}

            {/* Por método */}
            <View style={styles.card}>
              <Text style={styles.cardTitulo}>Por método de pagamento</Text>
              {[
                { id: 'pix', label: '⚡ PIX', cor: '#7BAE7F' },
                { id: 'credito', label: '💳 Crédito', cor: '#7B9BB5' },
                { id: 'debito', label: '🏦 Débito', cor: '#D4AF7F' },
              ].map((m) => {
                const qtd = pedidos.filter((p) => (p.metodo_pagamento || 'pix') === m.id).length;
                const pct = porMetodo[m.id] > 0 ? (porMetodo[m.id] / faturamento) * 100 : 0;
                return (
                  <View key={m.id} style={styles.metodoLinha}>
                    <Text style={styles.metodoLabel}>{m.label}</Text>
                    <View style={styles.metodoBarraWrap}>
                      <View style={[styles.metodoBarra, { width: `${pct}%`, backgroundColor: m.cor }]} />
                    </View>
                    <Text style={[styles.metodoValor, { color: m.cor }]}>
                      R${(porMetodo[m.id] || 0).toFixed(0)}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Métricas */}
            <View style={styles.card}>
              <Text style={styles.cardTitulo}>Métricas</Text>
              {[
                { label: 'Ticket médio', valor: pedidos.length > 0 ? `R$ ${(faturamento / pedidos.length).toFixed(2).replace('.', ',')}` : 'R$ 0,00', cor: '#D4AF7F' },
                { label: 'Total de pedidos', valor: String(pedidos.length), cor: '#6B4F3A' },
                { label: 'Taxa de conclusão', valor: pedidos.length > 0 ? `${Math.round((statusCounts.concluido / pedidos.length) * 100)}%` : '0%', cor: '#7BAE7F' },
                { label: 'Taxa de recusa', valor: pedidos.length > 0 ? `${Math.round((statusCounts.recusado / pedidos.length) * 100)}%` : '0%', cor: '#C0392B' },
              ].map((m) => (
                <View key={m.label} style={styles.metricaLinha}>
                  <Text style={styles.metricaLabel}>{m.label}</Text>
                  <Text style={[styles.metricaValor, { color: m.cor }]}>{m.valor}</Text>
                </View>
              ))}
            </View>
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
});
