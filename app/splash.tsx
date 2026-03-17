import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

export default function Splash() {
  const router = useRouter();
  const opacidade = useRef(new Animated.Value(0)).current;
  const escala = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacidade, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(escala, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace('/');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: opacidade, transform: [{ scale: escala }] }]}>
        <Text style={styles.emoji}>💅</Text>
        <Text style={styles.nome}>BellaFast</Text>
        <Text style={styles.slogan}>Beleza no seu endereco</Text>
      </Animated.View>
      <Animated.Text style={[styles.versao, { opacity: opacidade }]}>v1.0</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e', alignItems: 'center', justifyContent: 'center' },
  logoContainer: { alignItems: 'center' },
  emoji: { fontSize: 80, marginBottom: 15 },
  nome: { fontSize: 48, fontWeight: 'bold', color: '#f0a500', marginBottom: 10 },
  slogan: { fontSize: 16, color: '#ffffff', opacity: 0.8 },
  versao: { position: 'absolute', bottom: 40, color: '#666', fontSize: 13 },
});