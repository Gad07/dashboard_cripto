Ejemplos y guía sobre variables de entorno (.env)

Este fichero explica las variables de entorno opcionales que puede usar la app y contiene un ejemplo para copiar a `.env`.

Ejemplo de `.env` (copia esto a la raíz del proyecto en un fichero llamado `.env`):

```
# Tu API key privada de CoinGecko (opcional). NO subas este fichero al repositorio.
# Ejemplo: VITE_COINGECKO_API_KEY=CG-XXXXXXXXXXXXXXXXXXXX
VITE_COINGECKO_API_KEY=

# Forzar un root de API distinto (útil si usas un proxy propio en desarrollo).
# Debe apuntar al root de la API sin / final, por ejemplo: https://mi-proxy.local
VITE_COINGECKO_API_ROOT=

# Indica si usar el endpoint PRO de CoinGecko ("true" | "false").
VITE_COINGECKO_USE_PRO_API=false

# Intervalo de auto-refresh (polling) en milisegundos. Poner 0 para desactivar.
# Recomendado: 30000 (30s) - 60000 (60s).
VITE_AUTO_REFRESH_MS=30000
```

Notas de seguridad y buenas prácticas

- Nunca comitees `.env` en repositorios públicos. Añade `.env` a tu `.gitignore` local.
- En producción usa los mecanismos de secretos del proveedor (Vercel, Netlify, Cloud Run, etc.).
- Si necesitas evitar CORS durante desarrollo, la configuración de Vite en este proyecto reexpone CoinGecko en `/api/coingecko`.

Tip rápido: para leer las variables dentro del código usa `import.meta.env.VITE_COINGECKO_API_KEY` (ver `src/env.d.ts` para las declaraciones de tipo).
