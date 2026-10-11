import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import semillaJson from "../data/productos.json";
import {
  esCategoria,
  esProducto,
  IMAGEN_GENERICA,
  type CategoriaId,
  type Producto,
} from "./tipos";

const ARCHIVO_LOCAL = path.join(process.cwd(), "data", "catalogo.local.json");
const CARPETA_SUBIDAS = path.join(process.cwd(), "public", "uploads");
const RUTA_CATALOGO = "catalogo/productos.json";
const MAX_BYTES = 3_000_000;

export type DatosProducto = {
  nombre: string;
  descripcion: string;
  categoria: CategoriaId;
  precio: number;
  unidad: string;
};

export type ImagenSubida = {
  bytes: Uint8Array;
  tipo: "image/jpeg" | "image/png" | "image/webp";
};

let cola: Promise<unknown> = Promise.resolve();

function enFila<T>(tarea: () => Promise<T>) {
  const corrida = cola.then(tarea, tarea);
  cola = corrida.then(
    () => undefined,
    () => undefined,
  );
  return corrida;
}

export function destinoGuardado(): "blob" | "local" | "ninguno" {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  if (import.meta.env.DEV) return "local";
  return "ninguno";
}

function parsearLista(valor: unknown): Producto[] {
  if (!Array.isArray(valor) || !valor.every(esProducto)) {
    throw new Error("No se pudo leer el catálogo.");
  }
  return valor;
}

async function leerLocal() {
  try {
    const texto = await readFile(ARCHIVO_LOCAL, "utf8");
    return parsearLista(JSON.parse(texto));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw new Error("No se pudo leer el catálogo.");
  }
}

async function leerBlob() {
  const { get } = await import("@vercel/blob");
  const resultado = await get(RUTA_CATALOGO, { access: "public", useCache: false });
  if (!resultado || resultado.statusCode !== 200) return null;
  const texto = await new Response(resultado.stream).text();
  return parsearLista(JSON.parse(texto));
}

async function leer() {
  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const remoto = await leerBlob();
      if (remoto) return remoto;
    } else {
      const local = await leerLocal();
      if (local) return local;
    }
    return parsearLista(semillaJson);
  } catch (error) {
    if (error instanceof Error && error.message === "No se pudo leer el catálogo.") throw error;
    console.error(error);
    throw new Error("No se pudo leer el catálogo.");
  }
}

