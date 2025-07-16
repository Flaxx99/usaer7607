from django.http import HttpResponse
from django.views import View
from django.shortcuts import redirect, render, get_object_or_404
from django.forms import modelformset_factory
from django.contrib.auth.mixins import LoginRequiredMixin

from .models import RegistroRAE, RAEAlumno
from alumnos.models import Alumno
from .forms import RAEAlumnoBaseFormSet, RAEAlumnoForm
from usuarios.models import User

import openpyxl
from openpyxl.utils import get_column_letter
from openpyxl.styles import Font, Alignment

# Definir formset una sola vez
RAEAlumnoFormSet = modelformset_factory(
    RAEAlumno,
    form=RAEAlumnoForm,
    formset=RAEAlumnoBaseFormSet,
    extra=0
)

class CapturaRAEView(LoginRequiredMixin, View):
    template_name = 'rae/captura.html'

    def get_queryset(self, registro, alumnos_maestra):
        for alumno in alumnos_maestra:
            RAEAlumno.objects.get_or_create(
                registro=registro,
                alumno=alumno,
                defaults={
                    'capturado_por': self.request.user,
                    'curp': alumno.curp,
                    'genero': alumno.sexo,
                    'edad': alumno.edad,
                    'grado': f"{alumno.grado}°{alumno.grupo}"
                }
            )
        return RAEAlumno.objects.filter(registro=registro, alumno__in=alumnos_maestra)

    def get_context_data(self, formset, registro):
        return {
            'formset': formset,
            'registro': registro,
            'grupo_discapacidad': ["ceg","bv","so","hp","scg","dmo","di","dme","dm"],
            'grupo_dificultades': ["dsc","dsco","dsa"],
            'grupo_trastornos': ["tda","tea"],
            'grupo_aptitudes': ["asi","asc","asa","asp","ass"],
            'grupo_otras': ["ot"],
            'grupo_apoyos': [
                "psicologia","comunicacion","psicomotricidad",
                "trabajo_social","aprendizaje","nuevo_ingreso","subsecuente"
            ],
            'grupo_portafolio': [
                "diagnostico","educativo","deteccion",
                "psicopedagogico","plan","modelo"
            ],
        }

    def get(self, request, *args, **kwargs):
        escuela = request.user.escuela
        if not escuela:
            return render(request, self.template_name, {'error': 'No tienes una escuela asignada.'})

        registro, _ = RegistroRAE.objects.get_or_create(
            escuela=escuela,
            defaults={'creado_por': request.user}
        )
        alumnos_maestra = Alumno.objects.filter(profesor=request.user)
        queryset = self.get_queryset(registro, alumnos_maestra)

        formset = RAEAlumnoFormSet(
            queryset=queryset,
            prefix="form"
        )
        return render(request, self.template_name, self.get_context_data(formset, registro))

    def post(self, request, *args, **kwargs):
        escuela = request.user.escuela
        registro = get_object_or_404(RegistroRAE, escuela=escuela)
        alumnos_maestra = Alumno.objects.filter(profesor=request.user)
        queryset = self.get_queryset(registro, alumnos_maestra)

        formset = RAEAlumnoFormSet(data=request.POST, queryset=queryset, prefix="form")
        if formset.is_valid():
            print("✔️ Formset válido")
            instances = formset.save(commit=False)
            for inst in instances:
                inst.registro = registro
                inst.capturado_por = request.user
                inst.curp = inst.alumno.curp
                inst.genero = inst.alumno.sexo
                inst.edad = inst.alumno.edad
                inst.grado = f"{inst.alumno.grado}°{inst.alumno.grupo}"
                inst.save()
            formset.save_m2m()
            print("✔️ Datos guardados correctamente")
            return redirect('rae:captura')
        else:
            print("❌ Formset inválido")
            print(formset.errors)
            return render(request, self.template_name, self.get_context_data(formset, registro))

