# Beta iPhone de TARDEA

Esta version usa Capacitor para empaquetar la web de TARDEA como app iOS.

## Preparar en Mac

1. Instala Xcode desde el App Store.
2. Descarga o actualiza el repositorio de TARDEA.
3. Ejecuta:

```bash
npm install
npm run ios:sync
npm run ios:open
```

## Configurar Xcode

1. Abre el proyecto `ios/App/App.xcworkspace`.
2. En `Signing & Capabilities`, selecciona tu equipo de Apple Developer.
3. Revisa estos datos:
   - Bundle ID: `com.tardea.app`
   - App name: `TARDEA.`
   - Web cargada: `https://www.tardea.com`
4. Sube el numero de build cuando vayas a mandar una nueva beta.

## Subir a TestFlight

1. En Xcode, selecciona `Any iOS Device`.
2. Ve a `Product > Archive`.
3. Cuando termine, pulsa `Distribute App`.
4. Elige `App Store Connect`.
5. Sube la build.
6. En App Store Connect, crea la app y activa TestFlight.

## Importante

- Si `SITE_PASSWORD` sigue activo en Vercel, la app tambien pedira esa clave al abrir.
- Como la app carga la web de produccion, cada cambio subido a Vercel se vera dentro de la app sin tener que reenviar una build, salvo cambios nativos como icono, permisos o configuracion iOS.
