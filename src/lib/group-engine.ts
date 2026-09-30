import {
  calcularMueble,
  derivarVars,
  evalExpr,
  geoVars,
  IN2CM,
  type Breakdown,
  type CalcInput,
  type Pieza,
} from '@/lib/engine';

export type PreparedGroupMember = {
  calc: CalcInput;
  pref: string;
  codigoModulo?: string;
  omiteFondoSoloAgrupado?: boolean;
  permiteAgrupacion: boolean;
};

export type GroupCalculation = {
  lineas: Breakdown[];
  largoTotalIn: number;
  laterales: number;
  uniones: number;
  piezasContinuas: string[];
};

const mm = (inches: number) => inches * 25.4;
const near = (a: number, b: number, tolerance = 0.0001) => Math.abs(a - b) <= tolerance;

function longSideCm(formato: string | null | undefined): number | null {
  if (!formato) return null;
  const nums = formato.match(/\d+(?:[.,]\d+)?/g)?.map((v) => Number(v.replace(',', '.'))) ?? [];
  return nums.length >= 2 ? Math.max(nums[0], nums[1]) : null;
}

function evaluated(pieza: Pieza, calc: CalcInput) {
  const geo = geoVars(calc);
  const vars = derivarVars(calc.reglas, calc.dims, calc.overrides ?? {}, geo);
  const V = { ...calc.dims, ...geo, ...vars };
  return {
    cantidad: Number(evalExpr(pieza.formula_cantidad, V)),
    largo: Number(evalExpr(pieza.formula_largo, V)) - Number(pieza.resta_largo || 0),
    ancho: Number(evalExpr(pieza.formula_ancho, V)) - Number(pieza.resta_ancho || 0),
  };
}

function montajeFisico(pieza: Pieza) {
  const v = pieza.visualizacion ?? {};
  return JSON.stringify({
    plano: v.plano ?? null,
    intercambiar: v.intercambiar ?? false,
    x: v.x ?? null,
    y: v.y ?? null,
    z: v.z ?? null,
    giro: v.giro ?? null,
    funcion: v.funcion ?? null,
  });
}

function piezasHomologables(refs: Pieza[], members: PreparedGroupMember[]) {
  const base = evaluated(refs[0], members[0].calc);
  const baseRotated = !/\bL\b/.test(refs[0].formula_largo ?? '') && /\bL\b/.test(refs[0].formula_ancho ?? '');
  const baseSection = baseRotated ? base.largo : base.ancho;
  const baseCode = members[0].calc.preset[refs[0].rol_tablero] ?? '';
  return refs.slice(1).every((piece, i) => {
    const calc = members[i + 1].calc;
    const ev = evaluated(piece, calc);
    const rotated = !/\bL\b/.test(piece.formula_largo ?? '') && /\bL\b/.test(piece.formula_ancho ?? '');
    return near(ev.cantidad, base.cantidad)
      && near(rotated ? ev.largo : ev.ancho, baseSection)
      && (calc.preset[piece.rol_tablero] ?? '') === baseCode
      && JSON.stringify(piece.cantos ?? {}) === JSON.stringify(refs[0].cantos ?? {})
      && montajeFisico(piece) === montajeFisico(refs[0]);
  });
}

function assertCompatible(members: PreparedGroupMember[]) {
  if (members.length < 2) return;
  if (members.some((m) => !m.permiteAgrupacion)) {
    throw new Error('Uno de los tipos seleccionados no admite agrupación física.');
  }
  if (members.some((m) => (m.calc.modoFrentes ?? 'normal') === 'solo_frentes')) {
    throw new Error('Los módulos configurados como “solo frentes” no se pueden agrupar.');
  }

  const first = members[0].calc;
  for (const { calc } of members.slice(1)) {
    if (Math.abs(mm(calc.dims.P - first.dims.P)) > 0.5) {
      throw new Error('Los módulos de un grupo deben tener la misma profundidad física (tolerancia 0,5 mm).');
    }
    for (const rol of ['caja', 'refuerzo', 'fondo']) {
      const rolEstructural = [first, calc].some((input) => input.piezas.some((piece) =>
        piece.rol_tablero === rol
        && (piece.modo_agrupacion === 'continua'
          || piece.modo_agrupacion === 'continua_opcional'
          || piece.modo_agrupacion === 'lateral_compartido')));
      if (!rolEstructural) continue;
      if ((calc.preset[rol] ?? '') !== (first.preset[rol] ?? '')) {
        throw new Error(`Los módulos agrupados deben usar el mismo tablero de ${rol}.`);
      }
    }
    if ((calc.cantoCaja ?? '') !== (first.cantoCaja ?? '')) {
      throw new Error('Los módulos agrupados deben usar el mismo canto de caja.');
    }
    if (!near(calc.margen, first.margen)) {
      throw new Error('Los módulos agrupados deben usar la misma política de margen.');
    }
    const frontA = calc.tablerosByCode[calc.preset.frente ?? ''];
    const frontB = first.tablerosByCode[first.preset.frente ?? ''];
    if (Number(frontA?.espesor_mm ?? 0) !== Number(frontB?.espesor_mm ?? 0)) {
      throw new Error('Los frentes pueden tener materiales distintos, pero deben conservar el mismo espesor.');
    }
  }
}

