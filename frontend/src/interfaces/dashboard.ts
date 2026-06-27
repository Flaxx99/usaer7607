// src/interfaces/dashboard.ts
//
// Tipos de datos re-exportados desde api.ts (generado desde pydantic).
// StatCardProps es un tipo puramente de UI, sin equivalente en backend.

export type {
    AvisoDTO as Aviso,
    StatsDTO as DashboardStats,
    GraficaEscuelaEntry as GraficaEscuela,
    ChartEntry,
    DashboardData,
} from './api';

export interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    description: string;
    highlight?: boolean;
    pulse?: boolean;
}
