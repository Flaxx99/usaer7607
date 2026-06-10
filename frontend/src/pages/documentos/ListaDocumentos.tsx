import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { 
    Plus, Search, FolderOpen, Edit2, Trash2, 
    FileText, Save, Paperclip, X, UploadCloud
} from 'lucide-react';
import { toast } from 'sonner';
import { 
    getDocumentos, createDocumento, updateDocumento, 
    deleteDocumento, deleteArchivoExtra 
} from '../../api/documentos';
import { getAlumnos } from '../../api/alumnos';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import type { Expediente } from '../../interfaces/documentos';

const DocStatus = ({ label, hasFile, url }: { label: string, hasFile: boolean, url?: string }) => (
    <div className="flex items-center justify-between p-2 bg-base-200 rounded-lg border border-base-300 group hover:border-primary transition-colors">
        <span className="text-xs font-bold opacity-70">{label}</span>
        {hasFile ? (
            <a href={url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-xs text-success gap-1">
                <FileText size={12} /> Ver
            </a>
        ) : (
            <span className="text-xs text-error font-bold">Faltante</span>
        )}
    </div>
);

const ListaDocumentos = () => {
  const [busqueda, setBusqueda] = useState('');
  const busquedaDebounced = useDebouncedValue(busqueda, 300);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docEditar, setDocEditar] = useState<Expediente | null>(null);
  
  const [extrasTemp, setExtrasTemp] = useState<{file: File, descripcion: string}[]>([]);
  const [tempDesc, setTempDesc] = useState('');

  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Expediente>();

  const { data: documentos, isLoading: loadingDocs } = useQuery({
    queryKey: ['documentos'],
    queryFn: getDocumentos,
  });

  const { data: alumnos, isLoading: loadingAlumnos } = useQuery({
    queryKey: ['alumnos'],
    queryFn: () => getAlumnos(),
  });

  const createMutation = useMutation({
    mutationFn: createDocumento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      cerrarModal();
      toast.success('¡Guardado! 📂', { description: 'Expediente creado correctamente' });
    },
    onError: () => toast.error('Error ❌', { description: 'No se pudo crear el expediente' })
  });

  const updateMutation = useMutation({
    mutationFn: updateDocumento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      cerrarModal();
      toast.success('¡Actualizado! ✏️', { description: 'Expediente actualizado' });
    },
    onError: () => toast.error('Error ❌', { description: 'No se pudo actualizar' })
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocumento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      toast.success('¡Eliminado! 🗑️', { description: 'Expediente borrado' });
    }
  });

  const deleteExtraMutation = useMutation({
    mutationFn: ({ expId, archId }: { expId: number, archId: number }) => deleteArchivoExtra(expId, archId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      if (docEditar) {
          toast.success('Archivo eliminado');
          cerrarModal();
      }
    }
  });

  const cerrarModal = () => {
    setIsModalOpen(false);
    setDocEditar(null);
    setExtrasTemp([]);
    setTempDesc('');
    reset();
  };

  const handleOpenCreate = () => {
    setDocEditar(null);
    setExtrasTemp([]);
    reset();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc: Expediente) => {
    setDocEditar(doc);
    setExtrasTemp([]);
    reset(doc);
    setIsModalOpen(true);
  };

  const onAddExtraFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setExtrasTemp([...extrasTemp, { file, descripcion: tempDesc || file.name }]);
        setTempDesc('');
        e.target.value = '';
    }
  };

  const onRemoveExtraTemp = (index: number) => {
    const nuevos = [...extrasTemp];
    nuevos.splice(index, 1);
    setExtrasTemp(nuevos);
  };

  const onSubmit = (data: Expediente) => {
    data.nuevos_archivos_temp = extrasTemp;
    if (docEditar) {
        updateMutation.mutate({ ...data, id: docEditar.id });
    } else {
        createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Eliminar Expediente? Se borrarán todos los archivos asociados.')) {
        deleteMutation.mutate(id);
    }
  };

  const handleDeleteExtraReal = (archivoId: number) => {
      if(!docEditar) return;
      if (confirm('¿Borrar anexo? Se eliminará permanentemente.')) {
          deleteExtraMutation.mutate({ expId: docEditar.id, archId: archivoId });
      }
  };

  const documentosFiltrados = documentos?.filter(e => 
    e.alumno_nombre?.toLowerCase().includes(busquedaDebounced.toLowerCase()) || 
    e.profesor_nombre?.toLowerCase().includes(busquedaDebounced.toLowerCase())
  );

  const isLoading = loadingDocs || loadingAlumnos;

  if (isLoading) {
      return (
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-base-200 animate-pulse rounded-xl" />)}
          </div>
        </div>
      );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        
        <div className="card bg-primary text-primary-content shadow-lg border-l-8 border-primary-dark">
            <div className="card-body p-8 flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                        <FolderOpen size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">
                            Documentos y Expedientes
                        </h1>
                        <p className="text-sm opacity-90 font-medium">
                            Gestión de archivos psicopedagógicos y planes de intervención por alumno.
                        </p>
                    </div>
                </div>
                <button 
                    className="btn btn-white btn-lg shadow-md hover:scale-105 transition-transform"
                    onClick={handleOpenCreate}
                >
                    <Plus size={22} />
                    Nuevo Expediente
                </button>
            </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="p-4 border-b border-base-200">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar alumno o profesor..." 
                        className="input input-bordered pl-10 w-full" 
                        value={busqueda} 
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
            </div>
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documentosFiltrados?.map((doc) => {
                const docsCount = [doc.informe_deteccion, doc.informe_psicopedagogico, doc.plan_intervencion].filter(Boolean).length;
                const totalDocs = 3;
                const progressColor = docsCount === totalDocs ? 'badge-success' : docsCount > 0 ? 'badge-warning' : 'badge-ghost';

                return (
                    <div 
                        key={doc.id} 
                        className={`card bg-base-100 shadow-sm border border-base-300 p-6 transition-all hover:shadow-md ${
                            docsCount === totalDocs ? 'border-t-4 border-t-success' : 
                            docsCount > 0 ? 'border-t-4 border-t-warning' : 'border-t-4 border-t-base-300'
                        }`}
                    >
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-black text-base-content leading-tight">
                                        {doc.alumno_nombre}
                                    </h3>
                                    <p className="text-xs opacity-60 font-medium">
                                        Prof. {doc.profesor_nombre}
                                    </p>
                                </div>
                                <span className={`badge badge-sm font-bold ${progressColor}`}>
                                    {docsCount}/{totalDocs} Docs
                                </span>
                            </div>

                            <div className="divider my-0"></div>

                            <div className="space-y-2">
                                <DocStatus label="Inf. Detección" hasFile={!!doc.informe_deteccion} url={doc.informe_deteccion as string} />
                                <DocStatus label="Inf. Psicopedagógico" hasFile={!!doc.informe_psicopedagogico} url={doc.informe_psicopedagogico as string} />
                                <DocStatus label="Plan Intervención" hasFile={!!doc.plan_intervencion} url={doc.plan_intervencion as string} />
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-base-200">
                                <div className="flex items-center gap-2 opacity-60">
                                    <Paperclip size={14} />
                                    <span className="text-xs font-bold">{doc.otros_archivos?.length || 0} Anexos</span>
                                </div>
                                <div className="flex gap-1">
                                    <button className="btn btn-ghost btn-xs text-primary" onClick={() => handleOpenEdit(doc)}>
                                        <Edit2 size={14} />
                                    </button>
                                    <button className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete(doc.id)}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {documentosFiltrados?.length === 0 && (
                <div className="col-span-full card bg-base-200 p-12 text-center space-y-4">
                    <FolderOpen size={48} className="mx-auto text-base-content/20" />
                    <p className="font-medium text-base-content/40">No se encontraron expedientes con ese criterio de búsqueda.</p>
                </div>
            )}
                </div>
            </div>
        </div>

        {isModalOpen && (
            <div className="modal modal-open">
                <div className="modal-box max-w-2xl p-0 overflow-hidden">
                    <div className="bg-primary p-6 text-primary-content flex items-center gap-3">
                        <FolderOpen size={24} className="text-yellow-300" />
                        <h3 className="text-xl font-black">📂 {docEditar ? "Editar Expediente" : "Nuevo Expediente"}</h3>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">Alumno</span></label>
                            <select 
                                {...register('alumno', { required: "Selecciona un alumno" })} 
                                className="select select-bordered w-full"
                                disabled={!!docEditar}
                                required
                            >
                                <option value="">Selecciona un alumno</option>
                                {alumnos?.results?.map(a => (
                                    <option key={a.id} value={a.id}>{a.nombres} {a.apellido_paterno} {a.apellido_materno}</option>
                                ))}
                            </select>
                            {errors.alumno && <span className="text-error text-xs mt-1">{errors.alumno.message}</span>}
                        </div>

                        <div className="divider">Documentos Base</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="form-control">
                                <label className="label"><span className="label-text text-xs font-bold">Inf. Detección</span></label>
                                <input type="file" {...register('informe_deteccion')} className="file-input file-input-bordered w-full text-xs" accept=".pdf,.doc,.docx" />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text text-xs font-bold">Inf. Psicopedagógico</span></label>
                                <input type="file" {...register('informe_psicopedagogico')} className="file-input file-input-bordered w-full text-xs" accept=".pdf,.doc,.docx" />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text text-xs font-bold">Plan Intervención</span></label>
                                <input type="file" {...register('plan_intervencion')} className="file-input file-input-bordered w-full text-xs" accept=".pdf,.doc,.docx" />
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">Observaciones</span></label>
                            <textarea {...register('observaciones')} className="textarea textarea-bordered h-24" placeholder="Notas adicionales..." />
                        </div>

                        <div className="divider">Archivos Anexos</div>
                        <div className="p-4 bg-base-200 rounded-xl border border-base-300 space-y-4">
                            {docEditar && docEditar.otros_archivos && docEditar.otros_archivos.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase opacity-50">Archivos Guardados:</p>
                                    <div className="flex flex-col gap-2">
                                        {docEditar.otros_archivos.map(archivo => (
                                            <div key={archivo.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-base-300 text-xs">
                                                <a href={archivo.url_archivo || '#'} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">
                                                    {archivo.nombre_archivo}
                                                </a>
                                                <button 
                                                    type="button" 
                                                    className="btn btn-ghost btn-xs text-error" 
                                                    onClick={() => handleDeleteExtraReal(archivo.id)}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 items-end">
                                <div className="form-control flex-1">
                                    <input 
                                        type="text" 
                                        placeholder="Descripción del anexo..." 
                                        className="input input-bordered w-full text-xs" 
                                        value={tempDesc} 
                                        onChange={(e) => setTempDesc(e.target.value)} 
                                    />
                                </div>
                                <label className="btn btn-primary btn-sm gap-1 cursor-pointer">
                                    <UploadCloud size={16} /> Subir
                                    <input type="file" className="hidden" onChange={onAddExtraFile} />
                                </label>
                            </div>

                            {extrasTemp.length > 0 && (
                                <div className="flex flex-col gap-2 mt-4">
                                    {extrasTemp.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-primary/10 rounded-lg border border-primary/20 text-xs">
                                            <span className="font-medium truncate">{item.file.name} ({item.descripcion})</span>
                                            <button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => onRemoveExtraTemp(idx)}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-base-300">
                            <button type="button" className="btn btn-ghost" onClick={cerrarModal}>Cancelar</button>
                            <button type="submit" className="btn btn-primary px-8 flex items-center gap-2">
                                <Save size={18} />
                                {docEditar ? 'Guardar Cambios' : 'Registrar Expediente'}
                            </button>
                        </div>
                    </form>
                </div>
                <div className="modal-backdrop" onClick={cerrarModal}></div>
            </div>
        )}
    </div>
    </>
  );
};

export default ListaDocumentos;
