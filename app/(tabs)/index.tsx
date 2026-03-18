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

      <TextInput style={styles.input} placeholder="Seu email" placeholderTextColor="#CBB8A6" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Sua senha" placeholderTextColor="#CBB8A6" secureTextEntry={true} value={senha} onChangeText={setSenha} />

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
  container: { flex: 1, backgroundColor: '#E8DCCF', alignItems: 'center', justifyContent: 'center', padding: 30 },
  logo: { fontSize: 36, fontWeight: 'bold', color: '#6B4F3A', marginBottom: 5 },
  slogan: { fontSize: 14, color: '#CBB8A6', marginBottom: 30 },
  tiposRow: { flexDirection: 'row', backgroundColor: '#F7F3EF', borderRadius: 12, padding: 4, marginBottom: 30, width: '100%', shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tipoAtivo: { flex: 1, backgroundColor: '#D4AF7F', borderRadius: 10, padding: 12, alignItems: 'center' },
  tipoInativo: { flex: 1, padding: 12, alignItems: 'center' },
  tipoTextoAtivo: { color: '#4A3020', fontWeight: 'bold', fontSize: 14 },
  tipoTexto: { color: '#CBB8A6', fontSize: 14 },
  input: { width: '100%', backgroundColor: '#F7F3EF', borderRadius: 10, padding: 15, color: '#6B4F3A', marginBottom: 15, fontSize: 16, shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  botao: { width: '100%', backgroundColor: '#D4AF7F', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 5 },
  botaoDesabilitado: { width: '100%', backgroundColor: '#CBB8A6', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 5 },
  botaoTexto: { color: '#4A3020', fontWeight: 'bold', fontSize: 18 },
  cadastro: { color: '#6B4F3A', marginTop: 20, fontSize: 14, textAlign: 'center' },
  link: { color: '#D4AF7F', fontWeight: 'bold' },
  ajuda: { color: '#CBB8A6', marginTop: 12, fontSize: 13 },
});