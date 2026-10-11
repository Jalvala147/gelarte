import type { APIRoute } from "astro";
import { COOKIE, mismoOrigen, sesionValida } from "../../../lib/auth";
import { agregarProducto, leerDatos, leerImagen } from "../../../lib/catalogo";
import { json } from "../../../lib/http";

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!mismoOrigen(request)) return json({ ok: false, error: "Solicitud rechazada." }, 403);
  if (!sesionValida(cookies.get(COOKIE)?.value)) {
    return json({ ok: false, error: "Entra de nuevo para guardar." }, 401);
  }
  const form = await request.formData();
  const datos = leerDatos(form);
  if (!datos.ok) return json({ ok: false, error: datos.error }, 400);
  const imagen = await leerImagen(form);
  if (!imagen.ok) return json({ ok: false, error: imagen.error }, 400);
  try {
    const producto = await agregarProducto(datos.datos, imagen.imagen);
    return json({ ok: true, id: producto.id });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "No se pudo guardar la gelatina.";
    return json({ ok: false, error: mensaje }, 500);
  }
};
