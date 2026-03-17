import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Perfil() {
  const router = useRouter();
  const [aba, setAba] = useState('perfil');

  const enderecos = [
    { id: 1, nome: 'Casa', endereco: 'Rua das Flores, 123 - Apto 45', bairro: 'Vila Nova', principal: true },
    { id: 2, nome: 'Trabalho', endereco: 'Av. Paulista, 1000 - Sala 5', bairro: 'Bela Vista', principal: false },
  ];

  const historico = [
    { id: 1, servico: 'Manicure simples', profissional: 'Jessica Oliveira', data: '10/03', valor: 'R$ 45,00', nota: 5 },
    { id: 2, servico: 'Escova', profissional: 'Camila Santos', data: '05/03', valor: 'R$ 60,00', nota: 5 },
    { id: 3, servico: 'Limpeza de pele', profissional: 'Fernanda Lima', data: '28/02', valor: 'R$ 90,00', nota: 4 },
    { id: 4, servico: 'Massagem relaxante', profissional: 'Fernanda Lima', data: '15/02', valor: 'R$ 120,00', nota: 5 },
  ];

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>

        <View style={styles.abas}>
          <TouchableOpacity style={aba === 'perfil' ? styles.abaAtiva : styles.abaInativa} onPress={() => setAba('perfil')}>
            <Text style={aba === 'perfil' ? styles.abaTextoAtivo : styles.abaTexto}>Perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={aba === 'enderecos' ? styles.abaAtiva : styles.abaInativa} onPress={() => setAba('enderecos')}>
            <Text style={aba === 'enderecos' ? styles.abaTextoAtivo : styles.abaTexto}>Enderecos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={aba === 'historico' ? styles.abaAtiva : styles.abaInativa} onPress={() => setAba('historico')}>
            <Text style={aba === 'historico' ? styles.abaTextoAtivo : styles.abaTexto}>Historico</Text>
          </TouchableOpacity>
        </View>

        {aba === 'perfil' && (
          <View style={styles.perfilContainer}>
            <View style={styles.foto}>
              <Text style={styles.fotoTexto}>L</Text>
            </View>
            <Text style={styles.nome}>Leticia Santiago</Text>
            <Text style={styles.email}>leticia@email.com</Text>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumero}>12</Text>
                <Text style={styles.statLabel}>Pedidos</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumero}>R$ 680</Text>
                <Text style={styles.statLabel}>Total gasto</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumero}>4.9</Text>
                <Text style={styles.statLabel}>Avaliacao</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitulo}>Meus dados</Text>
              <View style={styles.infoLinha}>
                <Text style={styles.infoLabel}>Nome</Text>
                <Text style={styles.infoValor}>Leticia Santiago</Text>
              </View>
              <View style={styles.infoLinha}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValor}>leticia@email.com</Text>
              </View>
              <View style={styles.infoLinha}>
                <Text style={styles.infoLabel}>Telefone</Text>
                <Text style={styles.infoValor}>(11) 99999-9999</Text>
              </View>
              <View style={styles.infoLinha}>
                <Text style={styles.infoLabel}>CPF</Text>
                <Text style={styles.infoValor}>***.***.***-**</Text>
              </View>
              <View style={styles.infoLinha}>
                <Text style={styles.infoLabel}>Membro desde</Text>
                <Text style={styles.infoValor}>Janeiro 2026</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.botaoEditar}>
              <Text style={styles.botaoEditarTexto}>Editar dados</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botaoSair}>
              <Text style={styles.botaoSairTexto}>Sair da conta</Text>
            </TouchableOpacity>
          </View>
        )}

        {aba === 'enderecos' && (
          <View>
            <Text style={styles.secao}>Meus enderecos</Text>
            {enderecos.map((e) => (
              <View key={e.id} style={styles.enderecoCard}>
                <View style={styles.row}>
                  <Text style={styles.enderecoNome}>{e.nome}</Text>
                  {e.principal && <Text style={styles.principal}>Principal</Text>}
                </View>
                <Text style={styles.enderecoTexto}>{e.endereco}</Text>
                <Text style={styles.enderecoBairro}>{e.bairro}</Text>
                <View style={styles.row}>
                  <TouchableOpacity style={styles.botaoEnderecoEditar}>
                    <Text style={styles.botaoEnderecoEditarTexto}>Editar</Text>
                  </TouchableOpacity>
                  {!e.principal && (
                    <TouchableOpacity style={styles.botaoEnderecoPrincipal}>
                      <Text style={styles.botaoEnderecoPrincipalTexto}>Tornar principal</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.botaoNovoEndereco}>
              <Text style={styles.botaoNovoEnderecoTexto}>+ Adicionar endereco</Text>
            </TouchableOpacity>
          </View>
        )}

        {aba === 'historico' && (
          <View>
            <Text style={styles.secao}>Meus atendimentos</Text>
            {historico.map((h) => (
              <View key={h.id} style={styles.historicoCard}>
                <View style={styles.row}>
                  <Text style={styles.historicoServico}>{h.servico}</Text>
                  <Text style={styles.historicoValor}>{h.valor}</Text>
                </View>
                <Text style={styles.historicoProfissional}>{h.profissional}</Text>
                <View style={styles.row}>
                  <Text style={styles.historicoData}>{h.data}</Text>
                  <Text style={styles.historicoNota}>{'★'.repeat(h.nota)}</Text>
                </View>
                <TouchableOpacity style={styles.botaoRepetr}>
                  <Text style={styles.botaoRepetirTexto}>Repetir servico</Text>
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
  abas: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#2d1b4e', borderRadius: 10, padding: 4 },
  abaAtiva: { flex: 1, backgroundColor: '#f0a500', borderRadius: 8, padding: 10, alignItems: 'center' },
  abaInativa: { flex: 1, padding: 10, alignItems: 'center' },
  abaTextoAtivo: { color: '#1a0a2e', fontWeight: 'bold', fontSize: 13 },
  abaTexto: { color: '#999', fontSize: 13 },
  perfilContainer: { alignItems: 'center' },
  foto: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0a500', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  fotoTexto: { fontSize: 40, fontWeight: 'bold', color: '#1a0a2e' },
  nome: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', marginBottom: 5 },
  email: { fontSize: 14, color: '#999', marginBottom: 20 },
  statsRow: { flexDirection: 'row', width: '100%', marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#2d1b4e', borderRadius: 12, padding: 15, alignItems: 'center', marginHorizontal: 4 },
  statNumero: { color: '#f0a500', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: '#999', fontSize: 12, marginTop: 4 },
  infoCard: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 20, width: '100%', marginBottom: 15 },
  infoTitulo: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  infoLinha: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoLabel: { color: '#999', fontSize: 14 },
  infoValor: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  botaoEditar: { width: '100%', borderWidth: 2, borderColor: '#f0a500', borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 12 },
  botaoEditarTexto: { color: '#f0a500', fontWeight: 'bold', fontSize: 16 },
  botaoSair: { width: '100%', borderWidth: 2, borderColor: '#ff4444', borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 30 },
  botaoSairTexto: { color: '#ff4444', fontWeight: 'bold', fontSize: 16 },
  secao: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 15 },
  enderecoCard: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 15, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  enderecoNome: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  principal: { color: '#00cc66', fontWeight: 'bold', fontSize: 13 },
  enderecoTexto: { color: '#999', fontSize: 14, marginBottom: 3 },
  enderecoBairro: { color: '#666', fontSize: 13, marginBottom: 10 },
  botaoEnderecoEditar: { borderWidth: 1, borderColor: '#f0a500', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  botaoEnderecoEditarTexto: { color: '#f0a500', fontSize: 13 },
  botaoEnderecoPrincipal: { borderWidth: 1, borderColor: '#00cc66', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  botaoEnderecoPrincipalTexto: { color: '#00cc66', fontSize: 13 },
  botaoNovoEndereco: { borderWidth: 2, borderColor: '#f0a500', borderRadius: 10, padding: 15, alignItems: 'center', borderStyle: 'dashed', marginTop: 5 },
  botaoNovoEnderecoTexto: { color: '#f0a500', fontWeight: 'bold', fontSize: 15 },
  historicoCard: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 15, marginBottom: 12 },
  historicoServico: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  historicoValor: { color: '#f0a500', fontWeight: 'bold', fontSize: 15 },
  historicoProfissional: { color: '#999', fontSize: 13, marginBottom: 5 },
  historicoData: { color: '#666', fontSize: 13 },
  historicoNota: { color: '#f0a500', fontSize: 14 },
  botaoRepetr: { borderWidth: 1, borderColor: '#f0a500', borderRadius: 8, padding: 8, alignItems: 'center', marginTop: 10 },
  botaoRepetirTexto: { color: '#f0a500', fontSize: 13, fontWeight: 'bold' },
});