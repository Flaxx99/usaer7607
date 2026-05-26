import { http, HttpResponse, delay } from 'msw';

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
      },
      incidencias_pendientes: 5,
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
    });
  }),
];

