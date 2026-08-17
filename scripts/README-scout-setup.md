# Puesta en marcha de TARDEA Scout automatico

## 1. Crear la clave de busqueda

El agente automatico necesita una clave de Serper para consultar Google de forma ordenada.

1. Entra en `https://serper.dev/`.
2. Crea una cuenta.
3. Copia tu API Key.
4. Pegala en `.env.local`:

```txt
SERPER_API_KEY=tu_clave
```

## 2. Comprobar que todo esta configurado

```bash
npm run scout-check
```

Debe marcar OK en:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SERPER_API_KEY`
- archivos Scout

## 3. Ver que busquedas haria

```bash
npm run scout-discover -- --dry-run --priority=1
```

## 4. Buscar candidatos reales

```bash
npm run scout-discover -- --priority=1 --limit-per-query=3 --max-results=50
```

Esto genera:

```txt
scripts/scout-sources.generated.json
```

## 5. Revisar antes de importar

Abre `scripts/scout-sources.generated.json` y mira si hay cosas raras.

## 6. Subir a Admin como pendientes

```bash
npm run scout-events -- --sources=scripts/scout-sources.generated.json
```

## 7. Automatico completo

```bash
npm run scout-auto
```

Recomendacion: al principio usa pasos separados, no `scout-auto`, para controlar calidad.