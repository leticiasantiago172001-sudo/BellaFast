const GOOGLE_MAPS_KEY = 'SUAAIzaSyCUBtNmCPhjycgoLd88GtGL6eSLdJ-d6-E';

export async function enderecoParaCoordenadas(endereco: string) {
  try {
    const enderecoFormatado = encodeURIComponent(endereco + ', Brasil');
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${enderecoFormatado}&key=${GOOGLE_MAPS_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { latitude: lat, longitude: lng };
    }
    return null;
  } catch (e) {
    console.log('Erro geocoding:', e);
    return null;
  }
}

export function calcularDistanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}