class ExportRAEExcelView(View):
    def get(self, request, *args, **kwargs):
        user = request.user

        # Solo admin o secretario pueden exportar todo
        if user.role in [User.Role.ADMINISTRADOR, User.Role.SECRETARIO]:
            registros = RegistroRAE.objects.select_related('escuela').all()
        else:
            if not user.escuela:
                return HttpResponse("No tienes escuela asignada.")
            registros = RegistroRAE.objects.filter(escuela=user.escuela)

        wb = openpyxl.Workbook()
        default_sheet = wb.active
        default_sheet.title = "RAE"

        first = True
        contador_global = 0

        for registro in registros:
            escuela = registro.escuela
            alumnos = RAEAlumno.objects.filter(registro=registro).select_related('alumno')

            if not alumnos.exists():
                continue

            ws = default_sheet if first else wb.create_sheet(title=escuela.nombre[:31])
            first = False

            # Encabezado superior
            ws.append(["ESCUELA:", escuela.nombre])
            ws.append(["NIVEL:", escuela.nivel])
            ws.append(["ZONA ESCOLAR:", escuela.zona])
            ws.append(["CCT:", escuela.cct])
            ws.append(["DIRECCIÓN:", escuela.domicilio])
            ws.append([])
            ws.append([])

            # Cabecera de tabla
            encabezados = [
                "No.", "Nombre", "Género", "Edad", "Grado-Grupo", "CURP",
                # Discapacidad (9)
                "CEG", "BV", "SO", "HP", "SCG", "DMO", "DI", "DME", "DM",
                # Dificultades severas (3)
                "DSC", "DSCO", "DSA",
                # Trastornos (2)
                "TDAH", "TEA",
                # Aptitudes sobresalientes (5)
                "ASI", "ASC", "ASA", "ASP", "ASS",
                # Otra (1)
                "OTRA",
                # Apoyos específicos (7)
                "PSICOLOGÍA", "COMUNICACIÓN", "PSICOMOTRICIDAD", "TS", "APRENDIZAJE", "NVO ING.", "SUBSEQ.",
                # Portafolio (6)
                "DIAG. MÉD", "DIAG. EDU", "INFORME", "PSICOPED", "PLAN", "MODELO",
                # Docente
                "DOCENTE"
            ]
            ws.append(encabezados)
            header_row = ws.max_row

            # Estilos de encabezado
            for col_num in range(1, len(encabezados) + 1):
                cell = ws.cell(row=header_row, column=col_num)
                cell.font = Font(bold=True)
                cell.alignment = Alignment(horizontal='center')

            # Fila por alumno
            contador = 0
            for alumno in alumnos:
                contador_global += 1
                contador += 1

                row = [
                    contador,
                    str(alumno.alumno),  # nombre
                    alumno.genero,
                    alumno.edad,
                    alumno.grado,
                    alumno.curp,
                    # Condición
                    *[ "X" if getattr(alumno, f) else "" for f in [
                        "ceg", "bv", "so", "hp", "scg", "dmo", "di", "dme", "dm",
                        "dsc", "dsco", "dsa",
                        "tda", "tea",
                        "asi", "asc", "asa", "asp", "ass",
                        "ot",
                        "psicologia", "comunicacion", "psicomotricidad",
                        "trabajo_social", "aprendizaje", "nuevo_ingreso", "subsecuente",
                        "diagnostico", "educativo", "deteccion", "psicopedagogico", "plan", "modelo"
                    ]],
                    alumno.capturado_por.get_full_name() if alumno.capturado_por else ""
                ]

                ws.append(row)

                # Alineación: nombre y curp → izquierda; resto centrado
                for idx in range(1, len(row)+1):
                    cell = ws.cell(row=ws.max_row, column=idx)
                    if idx in (2, 6):
                        cell.alignment = Alignment(horizontal='left')
                    else:
                        cell.alignment = Alignment(horizontal='center')

            # Ajuste de ancho
            for col_cells in ws.columns:
                max_len = max(len(str(c.value or "")) for c in col_cells)
                ws.column_dimensions[get_column_letter(col_cells[0].column)].width = max_len + 2

            # Congelar encabezado
            ws.freeze_panes = f"A{header_row + 1}"

        # Si no hubo ninguna escuela con datos
        if first:
            default_sheet.append(["No hay registros para exportar."])

        # Descargar archivo
        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = 'attachment; filename="RAE_por_escuela.xlsx"'
        wb.save(response)
        return response