export function calcularGrupoFisico(members: PreparedGroupMember[]): GroupCalculation {
  if (members.length === 0) throw new Error('El grupo no contiene módulos.');

  const n = members.length;
  const totalL = members.reduce((sum, m) => sum + m.calc.dims.L, 0);
  const firstIndividual = members[0].calc;
  if (n === 1) {
    return {
      lineas: [calcularMueble(firstIndividual)],
      largoTotalIn: totalL,
      laterales: 2,
      uniones: 0,
      piezasContinuas: [],
    };
  }
  members = members.map((member) => member.omiteFondoSoloAgrupado ? {
    ...member,
    calc: {
      ...member.calc,
      piezas: member.calc.piezas
        .filter((piece) => piece.nombre !== 'fondo')
        .map((piece) => piece.nombre === 'base'
          ? { ...piece, formula_ancho: 'P-TC' }
          : piece),
    },
  } : member);
  assertCompatible(members);
  const first = members[0].calc;
  const caja = first.tablerosByCode[first.preset.caja ?? ''];
  const tc = Number(caja?.espesor_mm ?? 0) / 25.4;
  if (!(tc > 0)) throw new Error('No se pudo determinar el espesor del tablero de caja.');

  const formatos = new Set<string>();
  for (const member of members) {
    const structuralCodes = member.calc.piezas
      .filter((p) => p.modo_agrupacion === 'continua' || p.modo_agrupacion === 'continua_opcional' || p.modo_agrupacion === 'lateral_compartido')
      .map((p) => member.calc.preset[p.rol_tablero])
      .filter(Boolean);
    for (const code of structuralCodes) {
      const format = member.calc.tablerosByCode[code]?.formato;
      if (format) formatos.add(format);
    }
  }
  const maxBoardCm = Math.min(...[...formatos].map(longSideCm).filter((v): v is number => v != null));
  if (Number.isFinite(maxBoardCm) && totalL * IN2CM > maxBoardCm + 0.001) {
    throw new Error(`El grupo mide ${(totalL * IN2CM).toFixed(2)} cm y supera el largo disponible del tablero (${maxBoardCm} cm).`);
  }

  // Solo se continúan las piezas estructurales presentes en todos los módulos.
  // Una tapa, fondo o refuerzo adicional de una tipología no debe impedir una
  // agrupación válida: esa pieza conserva su fabricación local.
  const mandatorySets = members.map(({ calc }) => new Set(
    calc.piezas.filter((p) => p.modo_agrupacion === 'continua').map((p) => p.clave_fusion || p.nombre),
  ));
  const continuousKeys = new Set(
    [...mandatorySets[0]].filter((key) => mandatorySets.slice(1).every((keys) => keys.has(key))),
  );

  const optionalKeys = new Set(members.flatMap(({ calc }) => calc.piezas
    .filter((p) => p.modo_agrupacion === 'continua_opcional')
    .map((p) => p.clave_fusion || p.nombre)));
  for (const key of optionalKeys) {
    const refs = members.map(({ calc }) => calc.piezas.find((p) => p.modo_agrupacion === 'continua_opcional' && (p.clave_fusion || p.nombre) === key));
    if (refs.every((piece): piece is Pieza => Boolean(piece)) && piezasHomologables(refs, members)) continuousKeys.add(key);
  }

  for (const key of continuousKeys) {
    const refs = members.map(({ calc }) => calc.piezas.find((p) => (p.modo_agrupacion === 'continua' || p.modo_agrupacion === 'continua_opcional') && (p.clave_fusion || p.nombre) === key));
    if (refs.some((p) => !p)) throw new Error(`No se puede homologar la pieza continua “${key}”.`);
    const base = evaluated(refs[0]!, first);
    const baseRotated = !/\bL\b/.test(refs[0]!.formula_largo ?? '') && /\bL\b/.test(refs[0]!.formula_ancho ?? '');
    const baseSection = baseRotated ? base.largo : base.ancho;

    refs.slice(1).forEach((piece, i) => {
      const ev = evaluated(piece!, members[i + 1].calc);
      const isRotated = !/\bL\b/.test(piece!.formula_largo ?? '') && /\bL\b/.test(piece!.formula_ancho ?? '');
      const evSection = isRotated ? ev.largo : ev.ancho;
      if (!near(evSection, baseSection)) {
        throw new Error(`La pieza continua “${key}” cambia de sección entre módulos.`);
      }
      const baseCode = first.preset[refs[0]!.rol_tablero] ?? '';
      const memberCode = members[i + 1].calc.preset[piece!.rol_tablero] ?? '';
      if (baseCode !== memberCode || JSON.stringify(piece!.cantos ?? {}) !== JSON.stringify(refs[0]!.cantos ?? {})) {
        throw new Error(`La pieza continua “${key}” no conserva material y canto homogéneos.`);
      }
    });
  }

  const shares: number[] = [];
  let allocatedShare = 0;
  for (let index = 0; index < n; index += 1) {
    const share = index === n - 1 ? 1 - allocatedShare : members[index].calc.dims.L / totalL;
    shares.push(share);
    allocatedShare += share;
  }

  const lineas = members.map(({ calc }, index) => {
    const share = shares[index];
    const piezas = calc.piezas.map<Pieza>((piece) => {
      if (piece.modo_agrupacion === 'lateral_compartido') {
        const original = evaluated(piece, calc).cantidad;
        if (!near(original, 2)) throw new Error('La plantilla lateral agrupable debe declarar exactamente dos laterales.');

        let discount = 0;
        const currentHeight = calc.dims.A;

        // Descuento en la unión izquierda (con index - 1)
        if (index > 0) {
          const leftHeight = members[index - 1].calc.dims.A;
          if (Math.abs(currentHeight - leftHeight) <= 0.0001) {
            discount += 0.5;
          } else if (currentHeight < leftHeight) {
            discount += 1.0;
          }
        }

        // Descuento en la unión derecha (con index + 1)
        if (index < n - 1) {
          const rightHeight = members[index + 1].calc.dims.A;
          if (Math.abs(currentHeight - rightHeight) <= 0.0001) {
            discount += 0.5;
          } else if (currentHeight < rightHeight) {
            discount += 1.0;
          }
        }

        const allocated = Math.max(0, 2 - discount);
        return { ...piece, formula_cantidad: String(allocated) };
      }
      const key = piece.clave_fusion || piece.nombre;
      const isContinuous = (piece.modo_agrupacion === 'continua' || piece.modo_agrupacion === 'continua_opcional')
        && continuousKeys.has(key);
      if (!isContinuous) {
        const isLocalWidth = (piece.modo_agrupacion === 'local' || piece.modo_agrupacion === 'continua_opcional')
          && /\bL\b/.test(piece.formula_largo ?? '')
          && !/(frente|puerta)/i.test(piece.nombre);
        if (!isLocalWidth) return piece;
        // Cada unión libera un espesor. Se reparte medio espesor a cada
        // compartimento vecino: extremos +TC/2, interiores +TC.
        const contacts = index === 0 || index === n - 1 ? 1 : 2;
        const original = evaluated(piece, calc);
        return { ...piece, formula_largo: String(original.largo + contacts * tc / 2), resta_largo: 0 };
      }

      const representative = first.piezas.find((p) => (p.modo_agrupacion === 'continua' || p.modo_agrupacion === 'continua_opcional') && (p.clave_fusion || p.nombre) === key)!;
      const groupQuantity = Math.max(...members.map(({ calc: memberCalc }) => {
        const match = memberCalc.piezas.find((p) => (p.modo_agrupacion === 'continua' || p.modo_agrupacion === 'continua_opcional') && (p.clave_fusion || p.nombre) === key)!;
        return evaluated(match, memberCalc).cantidad;
      }));
      const groupVars = { ...first.dims, ...geoVars(first), LG: totalL, TC: tc };
      const length = Number(evalExpr(representative.formula_largo_grupo, groupVars));
      if (!(length > 0)) throw new Error(`La fórmula agrupada de “${key}” produjo un largo inválido.`);
      const isRotated = !/\bL\b/.test(piece.formula_largo ?? '') && /\bL\b/.test(piece.formula_ancho ?? '');
      return {
        ...piece,
        formula_cantidad: String(groupQuantity * share),
        formula_largo: isRotated ? piece.formula_largo : String(length),
        formula_ancho: isRotated ? String(length) : piece.formula_ancho,
        resta_largo: 0,
        tarugos: Number(piece.tarugos || 0) * ((n + 1) / 2),
      };
    });

    const breakdown = calcularMueble({ ...calc, piezas });
    const modulo = `A${index + 1} ${members[index].codigoModulo ?? members[index].pref}`;
    const grupo = `Grupo A (${members.map((_, i) => `A${i + 1}`).join(' + ')})`;
    breakdown.piezas = breakdown.piezas.map((row) => {
      const plantilla = piezas.find((p) => p.nombre === row.pieza);
      const key = plantilla?.clave_fusion || plantilla?.nombre;
      const compartida = plantilla?.modo_agrupacion === 'lateral_compartido'
        || (key != null && continuousKeys.has(key));
      return { ...row, origen: compartida ? grupo : modulo, compartida, claveFusion: compartida ? key : undefined };
    });
    return breakdown;
  });

  return {
    lineas,
    largoTotalIn: totalL,
    laterales: n + 1,
    uniones: Math.max(0, n - 1),
    piezasContinuas: [...continuousKeys],
  };
}
