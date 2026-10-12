export const CATEGORIAS = [
  { id: "clasicas", nombre: "Clásicas" },
  { id: "fruta", nombre: "Con fruta" },
  { id: "leche", nombre: "De leche" },
  { id: "infantiles", nombre: "Infantiles" },
  { id: "especiales", nombre: "Especiales" },
] as const;

export type CategoriaId = (typeof CATEGORIAS)[number]["id"];

export type Producto = {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaId;
  precio: number;
  unidad: string;
  imagen: string;
  /** Porcentaje vertical del recorte, de 0 (arriba) a 100 (abajo). */
  encuadre?: number;
  /** Palabras extra para la búsqueda, además del nombre y la descripción. */
  etiquetas?: string[];
  visible: boolean;
  creado: string;
};

export function encuadreDe(valor: unknown) {
  if (valor === undefined || valor === null || valor === "") return 50;
  const numero = typeof valor === "number" ? valor : Number(valor);
  if (!Number.isFinite(numero)) return 50;
  return Math.min(100, Math.max(0, Math.round(numero)));
}

export const IMAGEN_GENERICA = "/marca/logo.jpg";
export const ID_VALIDO = /^[a-zA-Z0-9-]{1,80}$/;

export function esCategoria(valor: string): valor is CategoriaId {
  return CATEGORIAS.some((categoria) => categoria.id === valor);
}

export function nombreCategoria(id: string) {
  return CATEGORIAS.find((categoria) => categoria.id === id)?.nombre ?? id;
}

export function imagenSegura(src: string) {
  if (src.startsWith("/") && !src.startsWith("//")) return src;
  try {
    const url = new URL(src);
    if (url.protocol === "https:") return src;
  } catch {
    /* una ruta mal formada usa la ilustración genérica */
  }
  return IMAGEN_GENERICA;
}

export function esProducto(valor: unknown): valor is Producto {
  if (!valor || typeof valor !== "object") return false;
  const producto = valor as Record<string, unknown>;
  return (
    typeof producto.id === "string" &&
    ID_VALIDO.test(producto.id) &&
    typeof producto.nombre === "string" &&
    typeof producto.descripcion === "string" &&
    typeof producto.categoria === "string" &&
    esCategoria(producto.categoria) &&
    typeof producto.precio === "number" &&
    Number.isInteger(producto.precio) &&
    typeof producto.unidad === "string" &&
    typeof producto.imagen === "string" &&
    (producto.encuadre === undefined ||
      (typeof producto.encuadre === "number" &&
        Number.isInteger(producto.encuadre) &&
        producto.encuadre >= 0 &&
        producto.encuadre <= 100)) &&
    (producto.etiquetas === undefined ||
      (Array.isArray(producto.etiquetas) && producto.etiquetas.every((etiqueta) => typeof etiqueta === "string"))) &&
    typeof producto.visible === "boolean" &&
    typeof producto.creado === "string"
  );
}
