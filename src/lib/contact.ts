// Número em formato internacional, sem "+" nem espaços. Ex.: 258841234567
export const WHATSAPP_NUMBER = "258852740554";

export function whatsappUrl(
  message = "Olá, gostaria de uma demonstração do PortOps."
) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}