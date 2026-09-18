# Voladizo de la puerta con gola en la visualización

## Regla

En un mueble con sistema de frente gola (`SM`) la puerta se corta **más alta que
la carcasa**. Para `W` la migración `0045_w_sm_hoja_real.sql` fija
`frente.formula_ancho = 'gola ? A+0.62402 : A-RV'`, es decir `A + 15.85 mm`.

Ese sobrante no es un error de corte: es el **agarre**. En un mueble superior la
puerta se toma por debajo, así que el excedente **cuelga bajo la base** y el
canto superior queda a ras de la tapa.

## Qué hacía antes

`construirVisualizacion()` apilaba las puertas desde `foot` (la base) hacia
arriba, sin distinguir gola. Para `W2936-SM`:

| | z inferior | alto | z superior | carcasa |
| --- | ---: | ---: | ---: | ---: |
| Antes | 0.0 | 930.2 | **930.2** | 0 – 914.4 |
| Ahora | **−15.8** | 930.2 | 914.4 | 0 – 914.4 |

La puerta sobresalía 15.8 mm **por encima de la tapa**, que es justo al revés de
como se fabrica. En la vista lateral del Simulador se veía el frente asomando
sobre el mueble en vez de formar el agarre inferior.

Como efecto secundario, la escena disparaba el aviso *"la fachada necesita
distribución específica por niveles"*: el apilado superaba `A+4` por el voladizo
mal orientado. El aviso ya no aparece en este caso.

## Implementación

En `src/lib/visualizacion.ts`, tras repartir las puertas en filas:

```ts
const voladizoGola = vars.gola && doorRows.length
  ? Math.max(0, doorZ - 3.2 - foot - innerH)
  : 0;
if (voladizoGola) for (const [key, slot] of doorSlots) doorSlots.set(key, {...slot, z: slot.z - voladizoGola});
```

El desplazamiento solo se aplica cuando `gola=1` **y** la pila de puertas excede
`innerH`; con `gola=0` la geometría no cambia. El aviso de fachada se evalúa ya
descontando el voladizo.

## Alcance y límite conocido

Hoy solo `W` tiene fórmula de puerta condicional a gola, así que es el único tipo
con voladizo. La dirección **hacia abajo** corresponde a la gola de un mueble
**superior**.

⚠️ En un mueble **base** la gola va arriba (la puerta se toma por encima, bajo el
mesón), de modo que el excedente debería subir, no bajar. Si más adelante se
añade una fórmula de puerta con gola a un tipo base (`B`, `BFD`, `SBFD`…), esta
regla debe volverse dependiente de la familia — hoy no hay hoja real que lo
respalde y aplicarla a ciegas invertiría el agarre.

Los frentes de gaveta (`frente_gaveta`) siguen otro camino: `drawerSlots` ya
reserva 53.6 mm de gola repartiendo desde la tapa hacia abajo, y no se tocó.

## Cobertura

`tests/visualizacion.test.ts` verifica con `W` que, con `gola=1`, cada puerta es
más alta que la carcasa, su canto superior queda a ras de la tapa y su `z` es
negativa; y que con `gola=0` la puerta sigue apoyada en `z=0`.

Ver también [w_sm_hoja_real.md](w_sm_hoja_real.md) y
[variantes_frente_gola_sm.md](variantes_frente_gola_sm.md).
