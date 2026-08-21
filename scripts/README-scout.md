# TARDEA Scout

Sistema para cargar candidatos de tardeos, rooftops, brunches y afterworks desde tiqueteras, webs o pistas de Instagram.

## Flujo correcto

1. Anadir candidatos en `scripts/scout-sources.json`.
2. Probar sin tocar Supabase:

```bash
npm run scout-events -- --dry-run
```

3. Importar a la cola editorial:

```bash
npm run scout-events
```

4. Revisar en `/admin`, editar datos, cambiar imagen si procede y aprobar.

## Reglas importantes

- No se copian imagenes originales de tiqueteras o Instagram.
- El agente usa imagenes provisionales de TARDEA en `public/scout-covers`.
- Todo entra como `pending`, `published: false`, `needs_review: true`.
- La fuente original queda guardada en `source_url` para revision.
- Si el promotor reclama el evento, se podra sustituir la imagen y completar la ficha oficial.

## Filtros utiles

```bash
npm run scout-events -- --dry-run --platform=Fourvenues
npm run scout-events -- --dry-run --type=Rooftop
npm run scout-events -- --dry-run --city=Madrid --limit=5
```

## Segmentos recomendados

- Tipo: Tardeo, Rooftop, Brunch, Afterwork.
- Musica: Comercial, Indie, Electronica, Reguetón, Flamenquito, Pop, Remember, Show en directo.
- Zona: barrio o municipio.
- Fuente: ticketing, Instagram, website, manual.
