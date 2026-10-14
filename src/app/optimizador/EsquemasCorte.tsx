'use client';
import { useState } from 'react';
import type { Patron } from '@/lib/corte/guillotina';
import type { CorteDia, MaterialDia, PlanCorte, TotalesCorte } from '@/lib/corte/plan-corte';

const fmt = (n: number | null | undefined, d = 0) =>
  n == null || !Number.isFinite(n) ? '—' : n.toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });

// Un color por medida, como en la hoja de la seccionadora: todas las piezas iguales
// se ven del mismo color y llevan el mismo número.
const COLORES = ['#a5f3fc', '#fecaca', '#fef08a', '#bbf7d0', '#ddd6fe', '#fed7aa', '#bfdbfe', '#f5d0fe', '#d9f99d', '#fecdd3'];
const colorDe = (grupo: number) => COLORES[(grupo - 1) % COLORES.length];

const th = 'px-2 py-1.5 text-left text-xs font-medium text-slate-500 border-b border-slate-200 whitespace-nowrap';
const td = 'px-2 py-1.5 text-sm text-slate-800 border-b border-slate-100';
const tdNum = `${td} text-right tabular-nums`;

/** Esquemas de corte día por día, con el resumen consolidado al final. */
export default function EsquemasCorte({ plan, meta }: { plan: PlanCorte; meta: number }) {
  if (plan.dias.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Sin <b>piezas por día</b> no hay jornadas que separar: se muestra el proyecto cortado de una
          sola vez. Escribe el ritmo arriba para ver el corte día por día.
        </div>
        <Totales titulo="Proyecto completo" totales={plan.proyectoCompleto} meta={meta} />
        <Materiales materiales={plan.proyectoCompleto.materiales} sinFormato={plan.proyectoCompleto.sinFormato} meta={meta} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {plan.dias.map((d) => <Dia key={d.dia} dia={d} meta={meta} />)}
      <Resumen plan={plan} meta={meta} />
    </div>
  );
}

function Dia({ dia, meta }: { dia: CorteDia; meta: number }) {
  // Un dia trae su tabla de muebles, la de materiales y un esquema por lamina:
  // se pliega para poder recorrer el plan sin bajar por todos los dibujos.
  const [abierto, setAbierto] = useState(true);

  return (
    <section className="rounded-2xl border-2 border-slate-300">
      <header className="rounded-t-2xl bg-slate-100">
        <button type="button" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto}
          className="flex w-full flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-3 py-2 text-left hover:bg-slate-200/60">
          <div className="flex items-baseline gap-2">
            <span className="text-slate-400">{abierto ? '▾' : '▸'}</span>
            <div>
              <h3 className="font-semibold text-slate-900">Día {dia.dia}</h3>
              <p className="text-xs text-slate-500">
                {fmt(dia.modulos.length)} módulo(s) · {fmt(dia.modulos.reduce((n, m) => n + m.unidades, 0))} unidades
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-700">
            <b>{fmt(dia.piezas)}</b> piezas · <b>{fmt(dia.materiales.length)}</b> materiales ·{' '}
            <b>{fmt(dia.totales.laminas)}</b> tableros ·{' '}
            <b>{fmt(dia.totales.areaLaminasM2, 2)}</b> m² ·{' '}
            <span className={dia.totales.desperdicioPct > meta ? 'text-amber-700' : 'text-emerald-700'}>
              D = <b>{fmt(dia.totales.desperdicioPct, 3)} %</b>
            </span>{' '}
            · <b>{fmt(dia.totales.cortes.total)}</b> cortes
          </p>
        </button>
      </header>

      {abierto && (
        <div className="space-y-3 p-3">
          <ModulosDelDia dia={dia} />
          <MaterialesDelDia dia={dia} meta={meta} />
          <Materiales materiales={dia.materiales} sinFormato={dia.sinFormato} meta={meta} dia={dia.dia} />
        </div>
      )}
    </section>
  );
}


