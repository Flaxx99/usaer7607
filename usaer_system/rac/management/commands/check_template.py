# usaer_system/rac/management/commands/check_template.py

from django.core.management.base import BaseCommand
from django.conf import settings
from openpyxl import load_workbook

class Command(BaseCommand):
    help = 'Revisa la plantilla de Excel de RAC para diagnosticar problemas de formato.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("--- Iniciando revisión de plantilla RAC ---"))
        template_path = settings.BASE_DIR / 'rac' / 'static' / 'excel_templates' / 'rac_template.xlsx'

        self.stdout.write(f"Ruta de la plantilla: {template_path}")

        try:
            wb = load_workbook(template_path)
            self.stdout.write(self.style.SUCCESS("¡Plantilla cargada exitosamente!"))

            sheet_name = 'RAC'
            if sheet_name in wb.sheetnames:
                ws = wb[sheet_name]
                self.stdout.write(f"Hoja '{sheet_name}' encontrada.")
                
                cell_to_check = 'X1'
                cell = ws[cell_to_check]
                self.stdout.write(self.style.WARNING(f"--- Analizando formato de la celda {cell_to_check} ---"))
                
                self.stdout.write(f"Tiene estilo: {cell.has_style}")
                self.stdout.write(f"  - Fuente: {cell.font.name}, Tamaño: {cell.font.sz}, Negrita: {cell.font.b}, Color: {cell.font.color}")
                self.stdout.write(f"  - Bordes:")
                self.stdout.write(f"    - Izquierda: {cell.border.left}")
                self.stdout.write(f"    - Derecha: {cell.border.right}")
                self.stdout.write(f"    - Arriba: {cell.border.top}")
                self.stdout.write(f"    - Abajo: {cell.border.bottom}")
                self.stdout.write(f"  - Relleno: {cell.fill.patternType}, Color de Fondo: {cell.fill.fgColor}, Color de Patrón: {cell.fill.bgColor}")
                self.stdout.write(f"  - Alineación: Horizontal={cell.alignment.horizontal}, Vertical={cell.alignment.vertical}")

            else:
                self.stdout.write(self.style.ERROR(f"Error: La hoja llamada '{sheet_name}' no se encuentra en la plantilla."))

        except FileNotFoundError:
            self.stdout.write(self.style.ERROR("Error: No se encontró el archivo de la plantilla en la ruta especificada."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Ocurrió un error inesperado: {e}"))

        self.stdout.write(self.style.SUCCESS("--- Revisión de plantilla finalizada ---"))
