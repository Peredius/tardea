# Recopilacion de fuentes para TARDEA Scout

Objetivo: detectar tardeos, rooftops, brunches y afterworks reales, meterlos como candidatos y revisarlos en Admin antes de publicarlos.

## Prioridad 1

- Fourvenues: discotecas, promotoras, tardeos, reservas y entradas.
- Fever: brunch, rooftops, terrazas, afterwork y planes con amigos.
- Xceed: clubbing, discotecas, electronica y eventos de salas.
- Entradium: tardeos independientes, fiestas recurrentes y salas medianas.
- Instagram: descubrimiento temprano de fiestas, pero siempre manual y sin copiar creatividades.

## Prioridad 2

- Eventbrite: afterwork, networking, rooftops profesionales.
- Meetup: comunidades, social drinks, rooftops y planes para conocer gente.
- Resident Advisor: electronica, techno, house y clubs.
- Shotgun: electronica, festivales, promotoras y clubs.
- Webs propias de salas y rooftops.

## Prioridad 3

- DICE: conciertos, club nights y musica en vivo.
- Wegow: conciertos/festivales; usar solo cuando encaje con tardeo o afterwork.
- Somo Social: eventos sociales, afterworks y rooftops pequenos.

## Reglas editoriales

- No copiar imagenes de tiqueteras, Instagram o webs externas.
- No copiar descripciones largas. Reescribir resumen propio de TARDEA.
- Guardar siempre `source_url` para revision.
- Todo entra como pendiente: `pending`, `published: false`, `needs_review: true`.
- Si el promotor reclama el evento, sustituimos imagen provisional por material oficial.

## Busquedas semanales recomendadas

```txt
site:site.fourvenues.com/es Madrid tardeo
site:site.fourvenues.com/es Madrid brunch
site:feverup.com/es/madrid rooftop
site:feverup.com/es/madrid afterwork
site:xceed.me/es/madrid/events club Madrid
site:entradium.com Madrid tardeo
site:eventbrite.es Madrid afterwork rooftop
site:meetup.com Madrid rooftop drinks
site:ra.co/events/es/Madrid techno
site:shotgun.live Madrid Fabrik
#tardeomadrid #rooftopmadrid #brunchmadrid #afterworkmadrid
```

## Como usarlo

La lista estructurada esta en `scripts/scout-platforms.json`. Las URLs concretas de eventos se meten en `scripts/scout-sources.json` y se prueban con:

```bash
npm run scout-events -- --dry-run
```

Despues de revisar:

```bash
npm run scout-events
```