// Que muebles entran en la jornada. Iba en una linea dentro de la cabecera y con
// diez modulos se cortaba: aqui se lee, y se ve cual viene partido de otro dia.
function ModulosDelDia({ dia }: { dia: CorteDia }) {
  const hayPartidos = dia.modulos.some((m) => m.partido);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead><tr>
          <th className={th}>Mueble del día {dia.dia}</th><th className={th}>Cocina</th>
          <th className={th}>Tablero principal</th>
          <th className={`${th} text-right`}>Unidades</th><th className={`${th} text-right`}>Piezas</th>
        </tr></thead>
        <tbody>
          {dia.modulos.map((m, i) => (
            <tr key={`${m.codigo}-${i}`}>
              <td className={`${td} font-medium`}>
                {m.codigo}
                {m.partido && <span className="ml-1 text-xs font-normal text-amber-700">(parte)</span>}
              </td>
              <td className={`${td} text-xs text-slate-500`}>{m.cocina}</td>
              <td className={`${td} text-xs`}>{m.material}</td>
              <td className={tdNum}>{fmt(m.unidades)}</td>
              <td className={tdNum}>{fmt(m.piezas, Number.isInteger(m.piezas) ? 0 : 2)}</td>
            </tr>
          ))}
          <tr className="bg-slate-50 font-semibold">
            <td className={td}>{fmt(dia.modulos.length)} módulo(s)</td><td className={td} /><td className={td} />
            <td className={tdNum}>{fmt(dia.modulos.reduce((n, m) => n + m.unidades, 0))}</td>
            <td className={tdNum}>{fmt(dia.piezas)}</td>
          </tr>
        </tbody>
      </table>
      {hayPartidos && (
        <p className="mt-1 text-[11px] text-slate-400">
          <b>(parte)</b> = de ese mueble se cortan unidades también en otro día.
        </p>
      )}
    </div>
  );
}

