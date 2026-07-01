import React, { useState } from 'react';
import { 
    Plus, Search, Trash2, FileText, Download, UploadCloud, Edit2,
    CheckCircle, XCircle, User
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { TableSkeleton, EmptyState, ErrorState } from '../../components/Skeletons';
import Modal from '../../components/Modal';
import { LoadingButton } from '../../components/LoadingButton';
import { useConfirmDialog } from '../../components/useConfirmDialog';
import { getOficios, uploadOficio, updateOficio, deleteOficio } from '../../api/oficios';
import type { Oficio } from '../../interfaces/oficio';

const OficiosList = () => {
    const [busqueda, setBusqueda] = useState('');
    const busquedaDebounced = useDebouncedValue(busqueda, 300);
    const [page, setPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Oficio | null>(null);
    const { confirm: confirmDelete, dialog: confirmDialog } = useConfirmDialog();
    
    const queryClient = useQueryClient();

    const { data: paginatedOficios, isLoading, isError, error } = useQuery({
        queryKey: ['oficios', page, busquedaDebounced],
        queryFn: () => getOficios(page, busquedaDebounced),
    });

    const oficios = paginatedOficios?.results || [];
    const totalCount = paginatedOficios?.count || 0;

    const uploadMutation = useMutation({
        mutationFn: uploadOficio,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['oficios'] });
            setIsModalOpen(false);
            toast.success(<span className="inline-flex items-center gap-1.5"><CheckCircle size={16} /> ¡Subido!</span>, { description: 'Oficio subido correctamente.' });
        },
        onError: () => toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { description: 'No se pudo subir el archivo.' }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, formData }: { id: number; formData: FormData }) => updateOficio(id, formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['oficios'] });
            setEditTarget(null);
            setIsModalOpen(false);
            toast.success(<span className="inline-flex items-center gap-1.5"><CheckCircle size={16} /> ¡Actualizado!</span>, { description: 'Oficio actualizado correctamente.' });
        },
        onError: () => toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { description: 'No se pudo actualizar el oficio.' }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteOficio,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['oficios'] });
            toast.success(<span className="inline-flex items-center gap-1.5"><Trash2 size={16} /> ¡Eliminado!</span>, { description: 'El oficio ha sido borrado.' });
        },
    });

    const handleOpenCreate = () => {
        setEditTarget(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (oficio: Oficio) => {
        setEditTarget(oficio);
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const form = event.currentTarget as HTMLFormElement;
        const formData = new FormData(form);

        if (editTarget) {
            updateMutation.mutate({ id: editTarget.id, formData });
        } else {
            uploadMutation.mutate(formData);
        }
    };

    const handleDelete = async (id: number) => {
        const ok = await confirmDelete({
            title: 'Eliminar Oficio',
            message: '¿Eliminar oficio? Esta acción no se puede deshacer.',
            variant: 'danger',
            confirmText: 'Eliminar',
        });
        if (ok) {
            deleteMutation.mutate(id);
        }
    };

    const isMutating = uploadMutation.isPending || updateMutation.isPending;

    if (isError) return <ErrorState error={error} message="Error al cargar los oficios. Intenta de nuevo." />;

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto p-4 md:p-6">
                <TableSkeleton rows={10} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
            
            {/* CABECERA CON GRADIENTE */}
            <div className="card bg-gradient-to-br from-primary to-indigo-700 text-primary-content shadow-xl overflow-hidden relative">
                <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
                <div className="card-body p-8 flex-row items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner backdrop-blur-sm">
                            <FileText size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">
                                Gestión de Oficios
                            </h1>
                            <p className="text-sm opacity-90 font-medium">
                                Archivo digital de documentos oficiales enviados y recibidos por la USAER 7607.
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        className="btn btn-white btn-lg shadow-md hover:scale-105 transition-transform"
                        onClick={handleOpenCreate}
                    >
                        <Plus size={22} />
                        Subir Nuevo Oficio
                    </button>
                </div>
            </div>

            {/* TABLA */}
            <div className="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">
                <div className="p-4 border-b border-base-200">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por título o descripción..." 
                            className="input input-bordered pl-10 w-full" 
                            value={busqueda} 
                            onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="table table-md table-zebra w-full">
                        <thead className="bg-base-200">
                            <tr className="text-xs uppercase opacity-60">
                                <th>Título del Documento</th>
                                <th>Descripción</th>
                                <th>Subido por</th>
                                <th>Fecha de Subida</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {oficios.map((oficio) => (
                                <tr key={oficio.id} className="hover">
                                    <td className="font-bold">{oficio.titulo}</td>
                                    <td className="opacity-70 text-sm max-w-xs truncate">{oficio.descripcion || '—'}</td>
                                    <td>
                                        <span className="inline-flex items-center gap-1.5 text-sm">
                                            <User size={14} className="opacity-40" />
                                            {oficio.subido_por_nombre || 'Sistema'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="text-sm">{new Date(oficio.fecha_subida).toLocaleDateString()}</span>
                                    </td>
                                    <td>
                                        <div className="flex justify-center gap-1">
                                            <button 
                                                className="btn btn-ghost btn-xs text-primary"
                                                onClick={() => handleOpenEdit(oficio)}
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <a 
                                                href={oficio.archivo} 
                                                target="_blank" 
                                                className="btn btn-ghost btn-xs text-primary"
                                                title="Ver / Descargar"
                                            >
                                                <Download size={16} />
                                            </a>
                                            <button 
                                                className="btn btn-ghost btn-xs text-error" 
                                                onClick={() => handleDelete(oficio.id)}
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {oficios.length === 0 && (
                        <EmptyState icon={UploadCloud} title="No hay oficios registrados en el archivo." />
                    )}
                </div>
                
                <div className="flex justify-center p-4 border-t border-base-200">
                    <div className="join">
                        <button className="join-item btn btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>«</button>
                        <button className="join-item btn btn-sm no-animation">{page} / {Math.ceil(totalCount / 10)}</button>
                        <button className="join-item btn btn-sm" disabled={page >= Math.ceil(totalCount / 10)} onClick={() => setPage(p => p + 1)}>»</button>
                    </div>
                </div>
            </div>

            {/* MODAL SUBIR / EDITAR */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditTarget(null); }}
                title={editTarget ? 'Editar Documento Oficial' : 'Subir Documento Oficial'}
                icon={<UploadCloud size={24} />}
                size="sm"
            >
                <form onSubmit={handleFormSubmit} className="space-y-6" data-testid="upload-form">
                    <div className="form-control">
                        <label className="label" htmlFor="titulo"><span className="label-text font-bold">Título del Oficio</span></label>
                        <input 
                            id="titulo" 
                            name="titulo" 
                            required 
                            className="input input-bordered w-full" 
                            placeholder="Ej. Reporte Trimestral de Alumnos"
                            defaultValue={editTarget?.titulo || ''}
                            aria-label="Título del Oficio"
                        />
                    </div>
                    <div className="form-control">
                        <label className="label" htmlFor="descripcion"><span className="label-text font-bold">Descripción / Notas</span></label>
                        <input 
                            id="descripcion" 
                            name="descripcion" 
                            className="input input-bordered w-full" 
                            placeholder="Ej. Enviado a la supervisión escolar zona 01"
                            defaultValue={editTarget?.descripcion || ''}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label" htmlFor="archivo">
                            <span className="label-text font-bold">
                                Archivo {editTarget ? '(dejar vacío para mantener el actual)' : '(PDF, Imagen)'}
                            </span>
                        </label>
                        <input 
                            id="archivo"
                            name="archivo" 
                            type="file" 
                            required={!editTarget}
                            accept="application/pdf,image/*,.doc,.docx,.xlsx,.xls" 
                            className="file-input file-input-bordered w-full" 
                            aria-label="Archivo"
                        />
                        {editTarget && (
                            <label className="label cursor-pointer mt-1">
                                <a href={editTarget.archivo} target="_blank" className="label-text-alt link link-primary text-xs flex items-center gap-1">
                                    <Download size={12} /> Archivo actual: {editTarget.archivo.split('/').pop() || 'ver archivo'}
                                </a>
                            </label>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-base-300">
                        <button type="button" className="btn btn-ghost" onClick={() => { setIsModalOpen(false); setEditTarget(null); }}>Cancelar</button>
                        <LoadingButton
                            type="submit"
                            className="btn btn-primary px-8 flex items-center gap-2"
                            icon={editTarget ? Edit2 : UploadCloud}
                            loading={isMutating}
                        >
                            {editTarget ? 'Guardar Cambios' : 'Subir Archivo'}
                        </LoadingButton>
                    </div>
                </form>
            </Modal>
            {confirmDialog}
        </div>
    );
};

export default OficiosList;
