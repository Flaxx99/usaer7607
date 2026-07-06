import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Inbox, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { toast } from 'sonner';
import { EmptyState, ErrorState, PageSkeleton } from '../../components/Skeletons';
import { notificacionesApi } from '../../api/notificaciones';

const ListaNotificaciones = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['notificaciones', page],
        queryFn: () => notificacionesApi.getNotificaciones(page),
    });

    const markAsReadMutation = useMutation({
        mutationFn: notificacionesApi.marcarComoLeida,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
            toast.success(<span className="inline-flex items-center gap-1.5"><CheckCircle size={16} /> ¡Leída!</span>, { description: 'Notificación marcada como leída.' });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: notificacionesApi.marcarTodasComoLeidas,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
            toast.success(<span className="inline-flex items-center gap-1.5"><CheckCircle size={16} /> ¡Todo leído!</span>, { description: 'Todas las notificaciones marcadas como leídas.' });
        },
    });

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto p-4 md:p-6">
                <PageSkeleton rows={5} />
            </div>
        );
    }

    if (isError) {
        return (
            <ErrorState 
                title="Error al cargar"
                message="No se pudieron cargar las notificaciones. Intenta de nuevo."
                onRetry={() => queryClient.invalidateQueries({ queryKey: ['notificaciones'] })}
            />
        );
    }

    const notificaciones = data?.results || [];
    const totalPages = Math.ceil((data?.count || 0) / 10);

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
            <PageHeader
                icon={Bell}
                title="Notificaciones"
                description="Mantente al tanto de las novedades y avisos."
                gradientClass="header-notificaciones"
            >
                {notificaciones.length > 0 && (
                    <button
                        onClick={() => markAllReadMutation.mutate()}
                        className="btn btn-white btn-lg shadow-md hover:scale-105 transition-transform gap-2"
                    >
                        <CheckCheck size={22} />
                        Marcar todas como leídas
                    </button>
                )}
            </PageHeader>

            {notificaciones.length === 0 ? (
                <EmptyState icon={Inbox} title="No tienes notificaciones nuevas" dashed />
            ) : (
                <div className="space-y-4">
                    {notificaciones.map((n) => (
                        <div 
                            key={n.id} 
                            className={`card-paper transition-all hover:shadow-md ${
                                n.leida ? 'border-base-200 opacity-70' : 'border-primary shadow-sm'
                            }`}
                        >
                            <div className="p-5 flex-row items-start justify-between gap-4">
                                <div className="flex-1">
                                    <p className="text-sm text-base-content/70 whitespace-pre-wrap">
                                        {n.mensaje}
                                    </p>
                                    <p className="text-xs opacity-50 mt-3">
                                        {new Date(n.fecha_creacion).toLocaleString()}
                                    </p>
                                </div>
                                
                                {!n.leida && (
                                    <button 
                                        onClick={() => markAsReadMutation.mutate(n.id)}
                                        className="btn btn-ghost btn-xs text-primary"
                                    >
                                        Marcar leída
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {totalPages > 1 && (
                        <div className="flex justify-center mt-8">
                            <div className="join">
                                <button 
                                    className="join-item btn btn-sm" 
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    aria-label="Página anterior"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="join-item btn btn-sm no-animation">
                                    {page} / {totalPages}
                                </span>
                                <button 
                                    className="join-item btn btn-sm" 
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                    aria-label="Página siguiente"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ListaNotificaciones;
