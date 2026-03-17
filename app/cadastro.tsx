import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Cadastro() {
  const router = useRouter();

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>
        <Text style={styles.logo}>BellaFast</Text>
        <Text style={styles.titulo}>Criar conta</Text>

        <TextInput
          style={styles.input}
          placeholder="Seu nome completo"
          placeholderTextColor="#999"
        />

        <TextInput
          style={styles.input}
          placeholder="Seu CPF"
          placeholderTextColor="#999"
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="Seu email"
          placeholderTextColor="#999"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Seu telefone"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
        />

        <TextInput
          style={styles.input}
          placeholder="Crie uma senha"
          placeholderTextColor="#999"
          secureTextEntry={true}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirme sua senha"
          placeholderTextColor="#999"
          secureTextEntry={true}
        />

        <TouchableOpacity style={styles.botao}>
          <Text style={styles.botaoTexto}>Criar minha conta</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.login}>Ja tem conta? Entrar</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: '#1a0a2e',
  },
  container: {
    alignItems: 'center',
    padding: 30,
    paddingTop: 60,
  },
  logo: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#f0a500',
    marginBottom: 5,
  },
  titulo: {
    fontSize: 22,
    color: '#ffffff',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    backgroundColor: '#2d1b4e',
    borderRadius: 10,
    padding: 15,
    color: '#ffffff',
    marginBottom: 15,
    fontSize: 16,
  },
  botao: {
    width: '100%',
    backgroundColor: '#f0a500',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  botaoTexto: {
    color: '#1a0a2e',
    fontWeight: 'bold',
    fontSize: 16,
  },
  login: {
    color: '#f0a500',
    marginTop: 20,
    fontSize: 14,
    fontWeight: 'bold',
  },
});