async function prepararFoto(archivo: File) {
  try {
    const bitmap = await createImageBitmap(archivo);
    const maximo = 1600;
    const escala = Math.min(1, maximo / Math.max(bitmap.width, bitmap.height));
    const ancho = Math.max(1, Math.round(bitmap.width * escala));
    const alto = Math.max(1, Math.round(bitmap.height * escala));
    const lienzo = document.createElement("canvas");
    lienzo.width = ancho;
    lienzo.height = alto;
    const contexto = lienzo.getContext("2d");
    if (!contexto) return archivo;
    contexto.drawImage(bitmap, 0, 0, ancho, alto);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolver) => lienzo.toBlob(resolver, "image/jpeg", 0.82));
    if (!blob) return archivo;
    return new File([blob], "foto.jpg", { type: "image/jpeg" });
  } catch {
    return archivo;
  }
}

async function enviar(url: string, init: RequestInit) {
  const respuesta = await fetch(url, init);
  const datos = (await respuesta.json().catch(() => ({}))) as { error?: string };
  if (!respuesta.ok) throw new Error(datos.error || "No se pudo completar.");
}

function mostrarError(formulario: HTMLFormElement, texto: string) {
  const aviso = formulario.querySelector<HTMLElement>("[data-error]");
  if (!aviso) return;
  aviso.hidden = texto.length === 0;
  aviso.textContent = texto;
}

async function guardarFormulario(formulario: HTMLFormElement, url: string, method: string, espera = "Guardando…") {
  const boton = formulario.querySelector<HTMLButtonElement>("button[type=submit]");
  const original = boton?.textContent ?? "";
  if (boton) {
    boton.disabled = true;
    boton.textContent = espera;
  }
  mostrarError(formulario, "");
  try {
    const datos = new FormData(formulario);
    const archivo = formulario.querySelector<HTMLInputElement>('input[type="file"]');
    if (archivo?.files?.[0]) datos.set("imagen", await prepararFoto(archivo.files[0]));
    const visible = formulario.querySelector<HTMLInputElement>('input[name="visible"]');
    if (visible) datos.set("visible", visible.checked ? "1" : "0");
    await enviar(url, { method, body: datos });
    location.reload();
  } catch (error) {
    mostrarError(formulario, error instanceof Error ? error.message : "No se pudo guardar.");
    if (boton) {
      boton.disabled = false;
      boton.textContent = original;
    }
  }
}

const entrar = document.querySelector<HTMLFormElement>("#entrar");
entrar?.addEventListener("submit", (evento) => {
  evento.preventDefault();
  void guardarFormulario(entrar, "/api/sesion", "POST", "Entrando…");
});

const nueva = document.querySelector<HTMLFormElement>("#nueva");
nueva?.addEventListener("submit", (evento) => {
  evento.preventDefault();
  void guardarFormulario(nueva, "/api/productos", "POST");
});

const foto = document.querySelector<HTMLInputElement>("#foto");
const vista = document.querySelector<HTMLImageElement>("#vista");
let vistaUrl = "";
foto?.addEventListener("change", () => {
  const archivo = foto.files?.[0];
  if (vistaUrl) URL.revokeObjectURL(vistaUrl);
  if (!archivo || !vista) return;
  vistaUrl = URL.createObjectURL(archivo);
  vista.src = vistaUrl;
  vista.hidden = false;
});

for (const formulario of document.querySelectorAll<HTMLFormElement>("[data-editar]")) {
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const id = formulario.dataset.id;
    if (!id) return;
    void guardarFormulario(formulario, `/api/productos/${encodeURIComponent(id)}`, "PATCH");
  });
}

for (const boton of document.querySelectorAll<HTMLButtonElement>("[data-borrar]")) {
  boton.addEventListener("click", async () => {
    const id = boton.dataset.borrar;
    const formulario = boton.closest("form");
    if (!id || !formulario) return;
    if (!confirm("¿Quitar esta gelatina del catálogo?")) return;
    boton.disabled = true;
    mostrarError(formulario, "");
    try {
      await enviar(`/api/productos/${encodeURIComponent(id)}`, { method: "DELETE" });
      location.reload();
    } catch (error) {
      mostrarError(formulario, error instanceof Error ? error.message : "No se pudo quitar.");
      boton.disabled = false;
    }
  });
}

document.querySelector<HTMLButtonElement>("#salir")?.addEventListener("click", async () => {
  await enviar("/api/sesion", { method: "DELETE" }).catch(() => undefined);
  location.href = "/gestionar";
});