// Que materiales toca cortar ese dia y cuanto cuesta cada uno, antes de entrar a
// los esquemas: con cinco materiales, la tabla evita recorrer todos los dibujos.
function MaterialesDelDia({ dia, meta }: { dia: CorteDia; meta: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead><tr>
          <th className={th}>Material del día {dia.dia}</th><th className={th}>Lámina</th>
          <th className={`${th} text-right`}>Tableros</th><th className={`${th} text-right`}>Esquemas</th>
          <th className={`${th} text-right`}>m² tablero</th><th className={`${th} text-right`}>m² netos</th>
          <th className={`${th} text-right`}>Desperdicio</th><th className={`${th} text-right`}>Cortes</th>
        </tr></thead>
        <tbody>
          {dia.materiales.map((m) => (
            <tr key={m.material}>
              <td className={`${td} font-medium`}>
                {m.material}
                <span className="block text-[11px] font-normal text-slate-400">{m.esquema.proveedor || 'sin proveedor'}</span>
              </td>
              <td className={`${td} text-xs`}>{fmt(m.esquema.plan.formato.largoMm)} × {fmt(m.esquema.plan.formato.anchoMm)}</td>
              <td className={tdNum}>{fmt(m.esquema.plan.laminas)}</td>
              <td className={tdNum}>{fmt(m.esquema.plan.patrones.length)}</td>
              <td className={tdNum}>{fmt(m.esquema.plan.areaLaminasM2, 2)}</td>
              <td className={tdNum}>{fmt(m.esquema.plan.areaPiezasM2, 2)}</td>
              <td className={`${tdNum} ${m.esquema.plan.desperdicioPct > meta ? 'text-amber-700' : ''}`}>{fmt(m.esquema.plan.desperdicioPct, 2)} %</td>
              <td className={tdNum}>{fmt(m.cortes.total)}</td>
            </tr>
          ))}
          <tr className="bg-slate-50 font-semibold">
            <td className={td}>Día {dia.dia}</td><td className={td} />
            <td className={tdNum}>{fmt(dia.totales.laminas)}</td>
            <td className={tdNum}>{fmt(dia.materiales.reduce((s, m) => s + m.esquema.plan.patrones.length, 0))}</td>
            <td className={tdNum}>{fmt(dia.totales.areaLaminasM2, 2)}</td>
            <td className={tdNum}>{fmt(dia.totales.areaPiezasM2, 2)}</td>
            <td className={tdNum}>{fmt(dia.totales.desperdicioPct, 2)} %</td>
            <td className={tdNum}>{fmt(dia.totales.cortes.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Totales({ titulo, totales, meta }: { titulo: string; totales: TotalesCorte; meta: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Dato label={`${titulo}: tableros`} valor={fmt(totales.laminas)}
        detalle={`${fmt(totales.cortes.total)} cortes · ${fmt(totales.iteraciones)} combinaciones`} oscuro />
      <Dato label="m² de tablero" valor={fmt(totales.areaLaminasM2, 2)} detalle="láminas enteras" />
      <Dato label="m² netos de piezas" valor={fmt(totales.areaPiezasM2, 2)} detalle="sin sierra ni refilado" />
      <Dato label="Desperdicio" valor={`${fmt(totales.desperdicioPct, 2)} %`}
        detalle={`${fmt(totales.areaLaminasM2 - totales.areaPiezasM2, 2)} m² perdidos${totales.desperdicioPct > meta ? ` · meta ${fmt(meta)} %` : ''}`} />
    </div>
  );
}

function Dato({ label, valor, detalle, oscuro }: { label: string; valor: string; detalle?: string; oscuro?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${oscuro ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <p className={`text-xs ${oscuro ? 'text-slate-300' : 'text-slate-500'}`}>{label}</p>
      <p className="text-xl font-semibold">{valor}</p>
      {detalle && <p className={`text-xs ${oscuro ? 'text-slate-400' : 'text-slate-400'}`}>{detalle}</p>}
    </div>
  );
}

function Materiales({ materiales, sinFormato, meta, dia }: { materiales: MaterialDia[]; sinFormato: string[]; meta: number; dia?: number }) {
  return (
    <div className="space-y-3">
      {sinFormato.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Sin esquema por falta de formato de lámina: {sinFormato.join(', ')}. Configura su formato en los parámetros de planta.
        </div>
      )}
      {materiales.map((m) => <MaterialEsquema key={m.material} material={m} meta={meta} dia={dia} />)}
    </div>
  );
}

function MaterialEsquema({ material, meta, dia }: { material: MaterialDia; meta: number; dia?: number }) {
  const { esquema, cortes } = material;
  const { plan } = esquema;

  return (
    <section className="rounded-xl border border-slate-200">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-slate-200 px-3 py-2">
        <div>
          <h4 className="font-semibold text-slate-900">
            {dia != null && <span className="text-slate-400">Día {dia} · </span>}
            {esquema.material}
          </h4>
          <p className="text-xs text-slate-500">
            {esquema.proveedor || 'sin proveedor'}
            {esquema.espesorMm != null && ` · ${fmt(esquema.espesorMm, esquema.espesorMm % 1 ? 1 : 0)} mm`}
            {` · lámina ${fmt(plan.formato.largoMm)} × ${fmt(plan.formato.anchoMm)}`}
            {` · ${esquema.textura}${esquema.girable ? ' (gira)' : ' (no gira)'}`}
            {esquema.laminasPorPila != null && ` · pila de ${esquema.laminasPorPila}`}
          </p>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-4 text-sm">
          <span><b>{fmt(plan.laminas)}</b> tablero(s)</span>
          <span><b>{fmt(plan.areaLaminasM2, 2)}</b> m²</span>
          <span className={plan.desperdicioPct > meta ? (plan.metaInalcanzable ? 'text-slate-600' : 'text-amber-700') : 'text-emerald-700'}>
            D = <b>{fmt(plan.desperdicioPct, 3)} %</b>
            {plan.desperdicioPct <= meta
              ? ` ✓ meta ${fmt(meta)} %`
              : plan.metaInalcanzable
                ? ` · la meta de ${fmt(meta)} % no se puede cumplir con este volumen`
                : ` · sobre la meta de ${fmt(meta)} %`}
          </span>
          <span><b>{fmt(cortes.total)}</b> cortes</span>
          <span className="text-xs text-slate-400">
            mínimo teórico {fmt(plan.desperdicioMinimoPct, 3)} % con {fmt(plan.laminasMinimas)} · {fmt(plan.iteraciones)} combinaciones probadas
          </span>
        </div>
      </header>

      {plan.metaInalcanzable && (
        <p className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Las láminas se compran enteras, así que el desperdicio sube de golpe con cada una:
          estas piezas ocupan {fmt(plan.areaPiezasM2, 2)} m² y la lámina es de{' '}
          {fmt((plan.formato.largoMm * plan.formato.anchoMm) / 1e6, 2)} m². Con{' '}
          {fmt(plan.laminasMinimas)} lámina(s) —el mínimo posible— ya se pierde{' '}
          {fmt(plan.desperdicioMinimoPct, 2)} %. <b>No es el acomodo</b>: es el volumen. Se arregla
          agrupando más muebles de este material en la misma corrida.
        </p>
      )}

      {plan.noCaben.length > 0 && (
        <p className="border-b border-slate-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          No caben en esta lámina ni girando, quedan fuera del plan:{' '}
          {plan.noCaben.map((p) => `${p.etiqueta} ${fmt(p.largoMm, 1)}×${fmt(p.anchoMm, 1)} (${p.cantidad})`).join('; ')}
        </p>
      )}

      {plan.grupos.length > 0 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 border-b border-slate-200 px-3 py-2 text-xs text-slate-600">
          {plan.grupos.map((g) => (
            <li key={g.grupo} className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm border border-slate-400" style={{ background: colorDe(g.grupo) }} />
              <span className="font-medium">({g.grupo})</span> {g.etiqueta} · {fmt(g.largoMm, 1)} × {fmt(g.anchoMm, 1)} · {fmt(g.cantidad)} und
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
        {plan.patrones.map((p, i) => (
          <Lamina key={i} patron={p} largoMm={plan.formato.largoMm} anchoMm={plan.formato.anchoMm}
            material={esquema.material} dia={dia} />
        ))}
      </div>
    </section>
  );
}

function Lamina({ patron, largoMm, anchoMm, material, dia }: {
  patron: Patron; largoMm: number; anchoMm: number; material: string; dia?: number;
}) {
  // El texto se dibuja en mm, como el resto del esquema: a 2440 mm de ancho,
  // ~110 mm de cuerpo se leen bien a cualquier tamaño de pantalla.
  const cuerpo = Math.round(Math.min(largoMm, anchoMm) / 22);

  return (
    <figure className="rounded-lg border-2 border-slate-400 p-2">
      <figcaption className="mb-1 text-xs font-medium text-slate-700">
        {patron.repeticiones} de {fmt(largoMm)} x {fmt(anchoMm)}
        <span className="block text-[11px] font-normal text-slate-500">
          {dia != null && `Día ${dia} · `}{material}
        </span>
      </figcaption>

      <svg viewBox={`0 0 ${largoMm} ${anchoMm}`} className="w-full" role="img"
        aria-label={`Lámina con ${patron.colocaciones.length} piezas y ${fmt(patron.desperdicioPct, 3)} % de desperdicio`}>
        <rect x={0} y={0} width={largoMm} height={anchoMm} fill="#f8fafc" stroke="#475569" strokeWidth={6} />

        {patron.sobrantes.map((s, i) => (
          <rect key={`s${i}`} x={s.x} y={s.y} width={s.largoMm} height={s.anchoMm}
            fill={s.reutilizable ? '#e2e8f0' : '#f1f5f9'} stroke="#cbd5e1" strokeWidth={3}
            strokeDasharray={s.reutilizable ? undefined : '18 12'} />
        ))}

        {patron.colocaciones.map((c, i) => (
          <g key={`c${i}`}>
            <rect x={c.x} y={c.y} width={c.largoMm} height={c.anchoMm}
              fill={colorDe(c.grupo)} stroke="#334155" strokeWidth={4} />
            {c.largoMm > cuerpo * 2.2 && c.anchoMm > cuerpo * 1.6 && (
              <text x={c.x + cuerpo * 0.4} y={c.y + cuerpo * 1.1} fontSize={cuerpo} fill="#0f172a">({c.grupo})</text>
            )}
          </g>
        ))}
      </svg>

      <figcaption className="mt-1 flex items-baseline justify-between text-xs">
        <span className="font-medium text-slate-700">D = {fmt(patron.desperdicioPct, 3)}</span>
        <span className="text-slate-400">{patron.colocaciones.length} piezas · placa entera</span>
      </figcaption>
    </figure>
  );
}

/**
 * Resumen final: lo que hay que comprar y cortar en total, abierto por día y por
 * material, y lo que cuesta repartir la producción en jornadas.
 */
function Resumen({ plan, meta }: { plan: PlanCorte; meta: number }) {
  const extra = plan.consolidado.laminas - plan.proyectoCompleto.laminas;
  const c = plan.consolidado.cortes;

  return (
    <section className="rounded-2xl border-2 border-slate-900">
      <header className="rounded-t-2xl bg-slate-900 px-3 py-2">
        <h3 className="font-semibold text-white">Resumen del plan de corte</h3>
        <p className="text-xs text-slate-300">{plan.dias.length} día(s) a {fmt(plan.ritmo)} piezas por día</p>
      </header>

      <div className="space-y-4 p-3">
        <Totales titulo="Consolidado" totales={plan.consolidado} meta={meta} />

        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Cortes: <b>{fmt(c.total)}</b> = {fmt(c.refilado)} de refilado + {fmt(c.nivel1)} de 1.er nivel
          (franjas) + {fmt(c.nivel2)} de 2.º nivel (piezas) + {fmt(c.nivel3)} de 3.er nivel (recortes).
          Se cuentan por pasada de la seccionadora, así que las láminas de un mismo patrón que entran
          en una pila cuestan un solo juego de cortes. Es un modelo de la secuencia, no una medición:
          los niveles de la máquina siguen pendientes de confirmar con planta.
        </p>

        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Combinaciones: <b>{fmt(plan.consolidado.iteraciones)}</b> acomodos distintos evaluados para
          llegar a este plan, sumando cada material de cada día; el proyecto cortado de una sola vez
          probó {fmt(plan.proyectoCompleto.iteraciones)} más. Cada combinación cambia el orden de las
          piezas, su orientación y cómo se abren las franjas, y se conserva la que menos tableros
          gasta. Un material que llega al mínimo teórico para la búsqueda de inmediato: con 20
          combinaciones ya está en el mejor acomodo posible y seguir probando no puede mejorarlo.
        </p>

        <div>
          <h4 className="mb-1 text-sm font-semibold text-slate-800">Por día</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead><tr>
                <th className={th}>Día</th><th className={`${th} text-right`}>Piezas</th>
                <th className={`${th} text-right`}>Tableros</th><th className={`${th} text-right`}>m² tablero</th>
                <th className={`${th} text-right`}>m² netos</th><th className={`${th} text-right`}>Desperdicio</th>
                <th className={`${th} text-right`}>Cortes</th>
                <th className={`${th} text-right`}>Combinaciones</th><th className={th}>Materiales</th>
              </tr></thead>
              <tbody>
                {plan.dias.map((d) => (
                  <tr key={d.dia}>
                    <td className={`${td} font-medium`}>Día {d.dia}</td>
                    <td className={tdNum}>{fmt(d.piezas)}</td>
                    <td className={tdNum}>{fmt(d.totales.laminas)}</td>
                    <td className={tdNum}>{fmt(d.totales.areaLaminasM2, 2)}</td>
                    <td className={tdNum}>{fmt(d.totales.areaPiezasM2, 2)}</td>
                    <td className={`${tdNum} ${d.totales.desperdicioPct > meta ? 'text-amber-700' : ''}`}>{fmt(d.totales.desperdicioPct, 2)} %</td>
                    <td className={tdNum}>{fmt(d.totales.cortes.total)}</td>
                    <td className={tdNum}>{fmt(d.totales.iteraciones)}</td>
                    <td className={`${td} text-xs text-slate-500`}>{d.materiales.map((m) => m.material).join(', ')}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td className={td}>Total</td>
                  <td className={tdNum}>{fmt(plan.dias.reduce((s, d) => s + d.piezas, 0))}</td>
                  <td className={tdNum}>{fmt(plan.consolidado.laminas)}</td>
                  <td className={tdNum}>{fmt(plan.consolidado.areaLaminasM2, 2)}</td>
                  <td className={tdNum}>{fmt(plan.consolidado.areaPiezasM2, 2)}</td>
                  <td className={tdNum}>{fmt(plan.consolidado.desperdicioPct, 2)} %</td>
                  <td className={tdNum}>{fmt(plan.consolidado.cortes.total)}</td>
                  <td className={tdNum}>{fmt(plan.consolidado.iteraciones)}</td>
                  <td className={td} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="mb-1 text-sm font-semibold text-slate-800">Por material, sumando todos los días</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead><tr>
                <th className={th}>Material</th><th className={`${th} text-right`}>Tableros</th>
                <th className={`${th} text-right`}>m² tablero</th><th className={`${th} text-right`}>m² netos</th>
                <th className={`${th} text-right`}>m² perdidos</th><th className={`${th} text-right`}>Desperdicio</th>
                <th className={`${th} text-right`}>Cortes</th><th className={`${th} text-right`}>Combinaciones</th>
              </tr></thead>
              <tbody>
                {plan.porMaterial.map((f) => (
                  <tr key={f.material}>
                    <td className={`${td} font-medium`}>{f.material}</td>
                    <td className={tdNum}>{fmt(f.laminas)}</td>
                    <td className={tdNum}>{fmt(f.areaLaminasM2, 2)}</td>
                    <td className={tdNum}>{fmt(f.areaPiezasM2, 2)}</td>
                    <td className={tdNum}>{fmt(f.areaLaminasM2 - f.areaPiezasM2, 2)}</td>
                    <td className={`${tdNum} ${f.desperdicioPct > meta ? 'text-amber-700' : ''}`}>{fmt(f.desperdicioPct, 2)} %</td>
                    <td className={tdNum}>{fmt(f.cortes.total)}</td>
                    <td className={tdNum}>{fmt(f.iteraciones)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <b>Lo que cuesta repartir en jornadas.</b> Cortado día por día: {fmt(plan.consolidado.laminas)} tableros,{' '}
          {fmt(plan.consolidado.areaLaminasM2, 2)} m², {fmt(plan.consolidado.desperdicioPct, 2)} % de desperdicio y{' '}
          {fmt(plan.consolidado.cortes.total)} cortes. Todo el proyecto de una sola vez:{' '}
          {fmt(plan.proyectoCompleto.laminas)} tableros, {fmt(plan.proyectoCompleto.areaLaminasM2, 2)} m²,{' '}
          {fmt(plan.proyectoCompleto.desperdicioPct, 2)} % y {fmt(plan.proyectoCompleto.cortes.total)} cortes.{' '}
          {extra > 0
            ? `Separar la producción en días cuesta ${fmt(extra)} tablero(s) más, porque las piezas de días distintos no pueden compartir lámina.`
            : 'Repartir en días no cuesta tablero de más en este proyecto.'}
        </p>

        <p className={`rounded-lg border px-3 py-2 text-xs ${
          plan.consolidado.desperdicioPct <= meta
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
          <b>Meta de desperdicio: {fmt(meta)} %.</b>{' '}
          {plan.consolidado.desperdicioPct <= meta
            ? `El plan por días la cumple con ${fmt(plan.consolidado.desperdicioPct, 2)} %.`
            : plan.proyectoCompleto.desperdicioPct <= meta
              ? `El plan por días queda en ${fmt(plan.consolidado.desperdicioPct, 2)} %, sobre la meta, pero el proyecto cortado de una sola vez sí la cumple con ${fmt(plan.proyectoCompleto.desperdicioPct, 2)} %. Lo que la rompe es partir la producción en jornadas: menos días y más grandes bajan el desperdicio.`
              : `Ni por días (${fmt(plan.consolidado.desperdicioPct, 2)} %) ni todo junto (${fmt(plan.proyectoCompleto.desperdicioPct, 2)} %) se llega a la meta. Revisa arriba qué materiales la rompen: los marcados como inalcanzables son cuestión de volumen, no de acomodo.`}
        </p>
      </div>
    </section>
  );
}
