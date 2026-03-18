import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Login() {
  const router = useRouter();

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>
        <Text style={styles.logo}>BellaFast</Text>
        <Text style={styles.slogan}>Beleza no seu endereco</Text>

        <TextInput style={styles.input} placeholder="Seu email" placeholderTextColor="#CBB8A6" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Sua senha" placeholderTextColor="#CBB8A6" secureTextEntry={true} />

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
  scroll: { flex: 1, backgroundColor: '#E8DCCF' },
  container: { padding: 30, paddingTop: 80, paddingBottom: 60 },
  logo: { fontSize: 36, fontWeight: 'bold', color: '#6B4F3A', marginBottom: 5, textAlign: 'center' },
  slogan: { fontSize: 14, color: '#CBB8A6', marginBottom: 40, textAlign: 'center' },
  input: { width: '100%', backgroundColor: '#F7F3EF', borderRadius: 10, padding: 15, color: '#6B4F3A', marginBottom: 15, fontSize: 16 },
  botao: { width: '100%', backgroundColor: '#D4AF7F', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 10 },
  botaoTexto: { color: '#4A3020', fontWeight: 'bold', fontSize: 16 },
  botaoProfissional: { width: '100%', borderWidth: 2, borderColor: '#D4AF7F', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 12 },
  botaoProfissionalTexto: { color: '#D4AF7F', fontWeight: 'bold', fontSize: 16 },
  botaoAdmin: { width: '100%', borderWidth: 2, borderColor: '#6B4F3A', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 12 },
  botaoAdminTexto: { color: '#6B4F3A', fontWeight: 'bold', fontSize: 16 },
  botaoVerde: { width: '100%', borderWidth: 2, borderColor: '#7BAE7F', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 12 },
  botaoVerdeTexto: { color: '#7BAE7F', fontWeight: 'bold', fontSize: 16 },
  botaoVermelho: { width: '100%', borderWidth: 2, borderColor: '#C0392B', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 12 },
  botaoVermelhoTexto: { color: '#C0392B', fontWeight: 'bold', fontSize: 16 },
  botaoAzul: { width: '100%', borderWidth: 2, borderColor: '#7B9BB5', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 12 },
  botaoAzulTexto: { color: '#7B9BB5', fontWeight: 'bold', fontSize: 16 },
  botaoRoxo: { width: '100%', borderWidth: 2, borderColor: '#B5651D', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 12 },
  botaoRoxoTexto: { color: '#B5651D', fontWeight: 'bold', fontSize: 16 },
  botaoRosa: { width: '100%', borderWidth: 2, borderColor: '#CBB8A6', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 12 },
  botaoRosaTexto: { color: '#CBB8A6', fontWeight: 'bold', fontSize: 16 },
  botaoSuporte: { width: '100%', borderWidth: 2, borderColor: '#D9CEC5', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 12 },
  botaoSuporteTexto: { color: '#6B4F3A', fontWeight: 'bold', fontSize: 16 },
  cadastro: { color: '#6B4F3A', marginTop: 25, fontSize: 14, textAlign: 'center' },
  link: { color: '#D4AF7F', fontWeight: 'bold' },
});