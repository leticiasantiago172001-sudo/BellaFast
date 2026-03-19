import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Clipboard, Image, Linking, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../config-supabase';

export default function PainelInfluencer() {
  const router = useRouter();
  const [influencer, setInfluencer] = useState<any>(null);
  const [comissoes, setComissoes] = useState<any[]>([]);
  const [saques, setSaques] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [materiais, setMateriais] = useState<any[]>([]);
  const [mostrarSaque, setMostrarSaque] = useState(false);
  const [chavePix, setChavePix] = useState('');
  const [valorSaque, setValorSaque] = useState('');
  const [mostrarDadosBancarios, setMostrarDadosBancarios] = useState(false);
  const [editandoDados, setEditandoDados] = useState(false);
  const [nomeTitular, setNomeTitular] = useState('');
  const [tipoChavePix, setTipoChavePix] = useState('cpf');
  const [chavePixSalva, setChavePixSalva] = useState('');

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', auth.user.email)
        .single();

      if (!usuario) return;

      const { data: inf } = await supabase
        .from('influencers')
        .select('*')
        .eq('usuario_id', usuario.id)
        .single();

      if (!inf) return;
      setInfluencer(inf);
      setNomeTitular(inf.nome_titular || '');
      setTipoChavePix(inf.tipo_chave_pix || 'cpf');
      setChavePixSalva(inf.chave_pix || '');

      const [{ data: com }, { data: saqs }, { data: mats }] = await Promise.all([
        supabase.from('comissoes').select('*').eq('influencer_id', inf.id).order('created_at', { ascending: false }),
        supabase.from('saques').select('*').eq('influencer_id', inf.id).order('created_at', { ascending: false }),
        supabase.from('materiais_influencer').select('*').order('tipo'),
      ]);

      setComissoes(com || []);
      setSaques(saqs || []);
      setMateriais(mats || []);
    } catch (e) {
      console.log('Erro:', e);
    } finally {
      setCarregando(false);
    }
  }

  async function salvarDadosBancarios() {
    if (!nomeTitular.trim()) {
      Alert.alert('Nome obrigatorio', 'Informe o nome do titular');
      return;
    }
    if (!chavePixSalva.trim()) {
      Alert.alert('Chave PIX obrigatoria', 'Informe sua chave PIX');
      return;
    }
    await supabase.from('influencers').update({
      nome_titular: nomeTitular.trim(),
      tipo_chave_pix: tipoChavePix,
      chave_pix: chavePixSalva.trim(),
    }).eq('id', influencer.id);
    setEditandoDados(false);
    carregarDados();
    Alert.alert('Dados salvos!', 'Seus dados bancarios foram atualizados.');
  }

  async function solicitarSaque() {
    if (!chavePixSalva) {
      Alert.alert('Dados bancarios', 'Cadastre sua chave PIX antes de solicitar saque.');
      setMostrarDadosBancarios(true);
      setEditandoDados(true);
      return;
    }
    const valor = parseFloat(valorSaque);
    if (!valor || valor <= 0) {
      Alert.alert('Valor invalido', 'Informe um valor valido.');
      return;
    }
    if (valor > (influencer?.saldo_disponivel || 0)) {
      Alert.alert('Saldo insuficiente', 'O valor solicitado e maior que seu saldo disponivel');
      return;
    }

    // Debita imediatamente para evitar duplo saque
    const novoSaldo = (influencer?.saldo_disponivel || 0) - valor;
    await supabase.from('influencers').update({
      saldo_disponivel: novoSaldo,
      saldo: novoSaldo,
    }).eq('id', influencer.id);

    await supabase.from('saques').insert({
      influencer_id: influencer.id,
      valor,
      chave_pix: chavePixSalva,
      status: 'processando',
      tipo: 'influencer',
    });

    // Dispara PIX automatico
    supabase.functions.invoke('processar-saques-auto', {
      body: { tipo: 'influencer', influencer_id: influencer.id },
    }).catch(() => {});

    Alert.alert('Solicitacao enviada!', 'Seu saque foi solicitado e sera processado em breve.');
    setMostrarSaque(false);
    setValorSaque('');
    carregarDados();
  }

  function copiarCupom() {
    Clipboard.setString(influencer?.cupom || '');
    Alert.alert('Copiado!', `Cupom ${influencer?.cupom} copiado!`);
  }

  function compartilharCupom() {
    Share.share({
      message: `Use meu cupom ${influencer?.cupom} no BellaFast e garanta seu servico de beleza a domicilio! Baixe o app e agende agora 💅`,
    });
  }

  if (carregando) {
    return (
      <View style={{ flex: 1, backgroundColor: '#E8DCCF', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#6B4F3A' }}>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>

        <TouchableOpacity onPress={() => router.back()} style={styles.voltar}>
          <Text style={styles.voltarTexto}>← Voltar</Text>
        </TouchableOpacity>

        <View style={styles.headerCard}>
          <Text style={styles.estrela}>⭐</Text>
          <Text style={styles.titulo}>Painel Influencer</Text>
          <Text style={styles.subtitulo}>Seus ganhos e indicacoes</Text>
        </View>

        {/* KPIs */}
        <View style={styles.kpisRow}>
          <View style={[styles.kpiCard, { borderLeftColor: '#D4AF7F' }]}>
            <Text style={styles.kpiValor}>R$ {(influencer?.saldo_pendente || 0).toFixed(2).replace('.', ',')}</Text>
            <Text style={styles.kpiLabel}>Pendente</Text>
            <Text style={{ fontSize: 9, color: '#CBB8A6' }}>libera em 2h</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: '#7BAE7F' }]}>
            <Text style={styles.kpiValor}>R$ {(influencer?.saldo_disponivel || 0).toFixed(2).replace('.', ',')}</Text>
            <Text style={styles.kpiLabel}>Disponivel</Text>
            <Text style={{ fontSize: 9, color: '#7BAE7F' }}>para sacar</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: '#7B9BB5' }]}>
            <Text style={styles.kpiValor}>{influencer?.indicacoes_mes || 0}</Text>
            <Text style={styles.kpiLabel}>Este mes</Text>
          </View>
        </View>

        {/* Cupom */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Seu cupom exclusivo</Text>
          <View style={styles.cupomBox}>
            <Text style={styles.cupomTexto}>{influencer?.cupom || '---'}</Text>
          </View>
          <Text style={styles.cupomDesc}>{influencer?.comissao_percentual || 10}% de comissao por pedido indicado</Text>
          <View style={styles.cupomBotoes}>
            <TouchableOpacity style={styles.btnCopiar} onPress={copiarCupom}>
              <Ionicons name="copy-outline" size={18} color="#4A3020" />
              <Text style={styles.btnCopiarTexto}> Copiar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnCompartilhar} onPress={compartilharCupom}>
              <Ionicons name="share-outline" size={18} color="#F7F3EF" />
              <Text style={styles.btnCompartilharTexto}> Compartilhar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dados Bancarios */}
        <TouchableOpacity style={styles.card} onPress={() => setMostrarDadosBancarios(!mostrarDadosBancarios)} activeOpacity={0.9}>
          <View style={styles.dadosHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 20 }}>🏦</Text>
              <Text style={styles.cardTitulo}>Dados bancarios</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: chavePixSalva ? '#7BAE7F22' : '#C0392B22' }]}>
              <Text style={[styles.statusTexto, { color: chavePixSalva ? '#7BAE7F' : '#C0392B' }]}>
                {chavePixSalva ? '✅ Cadastrado' : '⚠️ Pendente'}
              </Text>
            </View>
          </View>

          {mostrarDadosBancarios && (
            <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: '#E8DCCF', paddingTop: 14 }}>
              {!editandoDados && chavePixSalva ? (
                <View>
                  <View style={styles.dadoRow}>
                    <Text style={styles.dadoLabel}>Titular</Text>
                    <Text style={styles.dadoValor}>{nomeTitular || '—'}</Text>
                  </View>
                  <View style={styles.dadoRow}>
                    <Text style={styles.dadoLabel}>Tipo de chave</Text>
                    <Text style={styles.dadoValor}>{tipoChavePix?.toUpperCase()}</Text>
                  </View>
                  <View style={styles.dadoRow}>
                    <Text style={styles.dadoLabel}>Chave PIX</Text>
                    <Text style={styles.dadoValor}>{chavePixSalva}</Text>
                  </View>
                  <TouchableOpacity style={[styles.btnSaque, { marginTop: 12, alignSelf: 'flex-start', paddingHorizontal: 16 }]} onPress={() => setEditandoDados(true)}>
                    <Text style={styles.btnSaqueTexto}>✏️ Editar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  {!chavePixSalva && (
                    <Text style={{ color: '#C0392B', fontSize: 13, marginBottom: 12 }}>
                      Cadastre seus dados para poder solicitar saques via PIX.
                    </Text>
                  )}
                  <Text style={styles.saqueLabel}>Nome completo do titular</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Seu nome completo"
                    placeholderTextColor="#CBB8A6"
                    value={nomeTitular}
                    onChangeText={setNomeTitular}
                  />
                  <Text style={styles.saqueLabel}>Tipo de chave PIX</Text>
                  <View style={styles.tiposRow}>
                    {['cpf', 'cnpj', 'email', 'telefone', 'aleatoria'].map((tipo) => (
                      <TouchableOpacity
                        key={tipo}
                        style={[styles.tipoBtn, tipoChavePix === tipo && styles.tipoBtnAtivo]}
                        onPress={() => setTipoChavePix(tipo)}
                      >
                        <Text style={[styles.tipoBtnTexto, tipoChavePix === tipo && styles.tipoBtnTextoAtivo]}>
                          {tipo === 'aleatoria' ? 'Aleatória' : tipo.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.saqueLabel}>Chave PIX</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={
                      tipoChavePix === 'cpf' ? '000.000.000-00' :
                      tipoChavePix === 'cnpj' ? '00.000.000/0000-00' :
                      tipoChavePix === 'email' ? 'seu@email.com' :
                      tipoChavePix === 'telefone' ? '+55 11 99999-9999' :
                      'Chave aleatoria'
                    }
                    placeholderTextColor="#CBB8A6"
                    value={chavePixSalva}
                    onChangeText={setChavePixSalva}
                    keyboardType={tipoChavePix === 'email' ? 'email-address' : tipoChavePix === 'telefone' ? 'phone-pad' : 'default'}
                  />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {editandoDados && chavePixSalva && (
                      <TouchableOpacity style={[styles.btnSaqueDesabilitado, { flex: 1, padding: 14, alignItems: 'center', borderRadius: 10 }]} onPress={() => setEditandoDados(false)}>
                        <Text style={styles.btnSaqueTexto}>Cancelar</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[styles.btnConfirmarSaque, { flex: 1 }]} onPress={salvarDadosBancarios}>
                      <Text style={styles.btnSaqueTexto}>Salvar dados</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* Saque */}
        <View style={styles.card}>
          <View style={styles.saqueHeader}>
            <View>
              <Text style={styles.cardTitulo}>Saldo disponivel</Text>
              <Text style={styles.saqueValor}>R$ {(influencer?.saldo_disponivel || 0).toFixed(2).replace('.', ',')}</Text>
            </View>
            <TouchableOpacity
              style={(influencer?.saldo_disponivel || 0) > 0 ? styles.btnSaque : styles.btnSaqueDesabilitado}
              onPress={() => {
                if ((influencer?.saldo_disponivel || 0) > 0) {
                  setMostrarSaque(!mostrarSaque);
                } else {
                  Alert.alert('Saldo insuficiente', 'Nenhum saldo disponivel.');
                }
              }}
            >
              <Text style={styles.btnSaqueTexto}>Solicitar saque</Text>
            </TouchableOpacity>
          </View>

          {mostrarSaque && (
            <View style={styles.saqueForm}>
              {chavePixSalva ? (
                <View style={{ backgroundColor: '#E8DCCF', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                  <Text style={{ color: '#CBB8A6', fontSize: 12, marginBottom: 2 }}>PIX cadastrado</Text>
                  <Text style={{ color: '#6B4F3A', fontWeight: 'bold' }}>{chavePixSalva}</Text>
                </View>
              ) : (
                <Text style={{ color: '#C0392B', fontSize: 13, marginBottom: 12 }}>
                  ⚠️ Cadastre seus dados bancarios acima primeiro.
                </Text>
              )}
              <Text style={styles.saqueLabel}>Valor do saque (min. R$ 50,00)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 50.00"
                placeholderTextColor="#CBB8A6"
                keyboardType="numeric"
                value={valorSaque}
                onChangeText={setValorSaque}
              />
              <TouchableOpacity style={styles.btnConfirmarSaque} onPress={solicitarSaque}>
                <Text style={styles.btnSaqueTexto}>Solicitar saque via PIX</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Historico saques */}
        {saques.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Historico de saques</Text>
            {saques.map((s, i) => (
              <View key={i} style={styles.saqueItem}>
                <View>
                  <Text style={styles.saqueItemValor}>R$ {parseFloat(s.valor).toFixed(2).replace('.', ',')}</Text>
                  <Text style={styles.saqueItemData}>{new Date(s.created_at).toLocaleDateString('pt-BR')}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: s.status === 'pago' ? '#7BAE7F22' : '#D4AF7F22' }]}>
                  <Text style={[styles.statusTexto, { color: s.status === 'pago' ? '#7BAE7F' : '#D4AF7F' }]}>
                    {s.status === 'pago' ? 'Pago' : 'Pendente'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Comissoes */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Pedidos indicados</Text>
          {comissoes.length === 0 && (
            <Text style={styles.vazio}>Nenhuma indicacao ainda. Compartilhe seu cupom!</Text>
          )}
          {comissoes.map((c, i) => (
            <View key={i} style={styles.comissaoItem}>
              <View>
                <Text style={styles.comissaoValorPedido}>Pedido R$ {parseFloat(c.valor_pedido || 0).toFixed(2).replace('.', ',')}</Text>
                <Text style={styles.comissaoData}>{new Date(c.created_at).toLocaleDateString('pt-BR')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.comissaoValor, { color: c.status === 'liberado' ? '#7BAE7F' : '#CBB8A6' }]}>
                  + R$ {parseFloat(c.valor_comissao || 0).toFixed(2).replace('.', ',')}
                </Text>
                <Text style={styles.comissaoStatus}>{c.status === 'liberado' ? '✅ Liberado' : '⏳ Pendente'}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Materiais de divulgacao */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Materiais de divulgacao ({materiais.length})</Text>
          {materiais.length === 0 && (
            <Text style={styles.vazio}>Nenhum material disponivel no momento.</Text>
          )}
          {materiais.map((m) => (
            <View key={m.id} style={[styles.materialCard, { borderLeftColor: m.tipo === 'promocao' ? '#C0392B' : '#7BAE7F' }]}>
              <View style={[styles.materialTipoBadge, { backgroundColor: m.tipo === 'promocao' ? '#C0392B22' : '#7BAE7F22', alignSelf: 'flex-start', marginBottom: 10 }]}>
                <Text style={[styles.materialTipoTexto, { color: m.tipo === 'promocao' ? '#C0392B' : '#7BAE7F' }]}>
                  {m.tipo === 'promocao' ? '🍂 Sazonal' : '📌 Padrão'}
                </Text>
              </View>
              <Text style={styles.materialTitulo}>{m.titulo}</Text>
              {!!m.descricao && <Text style={styles.materialDescricao}>{m.descricao}</Text>}
              {m.imagem_url && (
                m.tipo_arquivo === 'video' || m.imagem_url.includes('.mp4') || m.imagem_url.includes('video') ? (
                  <TouchableOpacity style={styles.videoBtn} onPress={() => Linking.openURL(m.imagem_url)}>
                    <Ionicons name="videocam-outline" size={18} color="#D4AF7F" />
                    <Text style={styles.videoBtnTexto}> Abrir e baixar video</Text>
                  </TouchableOpacity>
                ) : (
                  <View>
                    <TouchableOpacity onPress={() => Linking.openURL(m.imagem_url)}>
                      <Image source={{ uri: m.imagem_url }} style={styles.materialImagem} resizeMode="cover" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.videoBtn} onPress={() => Linking.openURL(m.imagem_url)}>
                      <Ionicons name="download-outline" size={18} color="#D4AF7F" />
                      <Text style={styles.videoBtnTexto}> Salvar foto</Text>
                    </TouchableOpacity>
                  </View>
                )
              )}
            </View>
          ))}
        </View>

        {/* Ranking */}
        <TouchableOpacity style={styles.rankingBtn} onPress={() => router.push('/ranking-influencers')}>
          <Text style={styles.rankingEmoji}>🏆</Text>
          <Text style={styles.rankingTexto}>Ver ranking de influencers</Text>
          <Text style={styles.rankingArrow}>→</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: '#E8DCCF' },
  container: { padding: 20, paddingTop: 60 },
  voltar: { marginBottom: 15 },
  voltarTexto: { color: '#D4AF7F', fontSize: 16, fontWeight: 'bold' },
  headerCard: { backgroundColor: '#6B4F3A', borderRadius: 16, padding: 20, marginBottom: 20, alignItems: 'center' },
  estrela: { fontSize: 40, marginBottom: 8 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#F7F3EF', marginBottom: 4 },
  subtitulo: { fontSize: 13, color: '#CBB8A6' },
  kpisRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  kpiCard: { flex: 1, backgroundColor: '#F7F3EF', borderRadius: 12, padding: 14, borderLeftWidth: 3 },
  kpiValor: { fontSize: 15, fontWeight: 'bold', color: '#6B4F3A', marginBottom: 4 },
  kpiLabel: { fontSize: 10, color: '#CBB8A6' },
  card: { backgroundColor: '#F7F3EF', borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  cardTitulo: { fontSize: 15, fontWeight: 'bold', color: '#6B4F3A', marginBottom: 14 },
  cupomBox: { backgroundColor: '#6B4F3A', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 10 },
  cupomTexto: { fontSize: 30, fontWeight: 'bold', color: '#D4AF7F', letterSpacing: 4 },
  cupomDesc: { color: '#CBB8A6', fontSize: 12, textAlign: 'center', marginBottom: 14 },
  cupomBotoes: { flexDirection: 'row', gap: 10 },
  btnCopiar: { flex: 1, flexDirection: 'row', backgroundColor: '#D4AF7F', borderRadius: 10, padding: 12, alignItems: 'center', justifyContent: 'center' },
  btnCopiarTexto: { color: '#4A3020', fontWeight: 'bold', fontSize: 14 },
  btnCompartilhar: { flex: 1, flexDirection: 'row', backgroundColor: '#6B4F3A', borderRadius: 10, padding: 12, alignItems: 'center', justifyContent: 'center' },
  btnCompartilharTexto: { color: '#F7F3EF', fontWeight: 'bold', fontSize: 14 },
  saqueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  saqueValor: { fontSize: 26, fontWeight: 'bold', color: '#D4AF7F', marginTop: 4 },
  btnSaque: { backgroundColor: '#7BAE7F', borderRadius: 10, padding: 12 },
  btnSaqueDesabilitado: { backgroundColor: '#CBB8A6', borderRadius: 10, padding: 12 },
  btnSaqueTexto: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  saqueForm: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#E8DCCF', paddingTop: 14 },
  saqueLabel: { color: '#6B4F3A', fontSize: 13, fontWeight: 'bold', marginBottom: 6 },
  input: { backgroundColor: '#E8DCCF', borderRadius: 10, padding: 12, color: '#6B4F3A', marginBottom: 12, fontSize: 15, borderWidth: 1, borderColor: '#D9CEC5' },
  btnConfirmarSaque: { backgroundColor: '#7BAE7F', borderRadius: 10, padding: 14, alignItems: 'center' },
  saqueItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E8DCCF' },
  saqueItemValor: { fontSize: 15, fontWeight: 'bold', color: '#6B4F3A' },
  saqueItemData: { fontSize: 12, color: '#CBB8A6', marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  statusTexto: { fontSize: 12, fontWeight: 'bold' },
  comissaoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E8DCCF' },
  comissaoValorPedido: { fontSize: 14, fontWeight: 'bold', color: '#6B4F3A' },
  comissaoData: { fontSize: 12, color: '#CBB8A6', marginTop: 2 },
  comissaoValor: { fontSize: 15, fontWeight: 'bold' },
  comissaoStatus: { fontSize: 11, color: '#CBB8A6', marginTop: 2 },
  vazio: { color: '#CBB8A6', textAlign: 'center', paddingVertical: 20 },
  materialCard: { backgroundColor: '#E8DCCF', borderRadius: 12, padding: 14, marginBottom: 12, borderLeftWidth: 4 },
  materialHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  materialTipoBadge: { borderRadius: 8, paddingVertical: 3, paddingHorizontal: 10 },
  materialTipoTexto: { fontSize: 12, fontWeight: 'bold' },
  videoBtn: { backgroundColor: '#6B4F3A', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 10 },
  videoBtnTexto: { color: '#D4AF7F', fontWeight: 'bold', fontSize: 14 },
  materialTitulo: { fontSize: 15, fontWeight: 'bold', color: '#6B4F3A', marginBottom: 4 },
  materialDescricao: { fontSize: 13, color: '#6B4F3A', lineHeight: 20, marginBottom: 10 },
  materialImagem: { width: '100%', height: 180, borderRadius: 10, marginBottom: 10 },
  materialAbrirTexto: { color: '#D4AF7F', fontSize: 11, textAlign: 'center', marginTop: 4, marginBottom: 4 },
  dadosHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dadoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E8DCCF' },
  dadoLabel: { color: '#CBB8A6', fontSize: 13 },
  dadoValor: { color: '#6B4F3A', fontSize: 13, fontWeight: 'bold', flex: 1, textAlign: 'right' },
  tiposRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tipoBtn: { borderRadius: 8, borderWidth: 1, borderColor: '#D9CEC5', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#E8DCCF' },
  tipoBtnAtivo: { backgroundColor: '#6B4F3A', borderColor: '#6B4F3A' },
  tipoBtnTexto: { color: '#6B4F3A', fontSize: 12, fontWeight: 'bold' },
  tipoBtnTextoAtivo: { color: '#F7F3EF' },
  rankingBtn: { backgroundColor: '#F7F3EF', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  rankingEmoji: { fontSize: 24, marginRight: 12 },
  rankingTexto: { flex: 1, fontSize: 15, fontWeight: 'bold', color: '#6B4F3A' },
  rankingArrow: { color: '#D4AF7F', fontSize: 18, fontWeight: 'bold' },
});
