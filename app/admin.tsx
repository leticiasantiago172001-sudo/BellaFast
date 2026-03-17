import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const dadosDash = {
  pedidosHoje: 12,
  faturamentoHoje: 'R$ 890,00',
  profissionaisAtivas: 8,
  clientesTotal: 47,
};

const pedidos = [
  { id: 1, cliente: 'Ana Silva', profissional: 'Jessica Oliveira', servico: 'Manicure simples', data: '17/03', horario: '09:00', valor: 'R$ 45,00', status: 'concluido' },
  { id: 2, cliente: 'Maria Costa', profissional: 'Camila Santos', servico: 'Escova', data: '17/03', horario: '14:00', valor: 'R$ 60,00', status: 'em_andamento' },
  { id: 3, cliente: 'Julia Santos', profissional: 'Aguardando', servico: 'Limpeza de pele', data: '17/03', horario: '16:00', valor: 'R$ 90,00', status: 'pendente' },
  { id: 4, cliente: 'Patricia Lima', profissional: 'Fernanda Lima', servico: 'Manicure gel', data: '16/03', horario: '10:00', valor: 'R$ 80,00', status: 'concluido' },
  { id: 5, cliente: 'Carla Mendes', profissional: 'Jessica Oliveira', servico: 'Pedicure', data: '16/03', horario: '15:00', valor: 'R$ 40,00', status: 'concluido' },
];

const profissionais = [
  { id: 1, nome: 'Jessica Oliveira', especialidade: 'Unhas', avaliacao: '4.9', atendimentos: 127, status: 'ativa', ganhos: 'R$ 3.240,00' },
  { id: 2, nome: 'Camila Santos', especialidade: 'Cabelo', avaliacao: '4.7', atendimentos: 89, status: 'ativa', ganhos: 'R$ 2.890,00' },
  { id: 3, nome: 'Fernanda Lima', especialidade: 'Massagem', avaliacao: '4.8', atendimentos: 64, status: 'ativa', ganhos: 'R$ 4.120,00' },
  { id: 4, nome: 'Bianca Rocha', especialidade: 'Depilacao', avaliacao: '4.6', atendimentos: 43, status: 'inativa', ganhos: 'R$ 1.540,00' },
];

const clientes = [
  { id: 1, nome: 'Ana Silva', email: 'ana@email.com', pedidos: 8, gasto: 'R$ 420,00', ultima: '17/03' },
  { id: 2, nome: 'Maria Costa', email: 'maria@email.com', pedidos: 5, gasto: 'R$ 280,00', ultima: '17/03' },
  { id: 3, nome: 'Julia Santos', email: 'julia@email.com', pedidos: 3, gasto: 'R$ 190,00', ultima: '17/03' },
  { id: 4, nome: 'Patricia Lima', email: 'patricia@email.com', pedidos: 12, gasto: 'R$ 680,00', ultima: '16/03' },
];

const avaliacoes = [
  { id: 1, cliente: 'Ana Silva', profissional: 'Jessica Oliveira', servico: 'Manicure', nota: 5, comentario: 'Excelente servico, muito cuidadosa!', data: '17/03' },
  { id: 2, cliente: 'Patricia Lima', profissional: 'Fernanda Lima', servico: 'Massagem', nota: 5, comentario: 'Amei demais, voltarei sempre!', data: '16/03' },
  { id: 3, cliente: 'Carla Mendes', profissional: 'Jessica Oliveira', servico: 'Pedicure', nota: 4, comentario: 'Muito boa, recomendo!', data: '16/03' },
];

