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
  visible: boolean;
  creado: string;
};

export const IMAGEN_GENERICA = "/imagenes/gelatina.svg";
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
    typeof producto.visible === "boolean" &&
    typeof producto.creado === "string"
  );
}
