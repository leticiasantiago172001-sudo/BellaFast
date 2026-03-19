import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../config-supabase';

export default function RankingInfluencers() {
  const router = useRouter();
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const { data } = await supabase
      .from('influencers')
      .select('*, usuarios(nome, foto_url)')
      .order('indicacoes_mes', { ascending: false });
    setInfluencers(data || []);
    setCarregando(false);
  }

  const medalhas = ['🥇', '🥈', '🥉'];

  if (carregando) {
    return (
      <View style={{ flex: 1, backgroundColor: '#E8DCCF', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#6B4F3A' }}>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>

        <TouchableOpacity onPress={() => router.back()} style={styles.voltar}>
          <Text style={styles.voltarTexto}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>🏆 Ranking Influencers</Text>
        <Text style={styles.subtitulo}>Indicacoes este mes</Text>

        {influencers.length === 0 && (
          <View style={styles.vazioCard}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>🌟</Text>
            <Text style={styles.vazioTexto}>Nenhuma influencer ainda</Text>
            <Text style={styles.vazioSub}>Seja a primeira a indicar amigos!</Text>
          </View>
        )}

        {influencers.map((inf, i) => (
          <View key={inf.id} style={[styles.card, i === 0 && styles.cardPrimeiro]}>
            <Text style={styles.medalha}>{medalhas[i] || `#${i + 1}`}</Text>
            {inf.usuarios?.foto_url ? (
              <Image source={{ uri: inf.usuarios.foto_url }} style={styles.foto} />
            ) : (
              <View style={styles.fotoPlaceholder}>
                <Text style={{ fontSize: 24 }}>👩</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.nome}>{inf.usuarios?.nome || 'Influencer'}</Text>
              <Text style={styles.cupom}>Cupom: {inf.cupom}</Text>
            </View>
            <View style={styles.indicacoesBox}>
              <Text style={styles.indicacoesNum}>{inf.indicacoes_mes}</Text>
              <Text style={styles.indicacoesLabel}>indicacoes</Text>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: '#E8DCCF' },
  container: { padding: 20, paddingTop: 60 },
  voltar: { marginBottom: 15 },
  voltarTexto: { color: '#D4AF7F', fontSize: 16, fontWeight: 'bold' },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#6B4F3A', marginBottom: 4 },
  subtitulo: { fontSize: 13, color: '#CBB8A6', marginBottom: 24 },
  card: { backgroundColor: '#F7F3EF', borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#6B4F3A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  cardPrimeiro: { borderWidth: 2, borderColor: '#D4AF7F' },
  medalha: { fontSize: 26, marginRight: 12, width: 34, textAlign: 'center' },
  foto: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  fotoPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E8DCCF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  nome: { fontSize: 15, fontWeight: 'bold', color: '#6B4F3A', marginBottom: 3 },
  cupom: { fontSize: 12, color: '#CBB8A6' },
  indicacoesBox: { alignItems: 'center' },
  indicacoesNum: { fontSize: 26, fontWeight: 'bold', color: '#D4AF7F' },
  indicacoesLabel: { fontSize: 10, color: '#CBB8A6' },
  vazioCard: { backgroundColor: '#F7F3EF', borderRadius: 16, padding: 40, alignItems: 'center', marginTop: 20 },
  vazioTexto: { fontSize: 16, fontWeight: 'bold', color: '#6B4F3A', marginBottom: 6 },
  vazioSub: { fontSize: 13, color: '#CBB8A6' },
});
