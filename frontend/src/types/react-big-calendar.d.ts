declare module 'react-big-calendar' {
  export type View = 'month' | 'week' | 'work_week' | 'day' | 'agenda';

  export interface CalendarProps {
    localizer: object;
    events: object[];
    startAccessor: string | ((event: object) => Date);
    endAccessor: string | ((event: object) => Date);
    titleAccessor?: string | ((event: object) => string);
    tooltipAccessor?: string | ((event: Record<string, unknown>) => string);
    style?: React.CSSProperties;
    defaultView?: View;
    view?: View;
    onView?: (view: View) => void;
    views?: View[];
    formats?: Record<string, unknown>;
    eventPropGetter?: (event: Record<string, unknown>, start: Date, end: Date, isSelected: boolean) => { style?: React.CSSProperties; className?: string };
    dayPropGetter?: (date: Date) => { style?: React.CSSProperties; className?: string };
    onSelectEvent?: (event: object) => void;
    onSelectSlot?: (slotInfo: Record<string, unknown>) => void;
    selectable?: boolean;
    popup?: boolean;
    resizable?: boolean;
    onEventDrop?: (data: object) => void;
    onEventResize?: (data: object) => void;
    messages?: Record<string, string | ((count: number) => string)>;
    components?: {
      toolbar?: React.ComponentType<Record<string, unknown>>;
    };
  }

  export const Calendar: React.ComponentType<CalendarProps>;
  export const dateFnsLocalizer: (config: object) => object;
  export const Views: Record<string, View>;
  export const Navigate: Record<string, string>;
}

declare module 'react-big-calendar/lib/addons/dragAndDrop' {
  import type { CalendarProps } from 'react-big-calendar';
  export default function withDragAndDrop(
    Calendar: React.ComponentType<CalendarProps>
  ): React.ComponentType<CalendarProps>;
}
