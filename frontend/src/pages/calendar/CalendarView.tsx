import { useMemo, useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import type { View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, List, LayoutGrid } from 'lucide-react';
import type { CalendarEvent } from '../../interfaces/calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const DragAndDropCalendar = withDragAndDrop(Calendar);

// ── Localizer con date-fns en español ──
const locales = { es };
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
    getDay,
    locales,
});

interface CalendarViewProps {
    events: CalendarEvent[];
    onSelectEvent: (event: CalendarEvent) => void;
    onSelectSlot: (start: Date) => void;
    onEventDrop?: (data: { event: CalendarEvent; start: Date; end: Date }) => void;
    onEventResize?: (data: { event: CalendarEvent; start: Date; end: Date }) => void;
}

const VIEW_LABELS: Record<View, string> = {
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
};

const VIEW_ICONS: Record<View, React.ReactNode> = {
    month: <CalendarDays size={14} />,
    week: <LayoutGrid size={14} />,
    day: <List size={14} />,
    agenda: <List size={14} />,
};

// Mapea el color del evento al estilo de fondo
const eventPropGetter = (event: CalendarEvent) => ({
    style: {
        backgroundColor: event.color || '#3B82F6',
        borderRadius: '6px',
        border: 'none',
        color: '#fff',
        fontSize: '0.75rem',
        fontWeight: 600,
        padding: '2px 4px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
    },
});

// Día actual y fines de semana (inhábiles en gobierno)
const dayPropGetter = (date: Date) => {
    const today = new Date();
    const isToday =
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();
    const dayOfWeek = date.getDay(); // 0=domingo, 6=sábado
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const style: React.CSSProperties = {};

    if (isToday) {
        style.backgroundColor = 'rgba(var(--p), 0.06)';
    }

    if (isWeekend && !isToday) {
        style.backgroundColor = 'hsl(var(--b2) / 0.45)';
    }

    return { style };
};

// Formato personalizado para los títulos en español
const formats = {
    monthHeaderFormat: (date: Date) => format(date, "MMMM yyyy", { locale: es }),
    dayHeaderFormat: (date: Date) => format(date, "d 'de' MMMM 'de' yyyy", { locale: es }),
    dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
        `${format(start, "d MMM", { locale: es })} — ${format(end, "d MMM, yyyy", { locale: es })}`,
    agendaHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
        `${format(start, "d MMM", { locale: es })} — ${format(end, "d MMM, yyyy", { locale: es })}`,
    weekdayFormat: (date: Date) => format(date, 'EEE', { locale: es }),
    dateFormat: (date: Date) => format(date, 'd', { locale: es }),
};

// Toolbar personalizado con navegación en español y diseño daisyUI
const CustomToolbar = ({ label, onNavigate, onView, view }: {
    label: string;
    onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
    onView: (view: View) => void;
    view: View;
}) => (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-5 pb-4 border-b-2 border-base-200">
        <div className="flex items-center gap-1.5">
            <button
                className="btn btn-ghost btn-sm btn-square text-base-content/60 hover:text-base-content"
                onClick={() => onNavigate('PREV')}
                title="Anterior"
            >
                <ChevronLeft size={18} />
            </button>
            <span className="text-xl font-bold text-base-content min-w-[180px] text-center select-none">
                {label}
            </span>
            <button
                className="btn btn-ghost btn-sm btn-square text-base-content/60 hover:text-base-content"
                onClick={() => onNavigate('NEXT')}
                title="Siguiente"
            >
                <ChevronRight size={18} />
            </button>
        </div>

        <div className="flex items-center gap-2">
            <button
                className="btn btn-ghost btn-sm text-base-content/70 hover:text-base-content"
                onClick={() => onNavigate('TODAY')}
            >
                Hoy
            </button>
            <div className="tabs tabs-box bg-base-200 p-0.5 gap-0">
                {(['month', 'week', 'day', 'agenda'] as View[]).map(v => (
                    <button
                        key={v}
                        className={`tab tab-sm gap-1.5 min-w-[68px] ${view === v ? 'tab-active bg-base-100 shadow-sm rounded-md' : 'text-base-content/60 hover:text-base-content'}`}
                        onClick={() => onView(v)}
                    >
                        {VIEW_ICONS[v]}
                        {VIEW_LABELS[v]}
                    </button>
                ))}
            </div>
        </div>
    </div>
);