async function guardar(lista: Producto[]) {
  const destino = destinoGuardado();
  if (destino === "blob") {
    const { put } = await import("@vercel/blob");
    await put(RUTA_CATALOGO, JSON.stringify(lista), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
    return;
  }
  if (destino === "local") {
    await mkdir(path.dirname(ARCHIVO_LOCAL), { recursive: true });
    await writeFile(ARCHIVO_LOCAL, JSON.stringify(lista, null, 2));
    return;
  }
  throw new Error("Para guardar productos hay que conectar Vercel Blob y la variable BLOB_READ_WRITE_TOKEN.");
}

function extension(tipo: ImagenSubida["tipo"]) {
  if (tipo === "image/png") return "png";
  if (tipo === "image/webp") return "webp";
  return "jpg";
}

function tipoImagen(bytes: Uint8Array): ImagenSubida["tipo"] | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export async function leerImagen(form: FormData): Promise<{ ok: true; imagen: ImagenSubida | null } | { ok: false; error: string }> {
  const archivo = form.get("imagen");
  if (!(archivo instanceof File) || archivo.size === 0) return { ok: true, imagen: null };
  if (archivo.size > MAX_BYTES) {
    return { ok: false, error: "La foto pesa demasiado. Elige una imagen más pequeña." };
  }
  const bytes = new Uint8Array(await archivo.arrayBuffer());
  const tipo = tipoImagen(bytes);
  if (!tipo) return { ok: false, error: "La foto debe ser JPG, PNG o WebP." };
  return { ok: true, imagen: { bytes, tipo } };
}

async function guardarImagen(id: string, imagen: ImagenSubida) {
  const ext = extension(imagen.tipo);
  if (destinoGuardado() === "blob") {
    const { put } = await import("@vercel/blob");
    const blob = await put(`productos/${id}.${ext}`, Buffer.from(imagen.bytes), {
      access: "public",
      addRandomSuffix: true,
      contentType: imagen.tipo,
    });
    return blob.url;
  }
  if (destinoGuardado() === "local") {
    await mkdir(CARPETA_SUBIDAS, { recursive: true });
    const nombre = `${id}-${Date.now()}.${ext}`;
    await writeFile(path.join(CARPETA_SUBIDAS, nombre), imagen.bytes);
    return `/uploads/${nombre}`;
  }
  throw new Error("Para guardar fotos hay que conectar Vercel Blob y la variable BLOB_READ_WRITE_TOKEN.");
}

async function borrarImagen(url: string) {
  if (url === IMAGEN_GENERICA || url.endsWith("/imagenes/gelatina.svg")) return;
  if (url.startsWith("/uploads/")) {
    await unlink(path.join(CARPETA_SUBIDAS, path.basename(url))).catch(() => undefined);
    return;
  }
  if (url.includes(".blob.vercel-storage.com")) {
    const { del } = await import("@vercel/blob");
    await del(url).catch(() => undefined);
  }
}

function ordenar(lista: Producto[]) {
  const orden = new Map(["clasicas", "fruta", "leche", "infantiles", "especiales"].map((id, indice) => [id, indice]));
  return lista.slice().sort((a, b) => {
    const diferencia = (orden.get(a.categoria) ?? 0) - (orden.get(b.categoria) ?? 0);
    if (diferencia !== 0) return diferencia;
    return a.nombre.localeCompare(b.nombre, "es");
  });
}

export async function listarPublico() {
  const lista = await leer();
  return ordenar(lista.filter((producto) => producto.visible));
}

export async function listarTodo() {
  return ordenar(await leer());
}

export async function agregarProducto(datos: DatosProducto, imagen: ImagenSubida | null) {
  return enFila(async () => {
    const lista = await leer();
    const id = crypto.randomUUID();
    const producto: Producto = {
      id,
      ...datos,
      imagen: imagen ? await guardarImagen(id, imagen) : IMAGEN_GENERICA,
      visible: true,
      creado: new Date().toISOString(),
    };
    lista.push(producto);
    await guardar(lista);
    return producto;
  });
}

export async function actualizarProducto(id: string, datos: DatosProducto, visible: boolean, imagen: ImagenSubida | null) {
  return enFila(async () => {
    const lista = await leer();
    const indice = lista.findIndex((producto) => producto.id === id);
    if (indice < 0) throw new Error("Esa gelatina ya no está en el catálogo.");
    const anterior = lista[indice].imagen;
    const siguiente = imagen ? await guardarImagen(id, imagen) : anterior;
    lista[indice] = { ...lista[indice], ...datos, visible, imagen: siguiente };
    await guardar(lista);
    if (imagen && anterior !== siguiente) await borrarImagen(anterior);
    return lista[indice];
  });
}

export function leerDatos(form: FormData): { ok: true; datos: DatosProducto } | { ok: false; error: string } {
  const nombre = String(form.get("nombre") ?? "").trim().replace(/\s+/g, " ");
  const descripcion = String(form.get("descripcion") ?? "").trim().replace(/\s+/g, " ");
  const categoria = String(form.get("categoria") ?? "");
  const precio = Number(form.get("precio"));
  const unidad = String(form.get("unidad") ?? "vaso").trim().replace(/\s+/g, " ") || "vaso";

  if (nombre.length < 2 || nombre.length > 60) {
    return { ok: false, error: "El nombre debe tener entre 2 y 60 caracteres." };
  }
  if (descripcion.length < 8 || descripcion.length > 240) {
    return { ok: false, error: "La descripción debe tener entre 8 y 240 caracteres." };
  }
  if (!esCategoria(categoria)) return { ok: false, error: "Elige una categoría de la lista." };
  if (!Number.isInteger(precio) || precio < 1 || precio > 9999) {
    return { ok: false, error: "El precio debe ser un número entero entre 1 y 9999." };
  }
  if (unidad.length > 24) return { ok: false, error: "La unidad es demasiado larga." };
  return { ok: true, datos: { nombre, descripcion, categoria, precio, unidad } };
}

export async function eliminarProducto(id: string) {
  return enFila(async () => {
    const lista = await leer();
    const producto = lista.find((item) => item.id === id);
    if (!producto) throw new Error("Esa gelatina ya no está en el catálogo.");
    await guardar(lista.filter((item) => item.id !== id));
    await borrarImagen(producto.imagen);
  });
}
