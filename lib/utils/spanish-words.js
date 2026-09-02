'use strict';

// Common Spanish verbs and nouns likely to show up inside camelCase /
// snake_case identifiers in *any* JS/TS codebase — not tied to one
// company's domain. Not exhaustive: extend it via the `extraWords` rule
// option (see README) as you find real false negatives, rather than
// growing this file forever.
const CORE_SPANISH_WORDS = new Set([
  // CRUD / common verbs
  'obtener', 'guardar', 'actualizar', 'eliminar', 'borrar', 'buscar',
  'crear', 'editar', 'mostrar', 'ocultar', 'cargar', 'enviar', 'recibir',
  'validar', 'calcular', 'agregar', 'anadir', 'añadir', 'quitar', 'aprobar',
  'rechazar', 'revisar', 'generar', 'procesar', 'convertir', 'verificar',
  'confirmar', 'cancelar', 'descargar', 'subir', 'exportar', 'importar',
  'listar', 'filtrar', 'ordenar', 'seleccionar', 'comparar', 'combinar',
  'dividir', 'multiplicar', 'sumar', 'restar', 'contar', 'medir', 'mover',
  'copiar', 'pegar', 'cortar', 'abrir', 'cerrar', 'conectar', 'desconectar',
  'autenticar', 'autorizar', 'permitir', 'denegar', 'bloquear',
  'desbloquear', 'activar', 'desactivar', 'habilitar', 'deshabilitar',
  'notificar', 'alertar', 'programar', 'ejecutar', 'iniciar', 'terminar',
  'finalizar', 'imprimir', 'traducir', 'formatear', 'analizar', 'extraer',
  'insertar', 'reemplazar', 'redireccionar', 'redirigir',
  // people / accounts
  'usuario', 'usuarios', 'cliente', 'clientes', 'empresa', 'empresas',
  'nombre', 'nombres', 'apellido', 'apellidos', 'correo', 'telefono',
  'direccion', 'ciudad', 'pais', 'calle', 'clave', 'contrasena',
  'contraseña', 'sesion', 'perfil', 'perfiles', 'cuenta', 'cuentas',
  'rol', 'permiso', 'permisos', 'equipo', 'equipos',
  // dates / quantities
  'fecha', 'fechas', 'hora', 'horas', 'dia', 'dias', 'mes', 'meses',
  'anio', 'anios', 'año', 'años', 'semana', 'semanas', 'precio', 'precios',
  'cantidad', 'cantidades', 'totales', 'moneda',
  'monedas', 'descuento', 'descuentos', 'impuesto', 'impuestos',
  // app / UI structure
  'mensaje', 'mensajes', 'errores', 'advertencia', 'exito',
  'resultado', 'resultados', 'lista', 'listas', 'tabla', 'columna',
  'columnas', 'fila', 'filas', 'campo', 'campos', 'valores',
  'tipo', 'tipos', 'categoria', 'categorias', 'grupo', 'grupos', 'nivel',
  'niveles', 'estado', 'estados', 'evento', 'eventos', 'accion',
  'acciones', 'boton', 'botones', 'pantalla', 'pantallas',
  'ventana', 'formulario', 'formularios', 'imagen', 'imagenes', 'archivo',
  'archivos', 'carpeta', 'carpetas', 'documento', 'documentos', 'informe',
  'informes', 'reporte', 'reportes', 'grafico', 'graficos',
  'colores', 'tamano', 'ancho', 'alto', 'posicion', 'orden', 'indice',
  'llave', 'llaves', 'servicio', 'servicios', 'producto',
  'productos', 'respuesta', 'respuestas', 'peticion', 'peticiones',
  'solicitud', 'solicitudes', 'notificacion', 'notificaciones',
  'descripcion', 'titulo', 'titulos', 'contenido', 'contenidos', 'texto',
  'textos', 'idioma', 'idiomas', 'configuracion', 'ajustes', 'opcion',
  'opciones', 'pendiente', 'pendientes', 'activo', 'activos', 'inactivo',
  'politica', 'politicas',
  // pronouns / connectors that are strong signals combined with the above
  'nuevo', 'nueva', 'viejo', 'todos', 'todas', 'cada', 'este', 'esta',
]);

module.exports = { CORE_SPANISH_WORDS };
