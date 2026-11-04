---
description: Crea un git worktree en .worktrees/ a partir de un nombre o descripcion
---

El argumento recibido es: "$ARGUMENTS"

1. Deriva de ese texto un nombre valido para carpeta y rama: minusculas, sin
   espacios (usa guiones medios), sin caracteres especiales, corto y descriptivo
   segun el contexto. Si el argumento trae espacios o comillas, trata todo el
   texto como una sola frase, no como varios argumentos.
2. Ejecuta unicamente este comando, una sola vez:
   git worktree add .worktrees/<nombre-derivado>
3. No cambies de directorio, no crees ramas adicionales, no hagas nada mas.
   Muestra solo la salida del comando y el nombre usado.
