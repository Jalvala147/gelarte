export const negocio = {
  nombre: "GELARTE",
  whatsapp: "523314414885",
  horario: "Martes a domingo, de 10:00 a 19:00",
  anticipacion: "Los pedidos se apartan con tres días de anticipación.",
  entrega: "La entrega se acuerda por WhatsApp.",
};

export function telefonoVisible(numero = negocio.whatsapp) {
  const local = numero.startsWith("52") ? numero.slice(2) : numero;
  if (local.length === 10) {
    return `${local.slice(0, 2)} ${local.slice(2, 6)} ${local.slice(6)}`;
  }
  return local;
}

export function enlaceWhatsapp(texto: string) {
  return `https://wa.me/${negocio.whatsapp}?text=${encodeURIComponent(texto)}`;
}
