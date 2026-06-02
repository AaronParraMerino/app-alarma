# Neuro Wake

Neuro Wake es una aplicacion movil de alarma desarrollada con Expo y React Native. Su objetivo es ayudar al usuario a despertarse mediante alarmas que pueden requerir la resolucion de misiones cognitivas, visuales o fisicas antes de detenerse.

La aplicacion incluye autenticacion, historial de misiones, estadisticas, rachas, sincronizacion con Supabase, almacenamiento local y soporte para tema claro/oscuro e idioma espanol/ingles.

## Caracteristicas principales

- Creacion, edicion, activacion y eliminacion de alarmas.
- Alarmas normales o con misiones configuradas.
- Ejecucion real de alarmas en Android mediante notificaciones, sonido y pantalla de alarma.
- Misiones disponibles:
  - Matematicas.
  - Completar palabras.
  - Movimiento.
  - Figuras y colores.
  - Color diferente.
  - Detectar objetos.
  - Encontrar pares.
  - Cultura general.
  - Misiones aleatorias.
- Historial de misiones y estadisticas.
- Sistema de rachas.
- Modo invitado y usuario autenticado.
- Sincronizacion local/nube con SQLite y Supabase.
- Preferencias de apariencia e idioma.
- Soporte para APK interno y AAB de produccion mediante EAS.

## Tecnologias utilizadas

- Expo SDK 55.
- React Native 0.83.
- React 19.
- TypeScript.
- Expo SQLite.
- Expo Notifications.
- Expo Audio.
- Expo Camera.
- Expo Sensors.
- React Navigation.
- Supabase.
- Zustand.
- EAS Build.

## Requisitos

Antes de ejecutar el proyecto se necesita:

- Node.js instalado.
- npm instalado.
- Expo CLI/EAS CLI disponible mediante `npx` o instalado globalmente.
- Cuenta y proyecto de Supabase configurado.
- Dispositivo Android fisico para probar alarmas reales, sensores, camara y notificaciones.

## Instalacion

Clonar el repositorio e instalar dependencias:

```bash
npm install
```

## Variables de entorno

Crear un archivo `.env` en la raiz del proyecto con las variables necesarias:

```env
EXPO_PUBLIC_SUPABASE_URL=tu_url_de_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
EXPO_PUBLIC_GOOGLE_REDIRECT=tu_redirect_opcional_para_google
```

Las variables obligatorias para la conexion con Supabase son:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

`EXPO_PUBLIC_GOOGLE_REDIRECT` se usa para el flujo de autenticacion con Google o recuperacion cuando se requiere un redirect personalizado.

## Ejecucion en desarrollo

Iniciar el servidor de Expo:

```bash
npm start
```

Ejecutar en Android con build nativo local:

```bash
npm run android
```

Ejecutar en web:

```bash
npm run web
```

> Nota: para validar correctamente alarmas, permisos, pantalla completa, sonidos, sensores y camara, no es suficiente depender solo de Expo Go. Se recomienda probar en APK o dev build.

## Builds con EAS

El proyecto usa `eas.json` con tres perfiles principales:

### APK interno para pruebas

Genera un APK instalable directamente en un celular Android:

```bash
eas build -p android --profile preview
```

Este perfil es el recomendado para pruebas internas, defensa y validacion en dispositivos fisicos.

### Build de desarrollo

Genera una build con development client:

```bash
eas build -p android --profile development
```

### Produccion para Play Store

Genera un Android App Bundle (`.aab`) para publicar en Google Play:

```bash
eas build -p android --profile production
```

> Importante: el perfil `production` genera un `.aab`, no un APK. Para instalar directamente en un celular se debe usar el perfil `preview`.

## Base de datos

La aplicacion usa Supabase como backend remoto y SQLite como almacenamiento local.

Tablas principales utilizadas:

- `profiles`
- `alarms`
- `missions_history`
- `word_completion_words`

Tambien existen migraciones de referencia en:

```text
src/shared/db/migrations
```

Estas migraciones sirven como documentacion del esquema esperado. Si la base de datos real se administra manualmente desde Supabase SQL Editor, se deben aplicar los cambios necesarios directamente desde la consola de Supabase.

## Estructura del proyecto

```text
src/
  features/
    alarm/          Funcionalidad de alarmas
    auth/           Autenticacion y recuperacion de cuenta
    history/        Historial y estadisticas de misiones
    missions/       Misiones disponibles
    profile/        Perfil de usuario
    settings/       Ajustes de idioma y apariencia
    streak/         Sistema de rachas
  navigation/       Navegacion principal
  shared/
    components/     Componentes reutilizables
    db/             Base local, Supabase y migraciones
    i18n/           Idioma
    services/       Servicios compartidos
    theme/          Tema visual
```

## Verificacion del proyecto

Comprobar TypeScript:

```bash
npx tsc --noEmit
```

Revisar configuracion Expo:

```bash
npx expo-doctor
```

## Pruebas recomendadas

Para validar la aplicacion se recomienda probar:

- Instalacion del APK generado con EAS.
- Creacion, edicion y eliminacion de alarmas.
- Alarma sin mision configurada.
- Alarma con una mision.
- Alarma con varias misiones.
- Alarma con mision aleatoria.
- Ejecucion con pantalla bloqueada y desbloqueada.
- Resolucion de cada tipo de mision.
- Contador de errores y boton de emergencia.
- Registro de historial y estadisticas.
- Funcionamiento de rachas.
- Cambio de idioma espanol/ingles.
- Cambio de tema claro/oscuro.
- Uso autenticado y modo invitado.
- Uso con internet y sin internet.
- Sincronizacion posterior con Supabase.

## Notas importantes

- Las funciones nativas de alarma en Android dependen de permisos como notificaciones, vibracion, alarma exacta, wake lock y full screen intent.
- En algunos dispositivos Android puede ser necesario permitir manualmente alarmas exactas, notificaciones o ejecucion en segundo plano.
- La mision de deteccion de objetos requiere permisos de camara.
- La mision de movimiento requiere sensores del dispositivo.
- Para resultados confiables, las pruebas principales deben hacerse en un celular Android fisico.

## Estado del proyecto

Neuro Wake se encuentra en etapa de desarrollo academico. El enfoque actual es validar la funcionalidad principal de alarmas con misiones, persistencia local, sincronizacion con Supabase y ejecucion real mediante APK Android.
