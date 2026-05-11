# TardeoMadrid Pro · Next.js

Versión profesional base del proyecto de buscador de tardeos en Madrid.

## Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Componentes reutilizables
- Datos demo centralizados en `lib/data.ts`

## Incluye
- Home premium
- Bloque hero con propuesta de valor
- Eventos destacados
- Buscador con filtros: fecha, tipo, música, edad, precio y zona
- Fichas dinámicas por evento: `/eventos/[slug]`
- Base visual preparada para SEO y monetización

## Cómo arrancarlo
```bash
npm install
npm run dev
```

## Variables de entorno
Configura estas variables en `.env.local` y tambien en Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_publica
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_solo_servidor
```

Para el acceso de usuarios con Google y Apple, activa ambos proveedores en
Supabase Auth y anade como URL de retorno:

```bash
https://tu-dominio.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

## Siguiente fase recomendada
1. Conectar Supabase/PostgreSQL
2. Crear panel admin para eventos
3. Añadir mapa con Mapbox
4. Crear páginas SEO por barrio, música y fecha
5. Integrar ticketing externo
6. Sistema de destacados / patrocinados

## Estructura
- `app/` rutas y páginas
- `components/` bloques reutilizables
- `lib/data.ts` catálogo demo y tipos

## Notas
Las imágenes están referenciadas desde Unsplash para que el diseño se vea premium desde el primer momento.
