import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../config-supabase';

export default function Cadastro() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function cadastrar() {
    if (!nome || !email || !senha || !cpf || !telefone) {
      Alert.alert('Erro', 'Preencha todos os campos!');
      return;
    }
    if (senha !== confirmaSenha) {
      Alert.alert('Erro', 'As senhas nao coincidem!');
      return;
    }
    setCarregando(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password: senha });
      if (error) {
        Alert.alert('Erro', error.message);
        return;
      }
      await supabase.from('usuarios').insert({ nome, email, telefone, cpf, tipo: 'cliente' });
      Alert.alert('Sucesso!', 'Conta criada! Bem-vinda ao BellaFast!', [
        { text: 'OK', onPress: () => router.push('/servicos') }
      ]);
    } catch (e) {
      Alert.alert('Erro', 'Algo deu errado. Tente novamente!');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>
        <Text style={styles.logo}>BellaFast</Text>
        <Text style={styles.titulo}>Criar conta</Text>
        <TextInput style={styles.input} placeholder="Seu nome completo" placeholderTextColor="#999" value={nome} onChangeText={setNome} />
        <TextInput style={styles.input} placeholder="Seu CPF" placeholderTextColor="#999" keyboardType="numeric" value={cpf} onChangeText={setCpf} />
        <TextInput style={styles.input} placeholder="Seu email" placeholderTextColor="#999" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Seu telefone" placeholderTextColor="#999" keyboardType="phone-pad" value={telefone} onChangeText={setTelefone} />
        <TextInput style={styles.input} placeholder="Crie uma senha" placeholderTextColor="#999" secureTextEntry={true} value={senha} onChangeText={setSenha} />
        <TextInput style={styles.input} placeholder="Confirme sua senha" placeholderTextColor="#999" secureTextEntry={true} value={confirmaSenha} onChangeText={setConfirmaSenha} />
        <TouchableOpacity style={carregando ? styles.botaoDesabilitado : styles.botao} onPress={cadastrar} disabled={carregando}>
          <Text style={styles.botaoTexto}>{carregando ? 'Criando conta...' : 'Criar minha conta'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.login}>Ja tem conta? <Text style={styles.link}>Entrar</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: '#1a0a2e' },
  container: { alignItems: 'center', padding: 30, paddingTop: 60 },
  logo: { fontSize: 30, fontWeight: 'bold', color: '#f0a500', marginBottom: 5 },
  titulo: { fontSize: 22, color: '#ffffff', marginBottom: 30 },
  input: { width: '100%', backgroundColor: '#2d1b4e', borderRadius: 10, padding: 15, color: '#ffffff', marginBottom: 15, fontSize: 16 },
  botao: { width: '100%', backgroundColor: '#f0a500', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 10 },
  botaoDesabilitado: { width: '100%', backgroundColor: '#555', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 10 },
  botaoTexto: { color: '#1a0a2e', fontWeight: 'bold', fontSize: 16 },
  login: { color: '#ffffff', marginTop: 20, fontSize: 14 },
  link: { color: '#f0a500', fontWeight: 'bold' },
});