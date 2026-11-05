export function nombreProyectoPipeline(nombre:string|null,codigoOrigen:string|null) {
 if(!nombre||!codigoOrigen?.trim())return nombre;
 const escaped=codigoOrigen.trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const limpio=nombre.trim().replace(new RegExp(`^${escaped}\\s*[-–—:]\\s*`,'i'),'').trim();
 return limpio||nombre;
}