const CalendarView = ({ events, onSelectEvent, onSelectSlot, onEventDrop, onEventResize }: CalendarViewProps) => {
    const [currentView, setCurrentView] = useState<View>('month');

    const calendarEvents = useMemo(() =>
        events.map(e => ({
            ...e,
            start: new Date(e.start_time),
            end: new Date(e.end_time),
        })),
        [events]
    );

    const handleViewChange = (view: View) => {
        setCurrentView(view);
    };

    return (
        <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-5" style={{ minHeight: 600 }}>
            <style>{`
                /* ═══════════════════════════════════
                   react-big-calendar — daisyUI theme
                   ═══════════════════════════════════ */

                .rbc-calendar { font-family: inherit; }

                /* ── Toolbar ── */
                .rbc-toolbar {
                    display: flex; flex-wrap: wrap; align-items: center;
                    justify-content: space-between; gap: 0.5rem;
                    padding: 0 0 0.75rem 0;
                    margin-bottom: 0;
                    border-bottom: 1px solid hsl(var(--b3));
                }
                .rbc-toolbar .rbc-toolbar-label {
                    flex-grow: 1; text-align: center;
                    font-weight: 700; font-size: 1.05rem;
                    letter-spacing: -0.01em;
                    color: hsl(var(--bc));
                }
                .rbc-toolbar .rbc-btn-group {
                    display: inline-flex; align-items: center;
                    background-color: hsl(var(--b2));
                    padding: 3px; border-radius: 0.5rem; gap: 0;
                }
                .rbc-toolbar .rbc-btn-group > button {
                    display: inline-flex; align-items: center; justify-content: center;
                    gap: 0.25rem; height: 2rem;
                    padding: 0.25rem 0.65rem;
                    font-size: 0.8rem; font-weight: 600;
                    color: hsl(var(--bc) / 0.6);
                    background: transparent;
                    border: 1px solid transparent;
                    border-radius: calc(0.5rem - 2px);
                    cursor: pointer;
                    transition: all 0.12s ease;
                    white-space: nowrap;
                }
                .rbc-toolbar .rbc-btn-group > button:hover {
                    color: hsl(var(--bc));
                }
                .rbc-toolbar .rbc-btn-group > button.rbc-active {
                    background: hsl(var(--b1));
                    color: hsl(var(--bc));
                    border-color: hsl(var(--b3));
                    box-shadow: 0 1px 3px rgb(0 0 0 / 0.08);
                }
                .rbc-toolbar > button {
                    display: inline-flex; align-items: center; justify-content: center;
                    gap: 0.25rem; height: 2rem;
                    padding: 0 0.75rem;
                    font-size: 0.8rem; font-weight: 600;
                    color: hsl(var(--bc) / 0.7);
                    background: transparent;
                    border: 1px solid transparent;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    transition: all 0.12s ease;
                }
                .rbc-toolbar > button:hover {
                    background: hsl(var(--b2));
                    color: hsl(var(--bc));
                }
                .rbc-toolbar > button:active,
                .rbc-toolbar .rbc-btn-group > button:active {
                    transform: translateY(1px);
                }
                .rbc-btn-group button + button { margin-left: 0; }

                /* ── Month view ── */
                .rbc-month-view { border: none; }
                .rbc-month-header { border-bottom: none; }

                /* ── Grilla visible ── */
                /* Bordes de filas */
                .rbc-month-row {
                    border-top: 1px solid hsl(var(--b3) / 0.7);
                }
                .rbc-month-row + .rbc-month-row {
                    border-top: 1px solid hsl(var(--b3) / 0.7);
                }

                /* Cabeceras de días */
                .rbc-header {
                    padding: 0.6rem 0.4rem;
                    font-weight: 700;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    color: hsl(var(--bc) / 0.5);
                    border-bottom: 2px solid hsl(var(--b3));
                    border-right: 1px solid hsl(var(--b3) / 0.6);
                }
                .rbc-header:last-child { border-right: none; }
                .rbc-header + .rbc-header { border-left: none; }

                /* Sábado -> header azul grisáceo */
                .rbc-header:nth-child(6) {
                    color: hsl(var(--bc) / 0.4);
                    background: hsl(var(--b2) / 0.3);
                }
                /* Domingo -> header rojo suave */
                .rbc-header:nth-child(7) {
                    color: hsl(var(--er) / 0.7);
                    background: hsl(var(--er) / 0.06);
                }

                /* Celdas de día */
                .rbc-day-bg {
                    border-right: 1px solid hsl(var(--b3) / 0.5);
                }
                .rbc-day-bg:last-child { border-right: none; }
                .rbc-day-bg:hover {
                    background-color: hsl(var(--p) / 0.04) !important;
                    cursor: pointer;
                }

                /* Off-range */
                .rbc-off-range-bg {
                    background: hsl(var(--b2) / 0.5);
                }
                .rbc-off-range {
                    color: hsl(var(--bc) / 0.3);
                }

                /* Today: borde izquierdo primary + diagonal stripes */
                .rbc-today {
                    background-image: repeating-linear-gradient(
                        -45deg,
                        transparent 0 10px,
                        hsl(var(--p) / 0.05) 10px 12px
                    );
                    outline: 2px solid hsl(var(--p) / 0.15);
                    outline-offset: -1px;
                }

                /* Números de fecha */
                .rbc-date-cell {
                    padding: 6px 6px 0;
                    text-align: right;
                    font-size: 0.85rem;
                    font-weight: 600;
                }
                .rbc-date-cell a {
                    color: hsl(var(--bc) / 0.7);
                    text-decoration: none;
                    transition: color 0.12s ease;
                    padding: 2px 4px;
                }
                .rbc-date-cell a:hover { color: hsl(var(--p)); }
                .rbc-date-cell.rbc-now a {
                    color: #fff;
                    font-weight: 800;
                    background: hsl(var(--p));
                    display: inline-flex;
                    width: 28px; height: 28px;
                    align-items: center;
                    justify-content: center;
                    border-radius: 999px;
                    box-shadow: 0 2px 6px hsl(var(--p) / 0.3);
                }
                /* Los domingos se manejan vía dayPropGetter */

                /* ── Eventos (vista mes) ── */
                .rbc-event {
                    padding: 0 !important;
                    border-radius: 5px !important;
                    border: none !important;
                    box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
                    transition: box-shadow 0.15s ease, transform 0.1s ease;
                }
                .rbc-event:hover {
                    box-shadow: 0 3px 8px rgb(0 0 0 / 0.15);
                    transform: translateY(-1px);
                }
                .rbc-event:active { transform: translateY(1px); }
                .rbc-event.rbc-selected {
                    box-shadow: 0 0 0 2px hsl(var(--p)), 0 3px 8px rgb(0 0 0 / 0.15);
                }
                .rbc-event-label { display: none; }
                .rbc-row-segment { padding: 0 1px 1px; }

                /* Show more */
                .rbc-show-more {
                    background: transparent;
                    color: hsl(var(--p));
                    font-weight: 600;
                    font-size: 0.7rem;
                    padding: 2px 6px;
                    border-radius: 4px;
                    transition: background 0.12s ease;
                }
                .rbc-show-more:hover {
                    background: hsl(var(--p) / 0.1);
                    color: hsl(var(--pf));
                    text-decoration: none;
                }

                /* Selected cell */
                .rbc-selected-cell {
                    background-color: hsl(var(--p) / 0.07);
                }

                /* ── Popup overlay (+N más) ── */
                .rbc-overlay {
                    background: hsl(var(--b1));
                    border: 1px solid hsl(var(--b3));
                    border-radius: 0.75rem;
                    padding: 0.5rem;
                    box-shadow: 0 8px 30px rgb(0 0 0 / 0.15);
                    z-index: 50;
                }
                .rbc-overlay-header {
                    border-bottom: 1px solid hsl(var(--b3));
                    margin: -0.5rem -0.5rem 0.375rem;
                    padding: 0.5rem 0.75rem;
                    font-weight: 700;
                    font-size: 0.8rem;
                    color: hsl(var(--bc));
                }

                /* ── Week & Day views ── */
                .rbc-time-view {
                    border: 1px solid hsl(var(--b3));
                    border-radius: 0.75rem;
                    overflow: hidden;
                }
                .rbc-time-header {
                    border-bottom: 2px solid hsl(var(--b3));
                }
                .rbc-time-header > .rbc-row > .rbc-header {
                    border-bottom: none;
                    padding: 0.5rem;
                    font-size: 0.7rem;
                }
                .rbc-time-header > .rbc-row > .rbc-header:last-child {
                    background: hsl(var(--er) / 0.06);
                    color: hsl(var(--er) / 0.7);
                }
                .rbc-time-header-gutter { min-width: 50px; }
                .rbc-timeslot-group {
                    border-bottom: 1px solid hsl(var(--b3) / 0.3);
                    min-height: 40px;
                }
                .rbc-time-content {
                    border-top: 2px solid hsl(var(--b3));
                }
                .rbc-time-gutter .rbc-timeslot-group {
                    font-size: 0.7rem;
                    color: hsl(var(--bc) / 0.45);
                    font-weight: 500;
                }
                .rbc-label { padding: 0 6px; }
                .rbc-time-slot {
                    border-top: 1px solid hsl(var(--b3) / 0.15);
                }
                .rbc-current-time-indicator {
                    background-color: hsl(var(--er));
                    height: 2px;
                    z-index: 3;
                }
                .rbc-slot-selection {
                    background-color: hsl(var(--p) / 0.15);
                    border: 1px solid hsl(var(--p) / 0.3);
                    border-radius: 4px;
                    z-index: 10;
                }

                /* ── Day view events ── */
                .rbc-day-slot .rbc-event {
                    border: none !important;
                    border-radius: 4px !important;
                    min-height: 20px;
                }
                .rbc-day-slot .rbc-event-content {
                    font-size: 0.75rem;
                    font-weight: 600;
                    padding: 1px 3px;
                    line-height: 1.2;
                }

                /* ── Agenda view ── */
                .rbc-agenda-view {
                    border: 1px solid hsl(var(--b3));
                    border-radius: 0.75rem;
                    overflow: hidden;
                }
                .rbc-agenda-table { border-collapse: collapse; }
                .rbc-agenda-table thead th {
                    background: hsl(var(--b2));
                    padding: 10px 14px;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    color: hsl(var(--bc) / 0.55);
                    font-weight: 700;
                    border-bottom: 2px solid hsl(var(--b3));
                }
                .rbc-agenda-table tbody td {
                    padding: 10px 14px;
                    border-bottom: 1px solid hsl(var(--b3) / 0.3);
                    font-size: 0.85rem;
                }
                .rbc-agenda-table tbody tr:last-child td { border-bottom: none; }
                .rbc-agenda-table tbody tr:hover td {
                    background: hsl(var(--b2) / 0.5);
                }
                .rbc-agenda-time-cell {
                    font-weight: 600;
                    color: hsl(var(--bc) / 0.65);
                }
                .rbc-agenda-empty {
                    color: hsl(var(--bc) / 0.5);
                    display: flex;
                    height: 100%;
                    min-height: 200px;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.9rem;
                }

                /* ── Scrollbar ── */
                .rbc-time-content::-webkit-scrollbar { width: 6px; }
                .rbc-time-content::-webkit-scrollbar-track { background: transparent; }
                .rbc-time-content::-webkit-scrollbar-thumb {
                    background: hsl(var(--bc) / 0.12);
                    border-radius: 3px;
                }
                .rbc-time-content::-webkit-scrollbar-thumb:hover {
                    background: hsl(var(--bc) / 0.22);
                }
            `}</style>

            <DragAndDropCalendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                titleAccessor="title"
                tooltipAccessor={(e: CalendarEvent) =>
                    `${e.title}${e.assigned_to_nombre ? ` — ${e.assigned_to_nombre}` : ''}`
                }
                style={{ height: 580 }}
                defaultView={Views.MONTH}
                view={currentView}
                onView={handleViewChange}
                views={['month', 'week', 'day', 'agenda']}
                formats={formats}
                eventPropGetter={eventPropGetter}
                dayPropGetter={dayPropGetter}
                onSelectEvent={(event) => onSelectEvent(event as unknown as CalendarEvent)}
                onSelectSlot={({ start }) => onSelectSlot(start)}
                selectable
                popup
                resizable
                onEventDrop={(data) => onEventDrop?.(data as { event: CalendarEvent; start: Date; end: Date })}
                onEventResize={(data) => onEventResize?.(data as { event: CalendarEvent; start: Date; end: Date })}
                messages={{
                    next: 'Siguiente',
                    previous: 'Anterior',
                    today: 'Hoy',
                    month: 'Mes',
                    week: 'Semana',
                    day: 'Día',
                    agenda: 'Agenda',
                    date: 'Fecha',
                    time: 'Hora',
                    event: 'Evento',
                    noEventsInRange: 'No hay eventos en este rango.',
                    showMore: (count: number) => `+${count} más`,
                }}
                components={{
                    toolbar: (props) => <CustomToolbar {...props} view={currentView} />,
                }}
            />
        </div>
    );
};

export default CalendarView;
