import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CODIGO = 'BF' + Math.floor(1000 + Math.random() * 9000);

export default function Esterilizacao() {
  const [etapa, setEtapa] = useState(1);
  const [fotoEnviada, setFotoEnviada] = useState(false);

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>

        <Text style={styles.titulo}>Atendimento</Text>
        <Text style={styles.subtitulo}>Manicure simples - Ana Silva</Text>

        <View style={styles.etapasRow}>
          {[1, 2, 3, 4].map((e) => (
            <View key={e} style={styles.etapaItem}>
              <View style={e <= etapa ? styles.circuloAtivo : styles.circulo}>
                <Text style={e <= etapa ? styles.numeroAtivo : styles.numero}>{e}</Text>
              </View>
              {e < 4 && <View style={e < etapa ? styles.linhaAtiva : styles.linha} />}
            </View>
          ))}
        </View>

        {etapa === 1 && (
          <View style={styles.etapaBox}>
            <Text style={styles.aviso}>⏰ Faltam 30 minutos!</Text>
            <Text style={styles.etapaTitulo}>Prepare-se para sair</Text>
            <Text style={styles.etapaDescricao}>
              Seu atendimento com Ana Silva começa em 30 minutos. Prepare seus equipamentos e confirme quando estiver a caminho!
            </Text>
            <View style={styles.infoCard}>
              <View style={styles.infoLinha}>
                <Text style={styles.infoLabel}>Cliente</Text>
                <Text style={styles.infoValor}>Ana Silva</Text>
              </View>
              <View style={styles.infoLinha}>
                <Text style={styles.infoLabel}>Servico</Text>
                <Text style={styles.infoValor}>Manicure simples</Text>
              </View>
              <View style={styles.infoLinha}>
                <Text style={styles.infoLabel}>Horario</Text>
                <Text style={styles.infoValor}>09:00</Text>
              </View>
              <View style={styles.infoLinha}>
                <Text style={styles.infoLabel}>Valor</Text>
                <Text style={styles.infoValorDestaque}>R$ 45,00</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.botao} onPress={() => setEtapa(2)}>
              <Text style={styles.botaoTexto}>Estou a caminho!</Text>
            </TouchableOpacity>
          </View>
        )}

        {etapa === 2 && (
          <View style={styles.etapaBox}>
            <Text style={styles.etapaTitulo}>A caminho da cliente</Text>
            <Text style={styles.etapaDescricao}>
              Aqui esta o endereco completo. Clique em "Cheguei" quando estiver na porta da cliente.
            </Text>
            <View style={styles.enderecoCard}>
              <Text style={styles.enderecoEmoji}>📍</Text>
              <Text style={styles.enderecoRua}>Rua das Flores, 123</Text>
              <Text style={styles.enderecoBairro}>Vila Nova - Sao Paulo, SP</Text>
              <Text style={styles.enderecoComplemento}>Apto 45 - Interfone 45</Text>
            </View>
            <View style={styles.dicaCard}>
              <Text style={styles.dicaTexto}>O endereco completo so aparece apos voce confirmar que esta a caminho!</Text>
            </View>
            <TouchableOpacity style={styles.botao} onPress={() => setEtapa(3)}>
              <Text style={styles.botaoTexto}>Cheguei na porta!</Text>
            </TouchableOpacity>
          </View>
        )}

        {etapa === 3 && (
          <View style={styles.etapaBox}>
            <Text style={styles.etapaTitulo}>Codigo de esterilizacao</Text>
            <Text style={styles.etapaDescricao}>
              Fotografe seus equipamentos esterilizados com este codigo visivel. Escreva num papel ou mostre a tela na foto.
            </Text>

            <View style={styles.codigoCard}>
              <Text style={styles.codigoLabel}>Seu codigo unico</Text>
              <Text style={styles.codigoTexto}>{CODIGO}</Text>
              <Text style={styles.codigoDica}>Este codigo e valido somente para este atendimento</Text>
            </View>

            <View style={styles.instrucoesCard}>
              <Text style={styles.instrucoesTitulo}>Como fazer:</Text>
              <Text style={styles.instrucao}>1. Coloque todos os equipamentos juntos</Text>
              <Text style={styles.instrucao}>2. Escreva o codigo num papel e coloque na frente</Text>
              <Text style={styles.instrucao}>3. O codigo deve estar legivel na foto</Text>
              <Text style={styles.instrucao}>4. Envie a foto abaixo</Text>
            </View>

            <TouchableOpacity
              style={fotoEnviada ? styles.botaoFotoOk : styles.botaoFoto}
              onPress={() => setFotoEnviada(true)}
            >
              <Text style={fotoEnviada ? styles.botaoFotoOkTexto : styles.botaoFotoTexto}>
                {fotoEnviada ? 'Foto enviada!' : 'Fotografar equipamentos'}
              </Text>
            </TouchableOpacity>

            {fotoEnviada && (
              <TouchableOpacity style={styles.botaoVerde} onPress={() => setEtapa(4)}>
                <Text style={styles.botaoVerdeTexto}>Iniciar atendimento!</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {etapa === 4 && (
          <View style={styles.etapaBox}>
            <Text style={styles.sucessoEmoji}>✅</Text>
            <Text style={styles.etapaTitulo}>Atendimento em andamento!</Text>
            <Text style={styles.etapaDescricao}>
              Tudo verificado! Faca um otimo atendimento. Clique em finalizar quando terminar.
            </Text>
            <View style={styles.infoCard}>
              <View style={styles.infoLinha}>
                <Text style={styles.infoLabel}>Cliente</Text>
                <Text style={styles.infoValor}>Ana Silva</Text>
              </View>
              <View style={styles.infoLinha}>
                <Text style={styles.infoLabel}>Codigo verificado</Text>
                <Text style={styles.codigoVerificado}>{CODIGO}</Text>
              </View>
              <View style={styles.infoLinha}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={styles.statusAtivo}>Em andamento</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.botaoFinalizar}>
              <Text style={styles.botaoFinalizarTexto}>Finalizar atendimento</Text>
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
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#f0a500', marginBottom: 4 },
  subtitulo: { fontSize: 14, color: '#999', marginBottom: 25 },
  etapasRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  etapaItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  circulo: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#555', alignItems: 'center', justifyContent: 'center' },
  circuloAtivo: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0a500', alignItems: 'center', justifyContent: 'center' },
  numero: { color: '#555', fontWeight: 'bold' },
  numeroAtivo: { color: '#1a0a2e', fontWeight: 'bold' },
  linha: { flex: 1, height: 2, backgroundColor: '#555' },
  linhaAtiva: { flex: 1, height: 2, backgroundColor: '#f0a500' },
  etapaBox: { alignItems: 'center' },
  aviso: { backgroundColor: '#f0a50022', borderWidth: 1, borderColor: '#f0a500', borderRadius: 10, padding: 12, color: '#f0a500', fontWeight: 'bold', fontSize: 16, marginBottom: 15, textAlign: 'center', width: '100%' },
  etapaTitulo: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 10, textAlign: 'center' },
  etapaDescricao: { fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  infoCard: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 20, width: '100%', marginBottom: 20 },
  infoLinha: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoLabel: { color: '#999', fontSize: 14 },
  infoValor: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  infoValorDestaque: { color: '#f0a500', fontSize: 16, fontWeight: 'bold' },
  enderecoCard: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 25, width: '100%', alignItems: 'center', marginBottom: 15 },
  enderecoEmoji: { fontSize: 40, marginBottom: 10 },
  enderecoRua: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  enderecoBairro: { color: '#999', fontSize: 14, textAlign: 'center', marginTop: 5 },
  enderecoComplemento: { color: '#f0a500', fontSize: 14, textAlign: 'center', marginTop: 5, fontWeight: 'bold' },
  dicaCard: { backgroundColor: '#f0a50011', borderRadius: 10, padding: 12, width: '100%', marginBottom: 20, borderWidth: 1, borderColor: '#f0a50044' },
  dicaTexto: { color: '#f0a500', fontSize: 13, textAlign: 'center' },
  codigoCard: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 25, width: '100%', alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#f0a500' },
  codigoLabel: { color: '#999', fontSize: 13, marginBottom: 10 },
  codigoTexto: { color: '#f0a500', fontSize: 42, fontWeight: 'bold', letterSpacing: 5 },
  codigoDica: { color: '#999', fontSize: 12, textAlign: 'center', marginTop: 10 },
  instrucoesCard: { backgroundColor: '#2d1b4e', borderRadius: 15, padding: 20, width: '100%', marginBottom: 20 },
  instrucoesTitulo: { color: '#ffffff', fontSize: 15, fontWeight: 'bold', marginBottom: 12 },
  instrucao: { color: '#999', fontSize: 13, marginBottom: 8, lineHeight: 20 },
  botao: { width: '100%', backgroundColor: '#f0a500', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 5 },
  botaoTexto: { color: '#1a0a2e', fontWeight: 'bold', fontSize: 16 },
  botaoFoto: { width: '100%', borderWidth: 2, borderColor: '#f0a500', borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 15 },
  botaoFotoTexto: { color: '#f0a500', fontWeight: 'bold', fontSize: 16 },
  botaoFotoOk: { width: '100%', borderWidth: 2, borderColor: '#00cc66', borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 15, backgroundColor: '#00cc6622' },
  botaoFotoOkTexto: { color: '#00cc66', fontWeight: 'bold', fontSize: 16 },
  botaoVerde: { width: '100%', backgroundColor: '#00cc66', borderRadius: 10, padding: 15, alignItems: 'center' },
  botaoVerdeTexto: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  sucessoEmoji: { fontSize: 70, marginBottom: 15 },
  codigoVerificado: { color: '#00cc66', fontSize: 18, fontWeight: 'bold', letterSpacing: 3 },
  statusAtivo: { color: '#00cc66', fontWeight: 'bold', fontSize: 14 },
  botaoFinalizar: { width: '100%', backgroundColor: '#00cc66', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 10 },
  botaoFinalizarTexto: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
});