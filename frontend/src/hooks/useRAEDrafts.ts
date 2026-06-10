import { useState, useEffect } from 'react';

type RAEFieldValue = boolean | string | number | null | undefined;

export interface RAEChanges {
    [alumnoId: number]: Record<string, RAEFieldValue>;
}

export function useRAEDrafts(id: string) {
    const storageKey = `rae_drafts_${id}`;
    const dirtyKey = `${storageKey}_dirty`;

    const [drafts, setDrafts] = useState<RAEChanges>(() => {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : {};
    });

    const [dirtyRows, setDirtyRows] = useState<Set<number>>(() => {
        const saved = localStorage.getItem(dirtyKey);
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(drafts));
    }, [drafts, storageKey]);

    useEffect(() => {
        localStorage.setItem(dirtyKey, JSON.stringify(Array.from(dirtyRows)));
    }, [dirtyRows, storageKey, dirtyKey]);

    const updateField = (alumnoId: number, field: string, value: RAEFieldValue) => {
        setDrafts(prev => {
            const current = prev[alumnoId] || {};
            // Only update if value actually changed to avoid unnecessary re-renders
            if (current[field] === value) return prev;
            
            return {
                ...prev,
                [alumnoId]: { ...current, [field]: value }
            };
        });
        setDirtyRows(prev => new Set(prev).add(alumnoId));
    };

    const clearDrafts = () => {
        setDrafts({});
        setDirtyRows(new Set());
        localStorage.removeItem(storageKey);
        localStorage.removeItem(dirtyKey);
    };

    const getFieldValue = (alumnoId: number, field: string, originalValue: RAEFieldValue) => {
        return drafts[alumnoId]?.[field] ?? originalValue;
    };

    return {
        drafts,
        dirtyRows,
        updateField,
        clearDrafts,
        getFieldValue
    };
}
