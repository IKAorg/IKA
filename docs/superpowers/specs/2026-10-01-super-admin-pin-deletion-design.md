# Eliminacion de perfiles PIN de super admin

## Objetivo

Permitir que un super admin autenticado elimine perfiles PIN creados por error, incluidos duplicados, desde el panel de administracion.

## Interfaz

- Cada fila de perfil PIN mostrara un boton de papelera junto a Guardar.
- Al pulsarlo, el navegador pedira confirmacion e incluira el nombre del perfil.
- Tras confirmar y completar el borrado, la lista se recargara y mostrara un mensaje de exito.
- El boton estara deshabilitado para la identidad PIN usada en la sesion actual.
- Las etiquetas, confirmaciones y mensajes se definiran para todos los idiomas disponibles.

## API y permisos

- `DELETE /api/admin/director-pin?directorId=<id>` eliminara el perfil indicado.
- La operacion requerira una cuenta con rol `super_admin` y una identidad PIN validada.
- La API rechazara el borrado de la propia identidad PIN activa.
- La API rechazara el borrado si el objetivo es el ultimo perfil activo disponible.
- El cierre de identidad PIN existente seguira usando `DELETE /api/admin/director-pin` sin `directorId`, conservando el comportamiento actual.

## Datos y auditoria

- El perfil se eliminara definitivamente de `super_admin_directors`.
- Sus sesiones se eliminaran por la relacion existente `on delete cascade`.
- Los registros historicos de auditoria se conservaran; su referencia al perfil eliminado pasara a `null` mediante `on delete set null`.
- Antes del borrado se registrara la accion `director_pin.delete`, incluyendo el identificador y nombre del perfil objetivo en los metadatos.

## Validacion

- Probar rechazo al eliminar la identidad actual.
- Probar rechazo al eliminar el ultimo perfil activo.
- Probar borrado correcto de otro perfil y recarga de la lista.
- Ejecutar typecheck, lint dirigido y compilacion de produccion.
