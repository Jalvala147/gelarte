export function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function etiquetasDe(valor: unknown) {
  const partes = Array.isArray(valor) ? valor : String(valor ?? "").split(/[,;\n]+/);
  const vistas = new Set<string>();
  const lista: string[] = [];
  for (const parte of partes) {
    const texto = String(parte).trim().replace(/\s+/g, " ");
    if (texto.length < 2 || texto.length > 40) continue;
    const clave = normalizar(texto);
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    lista.push(texto);
    if (lista.length >= 12) break;
  }
  return lista;
}

export function formatoPrecio(valor: number) {
  if (valor <= 0) return "A consultar";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(valor);
}
