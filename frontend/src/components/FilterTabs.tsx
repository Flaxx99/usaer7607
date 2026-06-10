import type { LucideIcon } from 'lucide-react';

export interface FilterTab {
  value: string;
  label: string;
  icon?: LucideIcon;
}

interface FilterTabsProps {
  tabs: FilterTab[];
  value: string;
  onChange: (value: string) => void;
  color?: 'primary' | 'warning' | 'info' | 'secondary';
}

/**
 * DaisyUI tabs-bordered row for filtering.
 * 
 * Usage:
 * ```tsx
 * <FilterTabs
 *   tabs={[
 *     { value: 'TODOS', label: 'Todos', icon: Folder },
 *     { value: 'PENDIENTE', label: 'Pendientes', icon: Clock },
 *   ]}
 *   value={filtroEstado}
 *   onChange={setFiltroEstado}
 *   color="warning"
 * />
 * ```
 */
export function FilterTabs({
  tabs,
  value,
  onChange,
  color = 'primary',
}: FilterTabsProps) {
  const activeClass: Record<string, string> = {
    primary: 'tab-active !bg-primary !text-primary-content',
    warning: 'tab-active !bg-warning !text-warning-content',
    info: 'tab-active !bg-info !text-info-content',
    secondary: 'tab-active !bg-secondary !text-secondary-content',
  };

  return (
    <div className="flex gap-1" role="tablist" aria-label="Filtros">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = value === tab.value;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            className={`tab tab-bordered transition-all gap-1.5 ${
              isActive ? activeClass[color] : 'tab-inactive'
            }`}
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
          >
            {Icon && <Icon size={16} />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
