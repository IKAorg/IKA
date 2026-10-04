# Logo de la entidad representante por pais

## Objetivo

Mostrar en la pagina publica de paises el logo de la entidad representante de cada pais en lugar del icono generico, manteniendo el icono como alternativa cuando no exista un logo valido. El logo podra obtenerse desde la web oficial o cargarse manualmente por un super admin o por un responsable autorizado del pais.

## Experiencia de administracion

La edicion del pais incluira un bloque llamado `Logo de la entidad representante`, situado junto a los datos de la entidad y su web oficial.

- `Buscar logo en la web` analizara la URL oficial ya introducida.
- El sistema priorizara metadatos de logo explicitos, despues `og:image` y finalmente iconos de alta resolucion.
- El resultado se mostrara como vista previa y no se guardara hasta que el administrador lo confirme.
- `Subir otro logo` permitira seleccionar un archivo local cuando el resultado automatico no sea adecuado.
- `Eliminar logo` devolvera la ficha al icono generico.
- Una nueva busqueda nunca sustituira silenciosamente un logo previamente confirmado.

El super admin podra gestionar cualquier logo. Un country admin o responsable autorizado solo podra gestionar el logo de los paises incluidos en su ambito actual.

## Almacenamiento y datos

Se anadira a `countries` una referencia de medios independiente para el logo de la entidad representante. La bandera del pais y el logo de la entidad seguiran siendo recursos distintos.

Toda imagen confirmada, tanto encontrada en una web como subida manualmente, seguira el flujo de medios existente:

1. Validacion de tipo, dimensiones y peso.
2. Optimizacion a un formato web adecuado sin deformar la imagen.
3. Almacenamiento en la carpeta configurada del Drive de IKA.
4. Registro en `media_library` y asociacion con el pais.

La pagina publica resolvera la imagen mediante las rutas de medios del sistema; no dependera permanentemente de la URL externa donde fue encontrada.

## Busqueda segura en la web

La busqueda se ejecutara en servidor. Solo aceptara URLs `https` o `http` publicas y rechazara direcciones locales, privadas, de metadatos y redirecciones hacia esos destinos. Se aplicaran limites de tiempo, redirecciones y bytes descargados.

El analizador revisara el HTML de la pagina inicial y normalizara URLs relativas. Las candidatas se ordenaran por calidad probable. Antes de mostrar la vista previa se verificara que la respuesta sea una imagen permitida.

Si no se encuentra una imagen valida, la interfaz explicara que puede cargarse manualmente. El fallo no modificara el logo existente.

## Presentacion publica

En cada fila de la pagina de paises:

- El logo ocupara el espacio cuadrado donde actualmente aparece el icono de persona.
- Se utilizara `object-contain`, fondo neutro y dimensiones estables para respetar logos verticales, horizontales o cuadrados.
- El texto `Entidad representante` y el nombre de la entidad permaneceran a su derecha.
- Si no hay logo, se conservara exactamente el icono generico actual.
- El comportamiento sera responsive y no alterara la disposicion del boton de web oficial ni el control para abrir el pais.

## API y permisos

La API de ubicaciones devolvera la nueva referencia de medio y la incluira en la resolucion de archivos. Guardar o eliminar el logo reutilizara las comprobaciones de alcance existentes para paises.

Se anadira una accion autenticada para buscar candidatos desde la web oficial. Esa accion no guardara nada: devolvera una previsualizacion temporal o los datos necesarios para confirmar la importacion. La confirmacion usara el servicio central de subida a Drive.

## Errores y estados

- URL ausente o invalida: se pedira completar correctamente la web oficial.
- Web inaccesible o sin logo: se conservara el estado anterior y se ofrecera carga manual.
- Imagen demasiado grande o formato no admitido: se rechazara antes de almacenarla.
- Fallo de Drive: no se actualizara la referencia del pais.
- Logo eliminado: la pagina publica volvera al icono generico.

## Verificacion

- Permisos de super admin y country admin dentro y fuera de su ambito.
- Busqueda con logo explicito, `og:image`, favicon y web sin imagen valida.
- Bloqueo de destinos de red privados y descargas excesivas.
- Carga manual, sustitucion, eliminacion y fallo de Drive.
- Renderizado con logo horizontal, vertical, cuadrado y sin logo.
- Comprobacion visual en escritorio, movil, tablet e iPad Mini horizontal.
- Build de produccion y comprobacion final en Vercel.
