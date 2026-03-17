import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const pedidosIniciais = [
  { id: 1, cliente: 'Ana Silva', servico: 'Manicure simples', data: '17/03', horario: '09:00', endereco: 'Rua das Flores, 123', valor: 'R$ 45,00', distancia: '0.8 km', status: 'pendente' },
  { id: 2, cliente: 'Maria Costa', servico: 'Escova', data: '17/03', horario: '14:00', endereco: 'Av. Principal, 456', valor: 'R$ 60,00', distancia: '1.2 km', status: 'pendente' },
  { id: 3, cliente: 'Julia Santos', servico: 'Limpeza de pele', data: '18/03', horario: '10:00', endereco: 'Rua das Palmeiras, 789', valor: 'R$ 90,00', distancia: '2.1 km', status: 'pendente' },
  { id: 4, cliente: 'Carla Mendes', servico: 'Pedicure simples', data: '15/03', horario: '11:00', endereco: 'Rua das Rosas, 321', valor: 'R$ 40,00', distancia: '1.5 km', status: 'concluido' },
  { id: 5, cliente: 'Patricia Lima', servico: 'Manicure gel', data: '14/03', horario: '15:00', endereco: 'Av. das Arvores, 654', valor: 'R$ 80,00', distancia: '0.5 km', status: 'concluido' },
];

const todosServicos = ['Unhas', 'Cabelo', 'Massagem', 'Depilacao', 'Maquiagem', 'Estetica'];
const diasDoMes = Array.from({ length: 31 }, (_, i) => ({ dia: i + 1, status: i < 5 ? 'fechado' : i > 25 ? 'fechado' : 'aberto' }));

