import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Login() {
  const router = useRouter();

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>
        <Text style={styles.logo}>BellaFast</Text>
        <Text style={styles.slogan}>Beleza no seu endereco</Text>

        <TextInput style={styles.input} placeholder="Seu email" placeholderTextColor="#999" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Sua senha" placeholderTextColor="#999" secureTextEntry={true} />

        <TouchableOpacity style={styles.botao} onPress={() => router.push('/servicos')}>
          <Text style={styles.botaoTexto}>Entrar como Cliente</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botaoProfissional} onPress={() => router.push('/profissional')}>
          <Text style={styles.botaoProfissionalTexto}>Entrar como Profissional</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botaoAdmin} onPress={() => router.push('/admin')}>
          <Text style={styles.botaoAdminTexto}>Entrar como Admin</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botaoVerde} onPress={() => router.push('/esterilizacao')}>
          <Text style={styles.botaoVerdeTexto}>Teste Esterilizacao</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botaoVermelho} onPress={() => router.push('/timer')}>
          <Text style={styles.botaoVermelhoTexto}>Teste Timer 10min</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botaoAzul} onPress={() => router.push('/acompanhamento')}>
          <Text style={styles.botaoAzulTexto}>Teste Acompanhamento</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botaoRoxo} onPress={() => router.push('/notificacoes')}>
          <Text style={styles.botaoRoxoTexto}>Teste Notificacoes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botaoRosa} onPress={() => router.push('/perfil')}>
          <Text style={styles.botaoRosaTexto}>Teste Perfil Cliente</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botaoSuporte} onPress={() => router.push('/suporte')}>
          <Text style={styles.botaoSuporteTexto}>Teste Suporte</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/cadastro')}>
          <Text style={styles.cadastro}>Nao tem conta? <Text style={styles.link}>Cadastre-se</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#1a0a2e' },
  container: { padding: 30, paddingTop: 80, paddingBottom: 60 },
  logo: { fontSize: 36, fontWeight: 'bold', color: '#f0a500', marginBottom: 5, textAlign: 'center' },
  slogan: { fontSize: 14, color: '#ffffff', marginBottom: 40, textAlign: 'center' },
  input: { width: '100%', backgroundColor: '#2d1b4e', borderRadius: 10, padding: 15, color: '#ffffff', marginBottom: 15, fontSize: 16 },
  botao: { width: '100%', backgroundColor: '#f0a500', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 10 },
  botaoTexto: { color: '#1a0a2e', fontWeight: 'bold', fontSize: 16 },
  botaoProfissional: { width: '100%', borderWidth: 2, borderColor: '#f0a500', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 12 },
  botaoProfissionalTexto: { color: '#f0a500', fontWeight: 'bold', fontSize: 16 },
  botaoAdmin: { width: '100%', borderWidth: 2, borderColor: '#aa44ff', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 12 },
  botaoAdminTexto: { color: '#aa44ff', fontWeight: 'bold', fontSize: 16 },
  botaoVerde: { width: '100%', borderWidth: 2, borderColor: '#00cc66', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 12 },
  botaoVerdeTexto: { color: '#00cc66', fontWeight: 'bold', fontSize: 16 },
  botaoVermelho: { width: '100%', borderWidth: 2, borderColor: '#ff4444', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 12 },
  botaoVermelhoTexto: { color: '#ff4444', fontWeight: 'bold', fontSize: 16 },
  botaoAzul: { width: '100%', borderWidth: 2, borderColor: '#4488ff', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 12 },
  botaoAzulTexto: { color: '#4488ff', fontWeight: 'bold', fontSize: 16 },
  botaoRoxo: { width: '100%', borderWidth: 2, borderColor: '#aa44ff', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 12 },
  botaoRoxoTexto: { color: '#aa44ff', fontWeight: 'bold', fontSize: 16 },
  botaoRosa: { width: '100%', borderWidth: 2, borderColor: '#ff88cc', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 12 },
  botaoRosaTexto: { color: '#ff88cc', fontWeight: 'bold', fontSize: 16 },
  botaoSuporte: { width: '100%', borderWidth: 2, borderColor: '#00ccff', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 12 },
  botaoSuporteTexto: { color: '#00ccff', fontWeight: 'bold', fontSize: 16 },
  cadastro: { color: '#ffffff', marginTop: 25, fontSize: 14, textAlign: 'center' },
  link: { color: '#f0a500', fontWeight: 'bold' },
});