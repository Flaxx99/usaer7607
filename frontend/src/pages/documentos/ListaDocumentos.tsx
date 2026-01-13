import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { 
    Plus, Search, FolderOpen, Edit2, Trash2, 
    FileText, Save, Paperclip, X, UploadCloud
} from 'lucide-react';
import Swal from 'sweetalert2';

// IMPORTACIONES CORREGIDAS
import { 
    getDocumentos, createDocumento, updateDocumento, 
    deleteDocumento, deleteArchivoExtra 
} from '../../api/documentos';
import { getAlumnos } from '../../api/alumnos';
import type { Expediente } from '../../interfaces/documentos';

import Modal from '../../components/Modal';

const ListaDocumentos = () => {
  const [busqueda, setBusqueda] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docEditar, setDocEditar] = useState<Expediente | null>(null);
  
  // Estado para archivos extra NUEVOS
  const [extrasTemp, setExtrasTemp] = useState<{file: File, descripcion: string}[]>([]);
  const [tempDesc, setTempDesc] = useState('');

  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Expediente>();

  // --- QUERIES ---
  const { data: documentos, isLoading } = useQuery({
    queryKey: ['documentos'],
    queryFn: getDocumentos,
  });

  const { data: alumnos } = useQuery({
    queryKey: ['alumnos'],
    queryFn: getAlumnos,
  });

  // --- MUTACIONES ---
  const createMutation = useMutation({
    mutationFn: createDocumento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      cerrarModal();
      Swal.fire('Guardado', 'Expediente creado correctamente', 'success');
    },
    onError: () => Swal.fire('Error', 'No se pudo crear el expediente', 'error')
  });

  const updateMutation = useMutation({
    mutationFn: updateDocumento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      cerrarModal();
      Swal.fire('Actualizado', 'Expediente actualizado', 'success');
    },
    onError: () => Swal.fire('Error', 'No se pudo actualizar', 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocumento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      Swal.fire('Eliminado', 'Expediente borrado', 'success');
    }
  });

  const deleteExtraMutation = useMutation({
    mutationFn: ({ expId, archId }: { expId: number, archId: number }) => deleteArchivoExtra(expId, archId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      if (docEditar) {
         Swal.fire('Archivo eliminado', '', 'success');
         cerrarModal();
      }
    }
  });

  // --- FUNCIONES ---
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
        setExtrasTemp([...extrasTemp, { file, descripcion: tempDesc }]);
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
    Swal.fire({
      title: '¿Eliminar Expediente?', text: "Se borrarán todos los archivos asociados.", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, eliminar'
    }).then((r) => { if (r.isConfirmed) deleteMutation.mutate(id); });
  };

  const handleDeleteExtraReal = (archivoId: number) => {
     if(!docEditar) return;
     Swal.fire({
        title: '¿Borrar anexo?', text: "Se eliminará permanentemente.", icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Borrar'
     }).then((r) => { 
         if (r.isConfirmed) {
             deleteExtraMutation.mutate({ expId: docEditar.id, archId: archivoId });
         }
     });
  };

  const documentosFiltrados = documentos?.filter(e => 
    e.alumno_nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
    e.profesor_nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (isLoading) return <div className="p-8 text-center text-primary">Cargando documentos...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <FolderOpen className="text-primary" /> Documentos y Expedientes
          </h1>
          <p className="text-text-secondary">Gestión de archivos por alumno</p>
        </div>
        <button onClick={handleOpenCreate} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm font-medium">
          <Plus size={20} /> Nuevo Expediente
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" placeholder="Buscar por alumno o profesor..." 
          className="flex-1 bg-transparent outline-none"
          value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documentosFiltrados?.map((doc) => (
          <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow p-5 flex flex-col">
            
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-bold text-lg text-text-main">{doc.alumno_nombre}</h3>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        Prof. {doc.profesor_nombre}
                    </span>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => handleOpenEdit(doc)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                </div>
            </div>

            <div className="space-y-2 mb-4 flex-1">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Documentos Base</div>
                
                <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${doc.informe_deteccion ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400'}`}>
                    <FileText size={16} />
                    <span className="truncate flex-1">Detección Inicial</span>
                    {doc.informe_deteccion && (
                        <a href={doc.informe_deteccion as string} target="_blank" rel="noreferrer" className="text-green-600 hover:underline text-xs font-bold">VER</a>
                    )}
                </div>

                <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${doc.informe_psicopedagogico ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-400'}`}>
                    <FileText size={16} />
                    <span className="truncate flex-1">Inf. Psicopedagógico</span>
                    {doc.informe_psicopedagogico && (
                        <a href={doc.informe_psicopedagogico as string} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs font-bold">VER</a>
                    )}
                </div>

                <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${doc.plan_intervencion ? 'bg-purple-50 text-purple-700' : 'bg-slate-50 text-slate-400'}`}>
                    <FileText size={16} />
                    <span className="truncate flex-1">Plan Intervención</span>
                    {doc.plan_intervencion && (
                        <a href={doc.plan_intervencion as string} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline text-xs font-bold">VER</a>
                    )}
                </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-sm text-slate-500">
                <div className="flex items-center gap-1">
                    <Paperclip size={14} />
                    <span>{doc.otros_archivos?.length || 0} Anexos</span>
                </div>
                <div className="text-xs">{doc.fecha_subida ? new Date(doc.fecha_subida).toLocaleDateString() : ''}</div>
            </div>

          </div>
        ))}
      </div>

      {documentosFiltrados?.length === 0 && (
         <div className="p-10 text-center text-slate-400 italic">No hay documentos registrados.</div>
      )}


      {/* --- MODAL --- */}
      <Modal isOpen={isModalOpen} onClose={cerrarModal} title={docEditar ? "Editar Expediente" : "Nuevo Expediente"} maxWidth="max-w-4xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* 1. SELECCIÓN DE ALUMNO */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="block text-sm font-bold text-slate-700 mb-1">Alumno</label>
                <select 
                    {...register('alumno', { required: "Selecciona un alumno" })}
                    disabled={!!docEditar} 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white disabled:bg-slate-200 outline-none focus:border-primary"
                >
                    <option value="">-- Seleccionar --</option>
                    {alumnos?.map(a => (
                        <option key={a.id} value={a.id}>{a.nombres} {a.apellido_paterno} {a.apellido_materno}</option>
                    ))}
                </select>
                {errors.alumno && <span className="text-red-500 text-xs">Requerido</span>}
            </div>

            {/* 2. ARCHIVOS PRINCIPALES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-dashed border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Informe Detección</label>
                    <input type="file" {...register('informe_deteccion')} className="text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
                    {docEditar?.informe_deteccion && <p className="text-xs text-green-600 mt-2 font-medium">✓ Archivo cargado</p>}
                </div>

                <div className="p-4 border border-dashed border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Inf. Psicopedagógico</label>
                    <input type="file" {...register('informe_psicopedagogico')} className="text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    {docEditar?.informe_psicopedagogico && <p className="text-xs text-blue-600 mt-2 font-medium">✓ Archivo cargado</p>}
                </div>

                <div className="p-4 border border-dashed border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Plan Intervención</label>
                    <input type="file" {...register('plan_intervencion')} className="text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
                    {docEditar?.plan_intervencion && <p className="text-xs text-purple-600 mt-2 font-medium">✓ Archivo cargado</p>}
                </div>
            </div>

            {/* 3. OBSERVACIONES */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Observaciones</label>
                <textarea {...register('observaciones')} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20" placeholder="Notas adicionales..." />
            </div>

            {/* 4. ANEXOS / EXTRAS */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                    <Paperclip size={16} /> Archivos Anexos (Extras)
                </h3>

                {/* Lista Existentes */}
                {docEditar && docEditar.otros_archivos && docEditar.otros_archivos.length > 0 && (
                    <div className="mb-4 space-y-2">
                        <p className="text-xs text-slate-400 uppercase font-bold">Archivos Guardados:</p>
                        {docEditar.otros_archivos.map(archivo => (
                            <div key={archivo.id} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200 text-sm">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <FileText size={14} className="text-slate-400 shrink-0"/>
                                    <a href={archivo.url_archivo || '#'} target="_blank" rel="noreferrer" className="truncate text-blue-600 hover:underline font-medium">
                                        {archivo.nombre_archivo}
                                    </a>
                                    <span className="text-slate-400 text-xs italic">- {archivo.descripcion || 'Sin descripción'}</span>
                                </div>
                                <button type="button" onClick={() => handleDeleteExtraReal(archivo.id)} className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Subir Nuevos */}
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-2">Agregar Nuevo Anexo:</p>
                    <div className="flex gap-2 mb-2">
                        <input 
                            type="text" 
                            placeholder="Descripción (ej. Entrevista padres)" 
                            className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-primary"
                            value={tempDesc}
                            onChange={(e) => setTempDesc(e.target.value)}
                        />
                        <div className="relative">
                            <input 
                                type="file" 
                                id="file-extra" 
                                className="hidden" 
                                onChange={onAddExtraFile} 
                            />
                            <label htmlFor="file-extra" className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-sm flex items-center gap-1 font-medium transition-colors">
                                <UploadCloud size={16} /> Seleccionar
                            </label>
                        </div>
                    </div>

                    {extrasTemp.length > 0 && (
                        <div className="space-y-1 mt-2">
                            {extrasTemp.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                    <span>{item.file.name} <span className="opacity-70">({item.descripcion})</span></span>
                                    <button type="button" onClick={() => onRemoveExtraTemp(idx)} className="hover:text-red-600"><X size={14}/></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* BOTONES */}
            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={cerrarModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
                <button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending} 
                    className="bg-primary text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Save size={18} /> Guardar
                </button>
            </div>

        </form>
      </Modal>

    </div>
  );
};

export default ListaDocumentos;