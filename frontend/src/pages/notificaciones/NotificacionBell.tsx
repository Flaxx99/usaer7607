import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { notificacionesApi } from '../../api/notificaciones';

const TIME_AGO = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
};

const NotificacionBell = () => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const conteoQuery = useQuery({
        queryKey: ['notificaciones', 'conteo'],
        queryFn: notificacionesApi.getConteo,
        refetchInterval: 30_000,
    });

    const noLeidasQuery = useQuery({
        queryKey: ['notificaciones', 'no-leidas'],
        queryFn: notificacionesApi.getNoLeidas,
        enabled: open,
    });

    const markReadMutation = useMutation({
        mutationFn: (id: number) => notificacionesApi.marcarComoLeida(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
        },
    });

    const markAllMutation = useMutation({
        mutationFn: notificacionesApi.marcarTodasComoLeidas,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
            toast.success(<span className="inline-flex items-center gap-1.5"><CheckCircle size={16} /> Todo leído</span>);
        },
    });

    const unreadCount = conteoQuery.data?.unread_count ?? 0;
    const items = noLeidasQuery.data?.results ?? [];

    return (
        <div ref={ref} className="relative">
            <button
                className="btn btn-ghost btn-sm btn-square relative tooltip"
                onClick={() => setOpen((v) => !v)}
                aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
                title="Notificaciones"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 badge badge-error badge-xs font-bold animate-pulse min-w-[16px] h-4 px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-base-100 border border-base-300 rounded-2xl shadow-xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-base-200">
                        <span className="font-bold text-sm">Notificaciones</span>
                        {unreadCount > 0 && (
                            <span className="badge badge-error badge-xs">{unreadCount} sin leer</span>
                        )}
                    </div>

                    {/* Lista */}
                    <div className="max-h-80 overflow-y-auto">
                        {noLeidasQuery.isFetching && items.length === 0 ? (
                            <div className="flex items-center justify-center py-10 text-base-content/40">
                                <Loader2 className="animate-spin w-5 h-5" />
                            </div>
                        ) : items.length === 0 ? (
                            <div className="flex flex-col items-center py-10 text-base-content/40">
                                <CheckCheck size={32} className="mb-2" />
                                <p className="text-sm font-medium">Todo al día</p>
                                <p className="text-xs">No tenés notificaciones sin leer.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-base-200">
                                {items.map((n) => (
                                    <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-base-200/50 transition-colors group">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm leading-snug line-clamp-2">{n.mensaje}</p>
                                            <p className="text-[11px] text-base-content/40 mt-1 font-medium">{TIME_AGO(n.fecha_creacion)}</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markReadMutation.mutate(n.id);
                                            }}
                                            disabled={markReadMutation.isPending}
                                            className="btn btn-ghost btn-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                            title="Marcar como leída"
                                        >
                                            <CheckCircle size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-2 px-4 py-2.5 border-t border-base-200 bg-base-200/30">
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllMutation.mutate()}
                                disabled={markAllMutation.isPending}
                                className="btn btn-ghost btn-xs gap-1.5 text-primary"
                            >
                                <CheckCheck size={14} />
                                Marcar todas
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setOpen(false);
                                navigate('/notificaciones');
                            }}
                            className="btn btn-ghost btn-xs gap-1.5 ml-auto"
                        >
                            Ver todas
                            <ExternalLink size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificacionBell;
