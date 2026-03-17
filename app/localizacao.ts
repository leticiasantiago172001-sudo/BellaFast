import * as Location from 'expo-location';

export async function pedirPermissaoLocalizacao() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }
  return true;
}

export async function pegarLocalizacaoAtual() {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      await Location.requestForegroundPermissionsAsync();
    }
    const localizacao = await Location.getCurrentPositionAsync({});
    return {
      latitude: localizacao.coords.latitude,
      longitude: localizacao.coords.longitude,
    };
  } catch (e) {
    console.log('Erro ao pegar localizacao:', e);
    return null;
  }
}

export function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatarDistancia(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}