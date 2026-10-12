# Gelarte

Catálogo de gelatinas caseras. La página pública muestra foto, precio, categoría y descripción. La dueña agrega o corrige sabores desde un enlace privado.

## Verla en local

```sh
npm install
npm run dev
```

Abre [http://127.0.0.1:4327](http://127.0.0.1:4327).

En local, la gestión está en [http://127.0.0.1:4327/gestionar](http://127.0.0.1:4327/gestionar) y la contraseña es `gelarte`. Los cambios de esa copia se guardan en `data/catalogo.local.json` y las fotos en `public/uploads/`. Esos archivos no se suben a git.

## Qué se edita a mano

El WhatsApp, el horario y la nota de entrega están en `src/data/negocio.ts`. El número va con código de país, sin `+` ni espacios, por ejemplo `525512345678`.

El catálogo de partida vive en `src/data/productos.json` y las fotos en `public/imagenes/`. Cuando la dueña guarda un cambio, el catálogo activo pasa a ser el de Blob (en Vercel) o el archivo local (en tu máquina).

## Publicar en Vercel

1. Importa este repositorio en Vercel. El proyecto ya usa el adaptador de Astro para Vercel.
2. En el proyecto, crea un almacenamiento **Blob** y conéctalo. Vercel agrega `BLOB_READ_WRITE_TOKEN`.
3. En Environment Variables define:
   - `ADMIN_PASSWORD`: la contraseña de la dueña.
   - `SESSION_SECRET`: una frase de al menos 16 caracteres.
4. Publica.

Con Blob, la dueña entra a `/gestionar` en el sitio publicado y los cambios se guardan en internet. Sin Blob, el sitio muestra el catálogo de partida, pero no puede guardar productos nuevos. Las fotos se reducen en el teléfono antes de subirse.

El enlace de gestión es `/gestionar`. También está al pie de la página. No sale en el menú principal; la contraseña es lo que lo protege.
