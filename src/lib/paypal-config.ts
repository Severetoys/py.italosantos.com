// Configurações do PayPal SDK
export const PAYPAL_CONFIG = {
  // Client ID - usando suas credenciais reais do PayPal
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'AXykIWKfbbsR_Qe4eLrDgxudUWcoFn-cihQdgWJTqEOVQiP5fxXln-C5fr1QABQ4jowP7Oz2nkNtPFie',
  
  // Email do PayPal para doações/pagamentos
  businessEmail: process.env.NEXT_PUBLIC_PAYPAL_BUSINESS_EMAIL || 'pix@italosantos.com',
  
  // Configurações padrão
  currency: 'BRL',
  intent: 'capture' as const,
  
  // Opções do script PayPal
  scriptOptions: {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
    currency: 'BRL',
    intent: 'capture' as const,
    components: 'buttons',
    'disable-funding': 'venmo,card',
  },
  
  // Estilos padrão dos botões
  buttonStyle: {
    layout: 'vertical' as const,
    color: 'blue' as const,
    shape: 'rect' as const,
    label: 'paypal' as const,
    height: 50,
  },
  
  // Planos de preços
  plans: {
    monthly: {
      amount: '29.90',
      name: 'Assinatura Mensal',
      description: 'Acesso completo por 30 dias',
      features: [
        'Todos os vídeos em HD',
        'Chat direto',
        'Conteúdo exclusivo',
        'Suporte prioritário'
      ]
    },
    weekly: {
      amount: '9.90',
      name: 'Acesso Semanal',
      description: 'Acesso completo por 7 dias',
      features: [
        'Todos os vídeos em HD',
        'Chat direto',
        'Conteúdo da semana'
      ]
    },
    daily: {
      amount: '2.90',
      name: 'Acesso Diário',
      description: 'Acesso completo por 24 horas',
      features: [
        'Vídeos do dia',
        'Chat por 24h'
      ]
    }
  }
};

// Funções auxiliares
export const createPayPalOrder = (amount: string, description: string) => {
  return {
    purchase_units: [
      {
        amount: {
          value: amount,
          currency_code: PAYPAL_CONFIG.currency,
        },
        description: description,
      },
    ],
    intent: "CAPTURE",
  };
};

export const formatPayPalAmount = (amount: string | number): string => {
  return parseFloat(amount.toString()).toFixed(2);
};
