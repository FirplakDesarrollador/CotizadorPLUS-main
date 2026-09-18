---
description: Despliega cambios de la rama Andrés a DEV realizando commit, push, PR y merge, con validación obligatoria de compilación y Vercel.
---

# Deploy to DEV Workflow (Vercel Validation)
 
Este workflow asegura que solo el código que compila correctamente llegue a la rama `DEV`. Incluye una fase de auto-corrección en caso de fallos en el despliegue.
 
## Pasos
 
### 1. Validación Local Obligatoria
Antes de subir cambios, se debe asegurar que el build de Next.js pase localmente.
// turbo
```powershell
npm run build
```
> [!CAUTION]
> Si el build falla, **NO CONTINUES**. Lee el error en la terminal, corrige el código y vuelve a ejecutar este paso hasta que el build sea exitoso.
 
### 2. Commit y Push a la rama Andrés
Consolida los cambios validados localmente.
// turbo
```powershell
git add .
git commit -m "deploy: cambios validados localmente, listos para PR"
git push origin Andrés
```
 
### 3. Gestión del Pull Request (PR)
1. Crea el PR usando `mcp_github-mcp-server_create_pull_request`.
   - `head`: "Andrés", `base`: "DEV"
2. Monitorea el estado del PR con `mcp_github-mcp-server_get_pull_request_status`.
3. **Validación con Vercel**:
   - Localiza el check de Vercel en la lista de estados.
   - Si el estado es `failure` o `error`:
     - Identifica la causa del fallo.
     - Aplica las correcciones en el código.
     - **Reinicia el workflow desde el Paso 1**.
   - Si el estado es `success`: Continúa al Paso 4.
 
### 4. Merge a la rama DEV
Una vez que Vercel confirma que el deployment es correcto, realiza el merge.
**Herramienta**: `mcp_github-mcp-server_merge_pull_request`
 
### 5. Sincronización Final
Actualiza tu entorno local con los cambios ya integrados en `DEV`.
// turbo
```powershell
git checkout DEV
git pull origin DEV
git checkout Andrés
```
 
### 6. Reporte
Informa al usuario que el despliegue fue exitoso y verificado por Vercel.
