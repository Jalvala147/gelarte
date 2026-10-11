import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE = "gelarte_sesion";
export const MAX_AGE_S = 60 * 60 * 24 * 7;
const PASSWORD_LOCAL = "gelarte";

export function gestionConfigurada() {
  return Boolean(process.env.ADMIN_PASSWORD) || import.meta.env.DEV;
}

function secreto() {
  const configurado = process.env.SESSION_SECRET;
  if (configurado && configurado.length >= 16) return configurado;
  if (import.meta.env.DEV) return "gelarte-dev-secret-no-usar-en-produccion";
  return null;
}

function passwordEsperada() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  if (import.meta.env.DEV) return PASSWORD_LOCAL;
  return null;
}

export function passwordOk(entrada: string) {
  const esperada = passwordEsperada();
  const clave = secreto() ?? "gelarte";
  if (!esperada) return false;
  const a = createHmac("sha256", clave).update(entrada).digest();
  const b = createHmac("sha256", clave).update(esperada).digest();
  return timingSafeEqual(a, b);
}

export function crearSesion() {
  const clave = secreto();
  if (!clave) return null;
  const expira = Date.now() + MAX_AGE_S * 1000;
  const cuerpo = `v1.${expira}`;
  const firma = createHmac("sha256", clave).update(cuerpo).digest("base64url");
  return `${cuerpo}.${firma}`;
}

export function sesionValida(token: string | undefined) {
  if (!token) return false;
  const clave = secreto();
  if (!clave) return false;
  const partes = token.split(".");
  if (partes.length !== 3) return false;
  const [version, expira, firma] = partes;
  if (version !== "v1" || !expira || !firma) return false;
  const cuerpo = `${version}.${expira}`;
  const esperada = createHmac("sha256", clave).update(cuerpo).digest();
  const recibida = Buffer.from(firma, "base64url");
  if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) return false;
  const momento = Number(expira);
  return Number.isFinite(momento) && momento > Date.now();
}

export function mismoOrigen(request: Request) {
  const origen = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origen || !host) return false;
  try {
    return new URL(origen).host === host;
  } catch {
    return false;
  }
}
