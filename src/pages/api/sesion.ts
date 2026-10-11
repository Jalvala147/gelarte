import type { APIRoute } from "astro";
import { COOKIE, MAX_AGE_S, crearSesion, gestionConfigurada, mismoOrigen, passwordOk } from "../../lib/auth";
import { json } from "../../lib/http";

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!mismoOrigen(request)) return json({ ok: false, error: "Solicitud rechazada." }, 403);
  if (!gestionConfigurada()) {
    return json({ ok: false, error: "Falta ADMIN_PASSWORD en el servidor." }, 503);
  }
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  if (!passwordOk(password)) return json({ ok: false, error: "Contraseña incorrecta." }, 401);
  const token = crearSesion();
  if (!token) return json({ ok: false, error: "Falta SESSION_SECRET en el servidor." }, 503);
  cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_S,
  });
  return json({ ok: true });
};

export const DELETE: APIRoute = async ({ cookies }) => {
  cookies.delete(COOKIE, { path: "/" });
  return json({ ok: true });
};
