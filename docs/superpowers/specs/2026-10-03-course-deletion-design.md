# Eliminacion segura de cursos IKA

## Objetivo

Permitir eliminar definitivamente un curso IKA de prueba o creado por error, junto con sus datos vinculados, sin eliminar los Kenshis participantes ni afectar otros cursos.

## Permisos

- El super admin puede eliminar cualquier curso.
- Un responsable de pais o dojo solo puede eliminar un curso cuando su perfil sea el `created_by` del evento.
- La autorizacion se valida en el servidor. La visibilidad del boton en la interfaz no sustituye esta comprobacion.

## Interfaz

- Cada curso eliminable muestra una accion `Eliminar curso` con icono de papelera.
- Al pulsarla se muestra una confirmacion que incluye el titulo del curso y advierte que el borrado es definitivo.
- La advertencia indica que tambien se eliminaran inscripciones, controles de asistencia, historial de curso generado y resultados o logros derivados.
- Mientras se procesa la operacion, el boton queda deshabilitado para evitar peticiones duplicadas.
- Al terminar, la lista se actualiza y muestra un mensaje de exito. Si falla, conserva el curso y muestra un error util.

## Flujo del servidor

Se incorpora un endpoint `DELETE` protegido para el curso. El servidor:

1. Resuelve la identidad administrativa actual, incluida la identidad PIN del super admin.
2. Carga el evento y comprueba que es super admin o que `events.created_by` coincide con el perfil autenticado.
3. Elimina los logros vinculados a historiales generados por ese evento.
4. Elimina los registros de `grade_history` cuyo `source_event_id` sea el curso.
5. Elimina el evento. Las traducciones, inscripciones y controles de asistencia se eliminan mediante las relaciones en cascada existentes.
6. Registra la operacion en auditoria con el identificador y titulo del curso.

La limpieza se ejecuta mediante una funcion de base de datos transaccional para que un error revierta la operacion completa.

## Datos conservados

- Los perfiles y fichas de Kenshi nunca se eliminan.
- Los cursos introducidos manualmente que no procedan del evento permanecen intactos.
- Los logros no relacionados con el curso eliminado permanecen intactos.

## Verificacion

- Super admin puede borrar cualquier curso.
- El creador puede borrar su propio curso.
- Otro responsable no puede borrar un curso ajeno aunque manipule la peticion.
- Al confirmar, desaparecen curso, traducciones, inscripciones, asistencias, historiales derivados y logros relacionados.
- Al cancelar la confirmacion no cambia ningun dato.
- La interfaz se actualiza sin recargar manualmente la pagina.
