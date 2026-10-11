import { normalizar } from "../lib/texto";

const raiz = document.querySelector<HTMLElement>("#catalogo");
if (raiz) {
  const botones = [...raiz.querySelectorAll<HTMLButtonElement>("[data-filtro]")];
  const tarjetas = [...raiz.querySelectorAll<HTMLElement>("[data-producto]")];
  const buscar = raiz.querySelector<HTMLInputElement>("#buscar");
  const conteo = raiz.querySelector<HTMLElement>("#conteo");
  const vacio = raiz.querySelector<HTMLElement>("#vacio");

  const aplicar = () => {
    const activo = botones.find((boton) => boton.getAttribute("aria-pressed") === "true");
    const categoria = activo?.dataset.filtro ?? "todas";
    const consulta = normalizar(buscar?.value ?? "");
    let visibles = 0;
    for (const tarjeta of tarjetas) {
      const coincideCategoria = categoria === "todas" || tarjeta.dataset.categoria === categoria;
      const coincideTexto = consulta.length === 0 || (tarjeta.dataset.buscar ?? "").includes(consulta);
      const mostrar = coincideCategoria && coincideTexto;
      tarjeta.hidden = !mostrar;
      if (mostrar) visibles += 1;
    }
    if (conteo) conteo.textContent = visibles === 1 ? "1 gelatina" : `${visibles} gelatinas`;
    if (vacio) vacio.hidden = visibles !== 0;
  };

  for (const boton of botones) {
    boton.addEventListener("click", () => {
      for (const otro of botones) otro.setAttribute("aria-pressed", String(otro === boton));
      aplicar();
    });
  }

  buscar?.addEventListener("input", aplicar);
}
