import { readFileSync, writeFileSync } from "node:fs";

const ruta = "node_modules/@astrojs/vercel/dist/serverless/middleware.js";
const fuente = readFileSync(ruta, "utf8");
const importEstatico = 'import { rolldown } from "rolldown";\n';

if (!fuente.includes(importEstatico)) {
  process.exit(0);
}

const parcheado = fuente
  .replace(importEstatico, "")
  .replace(
    "const bundle = await rolldown({",
    'const { rolldown } = await import("rolldown");\n\tconst bundle = await rolldown({',
  );

writeFileSync(ruta, parcheado);
