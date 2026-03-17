import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { enderecoParaCoordenadas } from '../config-maps';
import { supabase } from '../config-supabase';

export default function CadastroProfissional() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [especialidades, setEspecialidades] = useState('');
  const [raio, setRaio] = useState('10');
  const [carregando, setCarregando] = useState(false);

  async function cadastrar() {
    if (!nome || !email || !senha || !telefone || !endereco || !especialidades) {
      Alert.alert('Erro', 'Preencha todos os campos!');
      return;
    }

    setCarregando(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password: senha });
      if (error) {
        Alert.alert('Erro', error.message);
        return;
      }

      const coords = await enderecoParaCoordenadas(endereco);

      await supabase.from('usuarios').insert({
        nome,
        email,
        telefone,
        tipo: 'profissional',
      });

      await supabase.from('profissionais').insert({
        especialidades,
        endereco,
        cidade: endereco,
        raio_atendimento: parseInt(raio),
        avaliacao: 5.0,
        total_atendimentos: 0,
        status: 'ativo',
        latitude: coords ? coords.latitude : null,
        longitude: coords ? coords.longitude : null,
        endereco_completo: endereco,
      });

      Alert.alert('Sucesso!', 'Cadastro realizado! Bem-vinda ao BellaFast!', [
        { text: 'OK', onPress: () => router.push('/profissional') }
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
        <Text style={styles.titulo}>Cadastro Profissional</Text>

        <TextInput style={styles.input} placeholder="Seu nome completo" placeholderTextColor="#999" value={nome} onChangeText={setNome} />
        <TextInput style={styles.input} placeholder="Seu email" placeholderTextColor="#999" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Crie uma senha" placeholderTextColor="#999" secureTextEntry={true} value={senha} onChangeText={setSenha} />
        <TextInput style={styles.input} placeholder="Seu telefone" placeholderTextColor="#999" keyboardType="phone-pad" value={telefone} onChangeText={setTelefone} />

        <Text style={styles.label}>Endereco da sua casa</Text>
        <Text style={styles.dica}>Este endereco sera usado para calcular distancia ate as clientes</Text>
        <TextInput style={styles.input} placeholder="Rua, numero, bairro, cidade" placeholderTextColor="#999" value={endereco} onChangeText={setEndereco} />

        <Text style={styles.label}>Suas especialidades</Text>
        <TextInput style={styles.input} placeholder="Ex: Manicure, Pedicure, Depilacao" placeholderTextColor="#999" value={especialidades} onChangeText={setEspecialidades} />

        <Text style={styles.label}>Raio de atendimento (km)</Text>
        <TextInput style={styles.input} placeholder="10" placeholderTextColor="#999" keyboardType="numeric" value={raio} onChangeText={setRaio} />

        <TouchableOpacity style={carregando ? styles.botaoDesabilitado : styles.botao} onPress={cadastrar} disabled={carregando}>
          <Text style={styles.botaoTexto}>{carregando ? 'Cadastrando...' : 'Criar conta profissional'}</Text>
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
  titulo: { fontSize: 20, color: '#ffffff', marginBottom: 30 },
  label: { width: '100%', fontSize: 14, color: '#ffffff', fontWeight: 'bold', marginBottom: 5 },
  dica: { width: '100%', fontSize: 12, color: '#999', marginBottom: 10 },
  input: { width: '100%', backgroundColor: '#2d1b4e', borderRadius: 10, padding: 15, color: '#ffffff', marginBottom: 15, fontSize: 16 },
  botao: { width: '100%', backgroundColor: '#f0a500', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 10 },
  botaoDesabilitado: { width: '100%', backgroundColor: '#555', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 10 },
  botaoTexto: { color: '#1a0a2e', fontWeight: 'bold', fontSize: 16 },
  login: { color: '#ffffff', marginTop: 20, fontSize: 14 },
  link: { color: '#f0a500', fontWeight: 'bold' },
});