# Almacenamiento de imagenes IKA en Google Drive

## Objetivo

Trasladar a una carpeta normal de `Mi unidad` de la cuenta Google de IKA todas las fotografias utilizadas por la plataforma. Las cargas nuevas seran optimizadas y enviadas automaticamente a Drive; la web conservara la misma presentacion y leera los archivos desde Drive.

## Alcance

Se incluyen:

- Portadas de noticias y eventos.
- Imagenes de paginas publicas.
- Fotografias de paises y dojos.
- Fotografias de instructores oficiales.
- Fotografias de perfil de kenshis.
- Fotografias historicas almacenadas actualmente en `public/images`.
- Imagenes actuales guardadas en Supabase Storage o referenciadas desde la base de datos.

El logotipo IKA, iconos, banderas de reserva y otros recursos tecnicos pequenos seguiran empaquetados con la aplicacion.

## Autorizacion y propiedad

La integracion usara OAuth 2.0 con acceso offline sobre la cuenta Google de IKA. El usuario realizara una unica autorizacion inicial desde el panel de super admin. Los archivos creados perteneceran a esa cuenta y consumiran su cuota de `Mi unidad`.

El cliente OAuth y la clave de cifrado se guardaran como secretos de Vercel. El token de renovacion se guardara cifrado en una tabla privada de Supabase, accesible exclusivamente desde el servidor con la clave de servicio. Ningun token se enviara al navegador.

## Estructura de Drive

Tras la autorizacion, el servidor creara o reutilizara esta jerarquia:

```text
IKA Web Media/
  Public/
    News/
    Events/
    Pages/
    Countries and Dojos/
    Instructors/
    Archive/
  Private/
    Kenshi Profiles/
```

La base de datos guardara el ID de cada archivo, su categoria, tipo MIME, dimensiones, visibilidad, origen anterior y, cuando corresponda, el miembro propietario.

## Procesamiento de imagenes

- Validar que el archivo sea una imagen admitida.
- Corregir orientacion EXIF.
- Reducir fotografias publicas a un maximo de 1920 px por lado.
- Reducir perfiles a un maximo de 1200 px por lado.
- Convertir a WebP con calidad equilibrada y eliminar metadatos no necesarios.
- No actualizar ninguna ficha hasta que Drive confirme la carga.
- Si una carga falla, conservar la imagen anterior y mostrar un error comprensible.

## Lectura y privacidad

Los archivos permaneceran privados en Drive. La aplicacion actuara como lector controlado:

- Las imagenes publicas se serviran mediante una ruta publica de IKA con cache CDN prolongada.
- Las fotos de kenshis se serviran mediante una ruta privada que exige sesion y comprueba que el usuario sea el propio kenshi o un administrador autorizado para su ambito.
- Las URLs guardadas en noticias, eventos y fichas apuntaran a estas rutas estables de IKA, no a enlaces compartidos fragiles de Drive.
- La sustitucion de un archivo generara una nueva URL versionada para evitar imagenes antiguas en cache.

## Migracion

La migracion sera idempotente y se ejecutara en tres fases:

1. Copiar a Drive todas las imagenes dinamicas actuales y registrar sus IDs sin borrar el origen.
2. Copiar las fotografias historicas locales conservando una correspondencia entre ruta antigua e ID de Drive. Las rutas antiguas seguiran funcionando mediante un lector dinamico.
3. Verificar que cada archivo de Drive existe, es una imagen valida y puede servirse desde IKA. Solo entonces actualizar referencias y retirar los originales de Supabase Storage y del repositorio.

Cada elemento tendra estado `pending`, `copied`, `verified`, `switched` o `failed`. Los fallos se podran reintentar sin duplicar archivos.

## Panel de administracion

El super admin dispondra de un bloque `Google Drive` con:

- Estado de conexion y cuenta autorizada.
- Boton `Conectar Google Drive` o `Reconectar`.
- ID y enlace de la carpeta `IKA Web Media`.
- Resumen de migracion: total, copiados, verificados, cambiados y fallidos.
- Accion para iniciar o reintentar la migracion.

La conexion y la migracion requeriran identidad PIN de super admin validada y quedaran registradas en auditoria.

## Despliegue seguro

El cambio se publicara por fases. Mientras una imagen no este verificada en Drive, la plataforma seguira usando su ubicacion actual. No se eliminaran archivos originales durante el primer despliegue. La limpieza definitiva se realizara despues de comprobar produccion y conservar un inventario recuperable de todas las rutas anteriores.

## Validacion

- Pruebas unitarias de normalizacion, permisos, cifrado y seleccion de carpetas.
- Pruebas de carga y lectura publica/privada.
- Migracion de prueba sin borrado y comprobacion de recuentos.
- Verificacion visual de noticias, eventos, paginas, paises/dojos, instructores, perfiles y archivo historico.
- Pruebas responsive, typecheck, lint dirigido y compilacion de produccion.

## Dependencias externas

- Google Drive API habilitada en un proyecto de Google Cloud.
- Cliente OAuth web con callback de produccion autorizado.
- Una unica aceptacion del consentimiento por parte de la cuenta Google de IKA.
- Secretos de OAuth y cifrado configurados en Vercel.
