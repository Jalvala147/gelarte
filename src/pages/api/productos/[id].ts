import type { APIRoute } from "astro";
import { COOKIE, mismoOrigen, sesionValida } from "../../../lib/auth";
import { actualizarProducto, eliminarProducto, leerDatos, leerImagen } from "../../../lib/catalogo";
import { json } from "../../../lib/http";
import { ID_VALIDO } from "../../../lib/tipos";

function idValido(id: string | undefined) {
  return Boolean(id && ID_VALIDO.test(id));
}

export const PATCH: APIRoute = async ({ request, cookies, params }) => {
  if (!mismoOrigen(request)) return json({ ok: false, error: "Solicitud rechazada." }, 403);
  if (!sesionValida(cookies.get(COOKIE)?.value)) {
    return json({ ok: false, error: "Entra de nuevo para guardar." }, 401);
  }
  const id = params.id;
  if (!idValido(id)) return json({ ok: false, error: "Producto no válido." }, 400);
  const form = await request.formData();
  const datos = leerDatos(form);
  if (!datos.ok) return json({ ok: false, error: datos.error }, 400);
  const imagen = await leerImagen(form);
  if (!imagen.ok) return json({ ok: false, error: imagen.error }, 400);
  const visible = String(form.get("visible") ?? "") === "1";
  try {
    await actualizarProducto(id!, datos.datos, visible, imagen.imagen);
    return json({ ok: true });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "No se pudo actualizar la gelatina.";
    const status = mensaje.includes("ya no está") ? 404 : 500;
    return json({ ok: false, error: mensaje }, status);
  }
};

export const DELETE: APIRoute = async ({ request, cookies, params }) => {
  if (!mismoOrigen(request)) return json({ ok: false, error: "Solicitud rechazada." }, 403);
  if (!sesionValida(cookies.get(COOKIE)?.value)) {
    return json({ ok: false, error: "Entra de nuevo para guardar." }, 401);
  }
  const id = params.id;
  if (!idValido(id)) return json({ ok: false, error: "Producto no válido." }, 400);
  try {
    await eliminarProducto(id!);
    return json({ ok: true });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "No se pudo quitar la gelatina.";
    const status = mensaje.includes("ya no está") ? 404 : 500;
    return json({ ok: false, error: mensaje }, status);
  }
};
