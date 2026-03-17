import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../config-supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registrarNotificacoes() {
  if (!Device.isDevice) {
    console.log('Notificacoes so funcionam em dispositivo real');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permissao negada para notificacoes');
    return null;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return 'token-local';
}

export async function salvarTokenUsuario(token: string) {
  try {
    const { data: usuario } = await supabase.auth.getUser();
    if (usuario?.user) {
      await supabase
        .from('usuarios')
        .update({ push_token: token })
        .eq('email', usuario.user.email);
    }
  } catch (e) {
    console.log('Erro ao salvar token:', e);
  }
}

export async function enviarNotificacaoLocal(titulo: string, mensagem: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: mensagem,
      sound: true,
    },
    trigger: null,
  });
}

export async function agendarNotificacao30min(horario: string) {
  const [horas, minutos] = horario.split(':').map(Number);
  const agora = new Date();
  const atendimento = new Date();
  atendimento.setHours(horas, minutos, 0, 0);
  const trintaMinutesAntes = new Date(atendimento.getTime() - 30 * 60 * 1000);

  if (trintaMinutesAntes > agora) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Faltam 30 minutos!',
        body: 'Seu atendimento comeca em 30 minutos. Prepare-se!',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trintaMinutesAntes,
      },
    });
  }
}