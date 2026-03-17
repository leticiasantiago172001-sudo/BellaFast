import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../config-supabase';

export default function Login() {
  const router = useRouter();
  const [tipo, setTipo] = useState('cliente');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    if (!email || !senha) {
      Alert.alert('Erro', 'Preencha email e senha!');
      return;
    }
    setCarregando(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) {
        Alert.alert('Erro', 'Email ou senha incorretos!');
        return;
      }
      if (tipo === 'cliente') router.push('/servicos');
      if (tipo === 'profissional') router.push('/profissional');
      if (tipo === 'admin') router.push('/admin');
    } catch (e) {
      Alert.alert('Erro', 'Algo deu errado!');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>BellaFast</Text>
      <Text style={styles.slogan}>Beleza no seu endereco</Text>

      <View style={styles.tiposRow}>
        <TouchableOpacity style={tipo === 'cliente' ? styles.tipoAtivo : styles.tipoInativo} onPress={() => setTipo('cliente')}>
          <Text style={tipo === 'cliente' ? styles.tipoTextoAtivo : styles.tipoTexto}>Cliente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={tipo === 'profissional' ? styles.tipoAtivo : styles.tipoInativo} onPress={() => setTipo('profissional')}>
          <Text style={tipo === 'profissional' ? styles.tipoTextoAtivo : styles.tipoTexto}>Profissional</Text>
        </TouchableOpacity>
        <TouchableOpacity style={tipo === 'admin' ? styles.tipoAtivo : styles.tipoInativo} onPress={() => setTipo('admin')}>
          <Text style={tipo === 'admin' ? styles.tipoTextoAtivo : styles.tipoTexto}>Admin</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={styles.input} placeholder="Seu email" placeholderTextColor="#999" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Sua senha" placeholderTextColor="#999" secureTextEntry={true} value={senha} onChangeText={setSenha} />

      <TouchableOpacity style={carregando ? styles.botaoDesabilitado : styles.botao} onPress={entrar} disabled={carregando}>
        <Text style={styles.botaoTexto}>{carregando ? 'Entrando...' : 'Entrar'}</Text>
      </TouchableOpacity>

      {tipo === 'cliente' && (
        <TouchableOpacity onPress={() => router.push('/cadastro')}>
          <Text style={styles.cadastro}>Nao tem conta? <Text style={styles.link}>Cadastre-se</Text></Text>
        </TouchableOpacity>
      )}

      {tipo === 'profissional' && (
        <TouchableOpacity onPress={() => router.push('/cadastro-profissional')}>
          <Text style={styles.cadastro}>Quer trabalhar conosco? <Text style={styles.link}>Cadastre-se como profissional</Text></Text>
        </TouchableOpacity>
      )}

      {tipo === 'cliente' && (
        <TouchableOpacity onPress={() => router.push('/suporte')}>
          <Text style={styles.ajuda}>Precisa de ajuda?</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e', alignItems: 'center', justifyContent: 'center', padding: 30 },
  logo: { fontSize: 36, fontWeight: 'bold', color: '#f0a500', marginBottom: 5 },
  slogan: { fontSize: 14, color: '#ffffff', marginBottom: 30 },
  tiposRow: { flexDirection: 'row', backgroundColor: '#2d1b4e', borderRadius: 12, padding: 4, marginBottom: 30, width: '100%' },
  tipoAtivo: { flex: 1, backgroundColor: '#f0a500', borderRadius: 10, padding: 12, alignItems: 'center' },
  tipoInativo: { flex: 1, padding: 12, alignItems: 'center' },
  tipoTextoAtivo: { color: '#1a0a2e', fontWeight: 'bold', fontSize: 14 },
  tipoTexto: { color: '#999', fontSize: 14 },
  input: { width: '100%', backgroundColor: '#2d1b4e', borderRadius: 10, padding: 15, color: '#ffffff', marginBottom: 15, fontSize: 16 },
  botao: { width: '100%', backgroundColor: '#f0a500', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 5 },
  botaoDesabilitado: { width: '100%', backgroundColor: '#555', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 5 },
  botaoTexto: { color: '#1a0a2e', fontWeight: 'bold', fontSize: 18 },
  cadastro: { color: '#ffffff', marginTop: 20, fontSize: 14, textAlign: 'center' },
  link: { color: '#f0a500', fontWeight: 'bold' },
  ajuda: { color: '#999', marginTop: 12, fontSize: 13 },
});