export default function Admin() {
  const [aba, setAba] = useState('dashboard');

  const corStatus = (s: string) => {
    if (s === 'concluido') return '#00cc66';
    if (s === 'em_andamento') return '#f0a500';
    if (s === 'pendente') return '#999';
    return '#ff4444';
  };

  const labelStatus = (s: string) => {
    if (s === 'concluido') return 'Concluido';
    if (s === 'em_andamento') return 'Em andamento';
    if (s === 'pendente') return 'Pendente';
    return s;
  };

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>

        <Text style={styles.titulo}>Painel Admin</Text>
        <Text style={styles.subtitulo}>BellaFast</Text>

        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.abasScroll}>
          {['dashboard', 'pedidos', 'profissionais', 'clientes', 'avaliacoes', 'financeiro'].map((a) => (
            <TouchableOpacity key={a} style={aba === a ? styles.abaAtiva : styles.abaInativa} onPress={() => setAba(a)}>
              <Text style={aba === a ? styles.abaTextoAtivo : styles.abaTexto}>{a.charAt(0).toUpperCase() + a.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {aba === 'dashboard' && (
          <View>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>📦</Text>
                <Text style={styles.statNumero}>{dadosDash.pedidosHoje}</Text>
                <Text style={styles.statLabel}>Pedidos hoje</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>💰</Text>
                <Text style={styles.statNumero}>R$ 890</Text>
                <Text style={styles.statLabel}>Faturamento hoje</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>💅</Text>
                <Text style={styles.statNumero}>{dadosDash.profissionaisAtivas}</Text>
                <Text style={styles.statLabel}>Profissionais ativas</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>👩</Text>
                <Text style={styles.statNumero}>{dadosDash.clientesTotal}</Text>
                <Text style={styles.statLabel}>Clientes</Text>
              </View>
            </View>

            <Text style={styles.secao}>Ultimos pedidos</Text>
            {pedidos.slice(0, 3).map((p) => (
              <View key={p.id} style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.clienteNome}>{p.cliente}</Text>
                  <Text style={{ color: corStatus(p.status), fontWeight: 'bold' }}>{labelStatus(p.status)}</Text>
                </View>
                <Text style={styles.info}>Servico: {p.servico}</Text>
                <Text style={styles.info}>Profissional: {p.profissional}</Text>
                <Text style={styles.valor}>{p.valor}</Text>
              </View>
            ))}
          </View>
        )}

        {aba === 'pedidos' && (
          <View>
            <Text style={styles.secao}>Todos os pedidos ({pedidos.length})</Text>
            {pedidos.map((p) => (
              <View key={p.id} style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.clienteNome}>{p.cliente}</Text>
                  <Text style={{ color: corStatus(p.status), fontWeight: 'bold', fontSize: 12 }}>{labelStatus(p.status)}</Text>
                </View>
                <Text style={styles.servico}>{p.servico}</Text>
                <Text style={styles.info}>Profissional: {p.profissional}</Text>
                <Text style={styles.info}>Data: {p.data} as {p.horario}</Text>
                <Text style={styles.valor}>{p.valor}</Text>
              </View>
            ))}
          </View>
        )}

        {aba === 'profissionais' && (
          <View>
            <Text style={styles.secao}>Profissionais cadastradas ({profissionais.length})</Text>
            {profissionais.map((p) => (
              <View key={p.id} style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.clienteNome}>{p.nome}</Text>
                  <Text style={{ color: p.status === 'ativa' ? '#00cc66' : '#ff4444', fontWeight: 'bold' }}>{p.status}</Text>
                </View>
                <Text style={styles.servico}>{p.especialidade}</Text>
                <View style={styles.row}>
                  <Text style={styles.info}>Avaliacao: {p.avaliacao}</Text>
                  <Text style={styles.info}>Atendimentos: {p.atendimentos}</Text>
                </View>
                <Text style={styles.valor}>Ganhos: {p.ganhos}</Text>
                <View style={styles.row}>
                  <TouchableOpacity style={styles.botaoVerde}>
                    <Text style={styles.botaoVerdeTexto}>Ativar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.botaoVermelho}>
                    <Text style={styles.botaoVermelhoTexto}>Suspender</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {aba === 'clientes' && (
          <View>
            <Text style={styles.secao}>Clientes cadastrados ({clientes.length})</Text>
            {clientes.map((c) => (
              <View key={c.id} style={styles.card}>
                <Text style={styles.clienteNome}>{c.nome}</Text>
                <Text style={styles.info}>{c.email}</Text>
                <View style={styles.row}>
                  <Text style={styles.info}>Pedidos: {c.pedidos}</Text>
                  <Text style={styles.info}>Ultimo: {c.ultima}</Text>
                </View>
                <Text style={styles.valor}>Total gasto: {c.gasto}</Text>
              </View>
            ))}
          </View>
        )}

        {aba === 'avaliacoes' && (
          <View>
            <Text style={styles.secao}>Avaliacoes recentes</Text>
            {avaliacoes.map((a) => (
              <View key={a.id} style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.clienteNome}>{a.cliente}</Text>
                  <Text style={styles.estrelas}>{'★'.repeat(a.nota)}{'☆'.repeat(5 - a.nota)}</Text>
                </View>
                <Text style={styles.servico}>{a.servico} - {a.profissional}</Text>
                <Text style={styles.comentario}>"{a.comentario}"</Text>
                <Text style={styles.info}>Data: {a.data}</Text>
              </View>
            ))}
          </View>
        )}

        {aba === 'financeiro' && (
          <View>
            <View style={styles.finCard}>
              <Text style={styles.finLabel}>Faturamento total</Text>
              <Text style={styles.finValor}>R$ 12.450,00</Text>
            </View>
            <View style={styles.finCard}>
              <Text style={styles.finLabel}>Comissao BellaFast (30%)</Text>
              <Text style={styles.finValor}>R$ 3.735,00</Text>
            </View>
            <View style={styles.finCard}>
              <Text style={styles.finLabel}>Repasses profissionais (70%)</Text>
              <Text style={styles.finValor}>R$ 8.715,00</Text>
            </View>
            <View style={styles.finCard}>
              <Text style={styles.finLabel}>Pedidos este mes</Text>
              <Text style={styles.finValor}>156</Text>
            </View>

            <Text style={styles.secao}>Repasses pendentes</Text>
            {profissionais.map((p) => (
              <View key={p.id} style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.clienteNome}>{p.nome}</Text>
                  <Text style={styles.valor}>{p.ganhos}</Text>
                </View>
                <Text style={styles.info}>{p.atendimentos} atendimentos</Text>
                <TouchableOpacity style={styles.botaoSalvar}>
                  <Text style={styles.botaoSalvarTexto}>Autorizar repasse</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: '#1a0a2e' },
  container: { padding: 20, paddingTop: 60 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#f0a500' },
  subtitulo: { fontSize: 14, color: '#999', marginBottom: 20 },
  abasScroll: { marginBottom: 20 },
  abaAtiva: { backgroundColor: '#f0a500', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, marginRight: 8 },
  abaInativa: { backgroundColor: '#2d1b4e', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, marginRight: 8 },
  abaTextoAtivo: { color: '#1a0a2e', fontWeight: 'bold', fontSize: 13 },
  abaTexto: { color: '#999', fontSize: 13 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  statCard: { backgroundColor: '#2d1b4e', borderRadius: 12, padding: 15, width: '47%', margin: '1.5%', alignItems: 'center' },
  statEmoji: { fontSize: 28, marginBottom: 8 },
  statNumero: { color: '#f0a500', fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#999', fontSize: 12, textAlign: 'center', marginTop: 4 },
  secao: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 12, marginTop: 5 },
  card: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 15, marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  clienteNome: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  servico: { color: '#f0a500', fontSize: 13, marginBottom: 6 },
  info: { color: '#999', fontSize: 13, marginBottom: 3 },
  valor: { color: '#ffffff', fontWeight: 'bold', fontSize: 15, marginTop: 6 },
  estrelas: { color: '#f0a500', fontSize: 16 },
  comentario: { color: '#cccccc', fontSize: 13, fontStyle: 'italic', marginVertical: 6 },
  botaoVerde: { flex: 1, borderWidth: 2, borderColor: '#00cc66', borderRadius: 8, padding: 8, alignItems: 'center', marginRight: 8, marginTop: 10 },
  botaoVerdeTexto: { color: '#00cc66', fontWeight: 'bold', fontSize: 13 },
  botaoVermelho: { flex: 1, borderWidth: 2, borderColor: '#ff4444', borderRadius: 8, padding: 8, alignItems: 'center', marginTop: 10 },
  botaoVermelhoTexto: { color: '#ff4444', fontWeight: 'bold', fontSize: 13 },
  finCard: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 20, marginBottom: 12, alignItems: 'center' },
  finLabel: { color: '#999', fontSize: 14, marginBottom: 8 },
  finValor: { color: '#f0a500', fontSize: 28, fontWeight: 'bold' },
  botaoSalvar: { backgroundColor: '#f0a500', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 10 },
  botaoSalvarTexto: { color: '#1a0a2e', fontWeight: 'bold', fontSize: 14 },
});