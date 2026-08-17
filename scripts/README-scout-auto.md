# TARDEA Scout automatico

El flujo automatico tiene dos pasos:

1. Descubrir candidatos en tiqueteras y buscadores.
2. Importarlos a Admin como pendientes de revision.

## 1. Configurar busqueda automatica

Necesitas una API de busqueda. La primera version usa Serper.

En `.env.local`:

```txt
SERPER_API_KEY=tu_clave
```

## 2. Probar busquedas sin consultar Google

```bash
npm run scout-discover -- --dry-run
```

Si no hay `SERPER_API_KEY`, este comando ensena todas las busquedas que haria.

## 3. Descubrir candidatos automaticamente

```bash
npm run scout-discover
```

Genera:

```txt
scripts/scout-sources.generated.json
```

Solo incluye candidatos con fecha detectada, salvo que uses `--include-undated`.

## 4. Importar candidatos a Admin

```bash
npm run scout-events -- --sources=scripts/scout-sources.generated.json
```

Entran como pendientes, con imagen provisional y fuente original.

## 5. Pipeline completo

```bash
npm run scout-auto
```

Hace descubrir + importar.

## Filtros utiles

```bash
npm run scout-discover -- --priority=1
npm run scout-discover -- --platform=Fever
npm run scout-discover -- --limit-per-query=3 --max-results=50
npm run scout-discover -- --include-undated
```

## Importante

- Instagram se queda como fuente manual/semi-manual. No conviene scrapearlo agresivamente.
- No se copian imagenes externas.
- No se publica nada directamente.
- El Admin sigue siendo el filtro editorial.