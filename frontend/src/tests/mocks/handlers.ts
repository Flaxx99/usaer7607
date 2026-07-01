import { http, HttpResponse, delay } from 'msw';

const alumnosMock = { count: 1, next: null, previous: null, results: [{ id: 1, nombres: 'Juan', apellido_paterno: 'Pérez', apellido_materno: 'López', curp: 'PELJ010101HDFRRT01', fecha_nacimiento: '2001-01-01', usuario_id: 10, activo: true }] };
const clasifMock = [{ id: 1, nombre: 'DISCAPACIDAD_MOTRIZ', descripcion: 'Discapacidad motriz o física', activo: true }];
const subclasifMock = [{ id: 1, nombre: 'PARÁLISIS_CEREBRAL', descripcion: 'Parálisis cerebral', clasificacion_id: 1, activo: true }];

export const handlers = [
  http.post('*/usuarios/auth/login/', async ({ request }) => {
    await delay(100); 

    const body = await request.json() as { username?: string; password?: string };

    if (body.username === 'admin' && body.password === 'admin123') {
      return HttpResponse.json({
        token: 'mock-token-12345',
        user: {
          username: 'admin',
          first_name: 'Admin',
          role: 'ROLE_ADMIN',
        },
      });
    }

    return HttpResponse.json(
      { detail: 'Credenciales incorrectas.' },
      { status: 400 }
    );
  }),

  http.get('*/usuarios/dashboard-data/', async () => {
    await delay(200);
    return HttpResponse.json({
      ciclo_actual: '2025-2026',
      stats: {
        total_alumnos: 150,
        total_escuelas: 12,
        total_maestros: 25,
        total_usuarios: 40,
      },
      incidencias_pendientes: 5,
      racs_pendientes: 8,
      ultimos_avisos: [
        { 
          id: 1, 
          titulo: 'Junta de Consejo Técnico', 
          contenido: 'Se convoca a todo el personal el próximo viernes.', 
          fecha: '2026-05-20', 
          autor: 'Dirección' 
        },
        { 
          id: 2, 
          titulo: 'Actualización de Expedientes', 
          contenido: 'Favor de subir las evaluaciones del primer trimestre.', 
          fecha: '2026-05-18', 
          autor: 'Supervisión' 
        },
      ],
      grafica_clasificacion: [
        { clasificacion: 'DISCAPACIDAD_MOTRIZ', total: 40 },
        { clasificacion: 'TDAH', total: 60 },
        { clasificacion: 'AUTISMO', total: 50 },
      ],
      actividad_reciente: [
        { tipo: 'RAC', descripcion: 'RAC de Juan Pérez — 2025-2026', fecha: '2026-06-28T10:30:00', url: '/rac/editar/1' },
        { tipo: 'RAC', descripcion: 'RAC de María García — 2025-2026', fecha: '2026-06-25T14:00:00', url: '/rac/editar/2' },
      ],
      eventos_hoy: [
        { title: 'Reunión con padres', hora: '10:00', color: '#3B82F6', event_type: 'Reunión' },
        { title: 'Evaluación psicopedagógica', hora: '14:30', color: '#EC4899', event_type: 'Evaluación' },
      ],
    });
  }),

  http.get('*/alumnos/', () => HttpResponse.json(alumnosMock)),
  http.get('*/alumnos/clasificaciones/', () => HttpResponse.json(clasifMock)),
  http.get('*/alumnos/subclasificaciones/', ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('clasificacion_id');
    return HttpResponse.json(id === '1' ? subclasifMock : []);
  }),
  http.post('*/asistencias/rac/', async () => {
    await delay(30);
    return HttpResponse.json({ message: 'RAC registrado correctamente', id: 1 }, { status: 201 });
  }),

  http.get('*/rac/pendientes/', () => HttpResponse.json([])),
  http.get('*/rae/progreso/', () => HttpResponse.json([])),
];

