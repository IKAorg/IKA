# Desglose de miembros activos en la cabecera de administracion

## Objetivo

Mostrar en la linea de resumen del panel de administracion el total mundial de miembros IKA activos y su desglose visible entre adultos y ninos.

## Diseno aprobado

- Mantener la metrica actual de miembros activos como primer dato y con el numero total destacado.
- Mostrar inmediatamente despues `Adultos <numero>` y `Ninos <numero>` dentro del mismo bloque.
- No requerir pulsacion ni desplegable: el desglose debe estar siempre visible.
- Permitir que los tres datos se distribuyan en varias lineas en pantallas estrechas sin alterar su orden.
- Mantener sin cambios las metricas de dojos actuales y paises.

## Datos

La API de alcance administrativo devolvera tres recuentos globales calculados sobre `members` con `status = active`:

- `activeMembers`: todos los miembros activos.
- `activeAdults`: miembros activos con `member_group = adult`.
- `activeChildren`: miembros activos con `member_group = child`.

Las cifras usan el mismo alcance global que la cabecera existente. Los registros activos sin grupo definido permanecen incluidos en el total, pero no se asignan artificialmente a adultos o ninos.

## Idiomas

Las etiquetas `Adultos` y `Ninos` tendran traduccion explicita en los 12 idiomas disponibles: ingles, espanol, italiano, frances, japones, chino, checo, indonesio, malayo, euskera, portugues y aleman.

## Verificacion

- Prueba del calculo y contrato del resumen.
- Comprobacion de tipos y lint.
- Compilacion completa de produccion.
- Revision del comportamiento responsive del bloque de resumen.
