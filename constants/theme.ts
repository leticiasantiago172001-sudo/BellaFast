/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// BellaFast — Paleta Oficial
export const Colors = {
  bege: '#E8DCCF',         // Cor principal — fundo geral
  offWhite: '#F7F3EF',     // Cor neutra — cards e inputs
  marrom: '#6B4F3A',       // Cor secundária — texto principal
  dourado: '#D4AF7F',      // Cor de destaque — accent, botões
  begeEscuro: '#CBB8A6',   // Cor de apoio — texto secundário
  marromEscuro: '#4A3020', // Texto sobre botões dourados
  sucesso: '#7BAE7F',      // Verde suave
  erro: '#C0392B',         // Vermelho escuro
  taxa: '#B5651D',         // Laranja escuro (taxas/urgência)
  distancia: '#7B9BB5',    // Azul suave (distância/tempo)
  separador: '#D9CEC5',    // Bordas e separadores

  // Aliases para compatibilidade com hooks existentes
  light: {
    text: '#6B4F3A',
    background: '#E8DCCF',
    tint: '#D4AF7F',
    icon: '#CBB8A6',
    tabIconDefault: '#CBB8A6',
    tabIconSelected: '#D4AF7F',
  },
  dark: {
    text: '#6B4F3A',
    background: '#E8DCCF',
    tint: '#D4AF7F',
    icon: '#CBB8A6',
    tabIconDefault: '#CBB8A6',
    tabIconSelected: '#D4AF7F',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