export default function Profissional() {
  const [pedidos, setPedidos] = useState(pedidosIniciais);
  const [aba, setAba] = useState('pedidos');
  const [especialidades, setEspecialidades] = useState(['Unhas', 'Estetica']);
  const [dias, setDias] = useState(diasDoMes);

  function aceitar(id: number) { setPedidos((prev) => prev.map((p) => p.id === id ? Object.assign({}, p, { status: 'aceito' }) : p)); }
  function recusar(id: number) { setPedidos((prev) => prev.map((p) => p.id === id ? Object.assign({}, p, { status: 'recusado' }) : p)); }
  function toggleEsp(s: string) { setEspecialidades((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]); }
  function toggleDia(i: number) { setDias((prev) => prev.map((d, idx) => idx === i ? Object.assign({}, d, { status: d.status === 'aberto' ? 'fechado' : 'aberto' }) : d)); }

  const pendentes = pedidos.filter((p) => p.status === 'pendente');
  const aceitos = pedidos.filter((p) => p.status === 'aceito');
  const concluidos = pedidos.filter((p) => p.status === 'concluido');
  const totalGanho = concluidos.reduce((t, p) => t + parseFloat(p.valor.replace('R$ ', '').replace(',', '.')), 0);

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
            <Text style={styles.secao}>Pendentes ({pendentes.length})</Text>
            {pendentes.length === 0 && <Text style={styles.vazio}>Nenhum pedido pendente</Text>}
            {pendentes.map((p) => (
              <View key={p.id} style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.clienteNome}>{p.cliente}</Text>
                  <Text style={styles.distancia}>{p.distancia}</Text>
                </View>
                <Text style={styles.servico}>{p.servico}</Text>
                <Text style={styles.info}>Data: {p.data} as {p.horario}</Text>
                <Text style={styles.info}>Local: {p.endereco}</Text>
                <Text style={styles.valor}>{p.valor}</Text>
                <View style={styles.row}>
                  <TouchableOpacity style={styles.botaoRecusar} onPress={() => recusar(p.id)}>
                    <Text style={styles.botaoRecusarTexto}>Recusar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.botaoAceitar} onPress={() => aceitar(p.id)}>
                    <Text style={styles.botaoAceitarTexto}>Aceitar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <Text style={styles.secao}>Aceitos ({aceitos.length})</Text>
            {aceitos.map((p) => (
              <View key={p.id} style={styles.cardAceito}>
                <View style={styles.row}>
                  <Text style={styles.clienteNome}>{p.cliente}</Text>
                  <Text style={styles.distancia}>{p.distancia}</Text>
                </View>
                <Text style={styles.servico}>{p.servico}</Text>
                <Text style={styles.info}>Data: {p.data} as {p.horario}</Text>
                <Text style={styles.valor}>{p.valor}</Text>
                <Text style={styles.statusAceito}>Aceito</Text>
              </View>
            ))}
            <Text style={styles.secao}>Ultimos atendimentos</Text>
            {concluidos.map((p) => (
              <View key={p.id} style={styles.cardConcluido}>
                <View style={styles.row}>
                  <Text style={styles.clienteNome}>{p.cliente}</Text>
                  <Text style={styles.valorVerde}>{p.valor}</Text>
                </View>
                <Text style={styles.servico}>{p.servico}</Text>
                <Text style={styles.info}>Data: {p.data} as {p.horario}</Text>
              </View>
            ))}
          </View>
        )}

        {aba === 'agenda' && (
          <View>
            <Text style={styles.secao}>Disponibilidade - Marco 2026</Text>
            <Text style={styles.dica}>Toque num dia para abrir ou fechar</Text>
            <View style={styles.legendaRow}>
              <View style={styles.legendaItem}>
                <View style={styles.bolinhVerde} />
                <Text style={styles.legendaTexto}>Disponivel</Text>
              </View>
              <View style={styles.legendaItem}>
                <View style={styles.bolinhVermelha} />
                <Text style={styles.legendaTexto}>Fechado</Text>
              </View>
            </View>
            <View style={styles.calendarioGrid}>
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((d) => (
                <Text key={d} style={styles.cabecalhoDia}>{d}</Text>
              ))}
              {dias.map((d, i) => (
                <TouchableOpacity key={i} style={d.status === 'aberto' ? styles.diaAberto : styles.diaFechado} onPress={() => toggleDia(i)}>
                  <Text style={d.status === 'aberto' ? styles.diaNumerAberto : styles.diaNumerFechado}>{d.dia}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.secao}>Meus servicos</Text>
            <Text style={styles.dica}>Selecione o que voce faz</Text>
            <View style={styles.tagsRow}>
              {todosServicos.map((s) => (
                <TouchableOpacity key={s} style={especialidades.includes(s) ? styles.tagAtiva : styles.tagInativa} onPress={() => toggleEsp(s)}>
                  <Text style={especialidades.includes(s) ? styles.tagTextoAtivo : styles.tagTexto}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.botaoSalvar}>
              <Text style={styles.botaoSalvarTexto}>Salvar</Text>
            </TouchableOpacity>
          </View>
        )}

        {aba === 'ganhos' && (
          <View>
            <View style={styles.faturamentoCard}>
              <Text style={styles.faturamentoLabel}>Total ganho</Text>
              <Text style={styles.faturamentoValor}>R$ {totalGanho.toFixed(2).replace('.', ',')}</Text>
              <Text style={styles.faturamentoSub}>{concluidos.length} servicos concluidos</Text>
            </View>
            <View style={styles.faturamentoCard}>
              <Text style={styles.faturamentoLabel}>A receber</Text>
              <Text style={styles.faturamentoValor}>R$ {aceitos.reduce((t, p) => t + parseFloat(p.valor.replace('R$ ', '').replace(',', '.')), 0).toFixed(2).replace('.', ',')}</Text>
              <Text style={styles.faturamentoSub}>{aceitos.length} servicos aceitos</Text>
            </View>
            <Text style={styles.secao}>Historico</Text>
            {concluidos.map((p) => (
              <View key={p.id} style={styles.cardConcluido}>
                <View style={styles.row}>
                  <Text style={styles.clienteNome}>{p.cliente}</Text>
                  <Text style={styles.valorVerde}>{p.valor}</Text>
                </View>
                <Text style={styles.servico}>{p.servico}</Text>
                <Text style={styles.info}>Data: {p.data}</Text>
              </View>
            ))}
          </View>
        )}

        {aba === 'perfil' && (
          <View style={styles.perfilContainer}>
            <View style={styles.perfilFoto}>
              <Text style={styles.perfilFotoTexto}>J</Text>
            </View>
            <Text style={styles.perfilNome}>Jessica Oliveira</Text>
            <Text style={styles.perfilProfissao}>Manicure e Esteticista</Text>
            <View style={styles.avaliacaoRow}>
              <Text style={styles.estrelas}>★★★★★</Text>
              <Text style={styles.avaliacaoTexto}>4.9 (127 avaliacoes)</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumero}>127</Text>
                <Text style={styles.statLabel}>Atendimentos</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumero}>2 anos</Text>
                <Text style={styles.statLabel}>Experiencia</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumero}>5 km</Text>
                <Text style={styles.statLabel}>Raio</Text>
              </View>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitulo}>Informacoes</Text>
              <View style={styles.infoLinha}>
                <Text style={styles.infoLabel}>Telefone</Text>
                <Text style={styles.infoValor}>(11) 99999-9999</Text>
              </View>
              <View style={styles.infoLinha}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValor}>jessica@email.com</Text>
              </View>
              <View style={styles.infoLinha}>
                <Text style={styles.infoLabel}>Endereco</Text>
                <Text style={styles.infoValor}>Rua das Flores, 123</Text>
              </View>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitulo}>Minhas especialidades</Text>
              <View style={styles.tagsRow}>
                {especialidades.map((tag) => (
                  <View key={tag} style={styles.tagAtiva}>
                    <Text style={styles.tagTextoAtivo}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
            <TouchableOpacity style={styles.botaoEditar}>
              <Text style={styles.botaoEditarTexto}>Editar perfil</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: '#1a0a2e' },
  container: { padding: 20, paddingTop: 60 },
  abas: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#2d1b4e', borderRadius: 10, padding: 4 },
  abaAtiva: { flex: 1, backgroundColor: '#f0a500', borderRadius: 8, padding: 8, alignItems: 'center' },
  abaInativa: { flex: 1, padding: 8, alignItems: 'center' },
  abaTextoAtivo: { color: '#1a0a2e', fontWeight: 'bold', fontSize: 11 },
  abaTexto: { color: '#999', fontSize: 11 },
  secao: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 8, marginTop: 10 },
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
  valorVerde: { color: '#00cc66', fontWeight: 'bold', fontSize: 16 },
  botaoRecusar: { flex: 1, borderWidth: 2, borderColor: '#ff4444', borderRadius: 8, padding: 10, alignItems: 'center', marginRight: 8 },
  botaoRecusarTexto: { color: '#ff4444', fontWeight: 'bold' },
  botaoAceitar: { flex: 1, backgroundColor: '#f0a500', borderRadius: 8, padding: 10, alignItems: 'center' },
  botaoAceitarTexto: { color: '#1a0a2e', fontWeight: 'bold' },
  statusAceito: { color: '#00cc66', fontWeight: 'bold', marginTop: 8 },
  dica: { color: '#999', fontSize: 12, marginBottom: 12 },
  legendaRow: { flexDirection: 'row', marginBottom: 12 },
  legendaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  bolinhVerde: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#00cc66', marginRight: 6 },
  bolinhVermelha: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ff4444', marginRight: 6 },
  legendaTexto: { color: '#999', fontSize: 13 },
  calendarioGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  cabecalhoDia: { width: '14.28%', textAlign: 'center', color: '#999', fontSize: 11, marginBottom: 8 },
  diaAberto: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#00cc6633', borderRadius: 8, marginBottom: 4 },
  diaFechado: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff444433', borderRadius: 8, marginBottom: 4 },
  diaNumerAberto: { color: '#00cc66', fontWeight: 'bold', fontSize: 12 },
  diaNumerFechado: { color: '#ff4444', fontWeight: 'bold', fontSize: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  tagAtiva: { backgroundColor: '#f0a500', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, margin: 4 },
  tagInativa: { backgroundColor: '#2d1b4e', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, margin: 4, borderWidth: 1, borderColor: '#555' },
  tagTextoAtivo: { color: '#1a0a2e', fontWeight: 'bold', fontSize: 14 },
  tagTexto: { color: '#999', fontSize: 14 },
  botaoSalvar: { width: '100%', backgroundColor: '#f0a500', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 5, marginBottom: 20 },
  botaoSalvarTexto: { color: '#1a0a2e', fontWeight: 'bold', fontSize: 16 },
  faturamentoCard: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 25, alignItems: 'center', marginBottom: 15 },
  faturamentoLabel: { color: '#999', fontSize: 14, marginBottom: 8 },
  faturamentoValor: { color: '#f0a500', fontSize: 36, fontWeight: 'bold' },
  faturamentoSub: { color: '#999', fontSize: 13, marginTop: 5 },
  perfilContainer: { alignItems: 'center' },
  perfilFoto: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0a500', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  perfilFotoTexto: { fontSize: 40, fontWeight: 'bold', color: '#1a0a2e' },
  perfilNome: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', marginBottom: 5 },
  perfilProfissao: { fontSize: 14, color: '#999', marginBottom: 10 },
  avaliacaoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  estrelas: { color: '#f0a500', fontSize: 18, marginRight: 8 },
  avaliacaoTexto: { color: '#999', fontSize: 14 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  statCard: { backgroundColor: '#2d1b4e', borderRadius: 12, padding: 15, alignItems: 'center', flex: 1, marginHorizontal: 4 },
  statNumero: { color: '#f0a500', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: '#999', fontSize: 12, marginTop: 4 },
  infoCard: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 20, width: '100%', marginBottom: 15 },
  infoCardTitulo: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  infoLinha: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoLabel: { color: '#999', fontSize: 14 },
  infoValor: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  botaoEditar: { width: '100%', borderWidth: 2, borderColor: '#f0a500', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 10, marginBottom: 30 },
  botaoEditarTexto: { color: '#f0a500', fontWeight: 'bold', fontSize: 16 },
});