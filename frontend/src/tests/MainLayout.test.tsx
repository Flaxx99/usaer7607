import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from '../layouts/MainLayout';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Mocks ────────────────────────────────────────────

vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('lucide-react')>();
    const mockIcons = [
        'LayoutDashboard', 'Users', 'School', 'Calendar',
        'Settings', 'AlertTriangle', 'FileCheck', 'Mail', 'Megaphone',
        'FolderOpen', 'ClipboardList', 'BookOpen', 'Clock', 'Layers',
        'LogOut', 'Menu', 'X', 'Bell',
    ];
    const mocks: Record<string, () => JSX.Element> = {};
    for (const name of mockIcons) {
        mocks[name] = () => <div data-testid={`icon-${name}`} />;
    }
    return { ...actual, ...mocks };
});

// ── Helpers ──────────────────────────────────────────

const ALL_LABELS = [
    'Panel Principal', 'Avisos', 'Asistencias', 'Permisos',
    'Incidencias', 'Agenda / Calendario', 'Notificaciones',
];

const ADMIN_LABELS = [
    ...ALL_LABELS,
    'Usuarios', 'Ciclos Escolares', 'Escuelas',
    'Alumnos', 'R.A.C.', 'R.A.E.', 'Documentos', 'Oficios',
];

const SECRETARIO_LABELS = [
    ...ALL_LABELS,
    'Ciclos Escolares', 'Escuelas',
    'Alumnos', 'R.A.C.', 'R.A.E.', 'Documentos', 'Oficios',
];

const MAESTRO_APOYO_VISIBLE = ['Alumnos', 'R.A.C.', 'R.A.E.'];
const MAESTRO_APOYO_HIDDEN = ['Usuarios', 'Ciclos Escolares', 'Escuelas', 'Oficios'];

const ESPECIALISTA_HIDDEN = [
    'Usuarios', 'Ciclos Escolares', 'Escuelas',
    'Alumnos', 'R.A.C.', 'R.A.E.', 'Oficios',
];

const userTemplate = {
    first_name: 'Juan',
    last_name: 'Pérez',
    username: 'jperez',
    role: 'ADMIN',
    is_superuser: false,
};

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

const renderLayout = (route = '/dashboard', userData: Record<string, unknown> | null = userTemplate) => {
    localStorage.clear();
    if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
    }
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[route]}>
                <Routes>
                    <Route path="*" element={<MainLayout />} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>
    );
};

/**
 * Labels appear in both the sidebar nav <span> and the header <h2>
 * (for the active route), so filter to SPAN elements.
 * Uses queryAllByText so it returns [] instead of throwing when not found.
 */
const navLinkElements = (label: string) =>
    screen.queryAllByText(label).filter(el => el.tagName === 'SPAN');

const assertVisible = (labels: string[]) => {
    for (const label of labels) {
        expect(navLinkElements(label).length).toBeGreaterThanOrEqual(1);
    }
};

const assertHidden = (labels: string[]) => {
    for (const label of labels) {
        expect(navLinkElements(label).length).toBe(0);
    }
};

const assertVisibleAnywhere = (label: string) => {
    expect(screen.queryAllByText(label).length).toBeGreaterThanOrEqual(1);
};

// ── Tests ────────────────────────────────────────────

describe('MainLayout', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    // ═══════════════════════════════════════════
    // BASIC RENDER
    // ═══════════════════════════════════════════

    it('renders USAER branding', () => {
        renderLayout();
        expect(screen.getByText('USAER')).toBeInTheDocument();
        expect(screen.getByText('7607')).toBeInTheDocument();
    });

    it('renders skip-to-content link', () => {
        renderLayout();
        const skipLink = screen.getByText('Saltar al contenido principal');
        expect(skipLink).toBeInTheDocument();
        expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('renders logout button', () => {
        renderLayout();
        expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument();
    });

    it('renders "Menú Principal" section header', () => {
        renderLayout();
        expect(screen.getByText('Menú Principal')).toBeInTheDocument();
    });

    // ═══════════════════════════════════════════
    // ROLE-BASED MENU FILTERING
    // ═══════════════════════════════════════════

    it('shows all menu items for ADMIN', () => {
        renderLayout('/dashboard', { ...userTemplate, role: 'ADMIN' });
        assertVisible(ADMIN_LABELS);
    });

    it('shows all menu items for ADMINISTRADOR', () => {
        renderLayout('/dashboard', { ...userTemplate, role: 'ADMINISTRADOR' });
        assertVisible(ADMIN_LABELS);
    });

    it('shows all menu items for SECRETARIO (excludes Usuarios)', () => {
        renderLayout('/dashboard', { ...userTemplate, role: 'SECRETARIO' });
        assertVisible(SECRETARIO_LABELS);
        assertHidden(['Usuarios']);
    });

    it('shows restricted menu for MAESTRO_APOYO (hides admin-only items)', () => {
        renderLayout('/dashboard', { ...userTemplate, role: 'MAESTRO_APOYO' });
        assertVisible(MAESTRO_APOYO_VISIBLE);
        assertHidden(MAESTRO_APOYO_HIDDEN);
    });

    it('shows restricted menu for PSICOLOGO (hides docente+admin items)', () => {
        renderLayout('/dashboard', { ...userTemplate, role: 'PSICOLOGO' });
        assertVisible(['Documentos']);
        assertHidden(ESPECIALISTA_HIDDEN);
    });

    it('shows restricted menu for TRAB_SOCIAL (especialista)', () => {
        renderLayout('/dashboard', { ...userTemplate, role: 'TRAB_SOCIAL' });
        assertVisible(['Documentos']);
        assertHidden(ESPECIALISTA_HIDDEN);
    });

    it('shows only ALL items for unknown role code', () => {
        renderLayout('/dashboard', { ...userTemplate, role: 'UNKNOWN_ROLE' });
        assertVisible(ALL_LABELS);
        assertHidden([
            'Usuarios', 'Ciclos Escolares', 'Escuelas',
            'Alumnos', 'R.A.C.', 'R.A.E.', 'Documentos', 'Oficios',
        ]);
    });

    it('shows all items for superuser regardless of role', () => {
        renderLayout('/dashboard', {
            ...userTemplate,
            role: 'MAESTRO_APOYO',
            is_superuser: true,
        });
        assertVisible(ADMIN_LABELS);
    });

    // ═══════════════════════════════════════════
    // HEADER SECTION TITLE
    // ═══════════════════════════════════════════

    it('shows section label in header matching current route', () => {
        renderLayout('/dashboard');
        assertVisibleAnywhere('Panel Principal');
    });

    it('shows different section label for /avisos route', () => {
        renderLayout('/avisos');
        assertVisibleAnywhere('Avisos');
    });

    it('shows "Inicio" for root path', () => {
        renderLayout('/');
        expect(screen.getByText('Inicio')).toBeInTheDocument();
    });

    it('shows "Sistema" for unknown path', () => {
        renderLayout('/some/unknown/path');
        expect(screen.getByText('Sistema')).toBeInTheDocument();
    });

    // ═══════════════════════════════════════════
    // USER INFO DISPLAY
    // ═══════════════════════════════════════════

    it('shows user name from localStorage', () => {
        renderLayout('/dashboard', { ...userTemplate, first_name: 'María', last_name: 'García' });
        expect(screen.getByText('María García')).toBeInTheDocument();
    });

    it('shows user role display name mapped from role code', () => {
        renderLayout('/dashboard', { ...userTemplate, role: 'PSICOLOGO' });
        expect(screen.getByText('Psicólogo(a)')).toBeInTheDocument();
    });

    it('shows "Administrador (Super)" for superuser', () => {
        renderLayout('/dashboard', {
            ...userTemplate,
            is_superuser: true,
            role: 'ADMIN',
        });
        expect(screen.getByText('Administrador (Super)')).toBeInTheDocument();
    });

    it('shows fallback role name for unknown role code', () => {
        renderLayout('/dashboard', { ...userTemplate, role: 'COCINERO' });
        expect(screen.getByText('Personal USAER')).toBeInTheDocument();
    });

    it('shows initial avatar letter from first name', () => {
        renderLayout('/dashboard', { ...userTemplate, first_name: 'Carlos' });
        const avatar = screen.getByText('C');
        expect(avatar).toBeInTheDocument();
        expect(avatar.className).toMatch(/font-bold/);
    });

    it('handles no user in localStorage gracefully', () => {
        renderLayout('/dashboard', null);
        expect(screen.getByText('Usuario')).toBeInTheDocument();
    });

    it('handles invalid localStorage JSON gracefully', () => {
        queryClient.clear();
        localStorage.setItem('user', 'not-json-at-all');
        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={['/dashboard']}>
                    <Routes>
                        <Route path="*" element={<MainLayout />} />
                    </Routes>
                </MemoryRouter>
            </QueryClientProvider>
        );
        expect(screen.getByText('Usuario')).toBeInTheDocument();
    });

    // ═══════════════════════════════════════════
    // LOGOUT
    // ═══════════════════════════════════════════

    it('navigates to /login and clears localStorage on logout confirm', () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

        renderLayout('/dashboard');
        localStorage.setItem('some_key', 'value');

        fireEvent.click(screen.getByText('Cerrar Sesión'));

        expect(confirmSpy).toHaveBeenCalledWith(
            expect.stringContaining('¿Cerrar sesión?')
        );
        expect(localStorage.getItem('some_key')).toBeNull();
        // After navigation the header checks route — at /login it shows 'Sistema'
        expect(screen.getByText('Sistema')).toBeInTheDocument();

        confirmSpy.mockRestore();
    });

    it('does NOT log out when confirm is cancelled', () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

        renderLayout('/dashboard');
        // Set a persist_key AFTER renderLayout (which clears localStorage)
        localStorage.setItem('persist_key', 'keep-me');

        fireEvent.click(screen.getByText('Cerrar Sesión'));

        expect(localStorage.getItem('persist_key')).toBe('keep-me');
        // We should still be at the same route
        assertVisibleAnywhere('Panel Principal');

        confirmSpy.mockRestore();
    });

    // ═══════════════════════════════════════════
    // MOBILE SIDEBAR INTERACTION
    // ═══════════════════════════════════════════

    it('opens mobile sidebar when clicking Menu button', () => {
        renderLayout('/dashboard');

        // The X close-button is always rendered inside the sidebar
        expect(screen.getByLabelText('Cerrar menú')).toBeInTheDocument();
        // The hamburger menu button is always rendered in the header
        expect(screen.getByLabelText('Abrir menú')).toBeInTheDocument();

        // Initially no overlay (sidebar closed)
        expect(document.querySelector('.fixed.inset-0')).toBeNull();

        // Click the open menu button
        fireEvent.click(screen.getByLabelText('Abrir menú'));

        // Overlay should appear
        const overlay = document.querySelector('.fixed.inset-0');
        expect(overlay).toBeInTheDocument();
    });

    it('closes mobile sidebar when X button is clicked', () => {
        renderLayout('/dashboard');

        // Open sidebar first
        fireEvent.click(screen.getByLabelText('Abrir menú'));
        expect(document.querySelector('.fixed.inset-0')).toBeInTheDocument();

        // Close by clicking X
        fireEvent.click(screen.getByLabelText('Cerrar menú'));

        // Overlay should disappear
        expect(document.querySelector('.fixed.inset-0')).not.toBeInTheDocument();
    });

    it('closes mobile sidebar when clicking overlay', () => {
        renderLayout('/dashboard');

        // Open sidebar
        fireEvent.click(screen.getByLabelText('Abrir menú'));
        expect(document.querySelector('.fixed.inset-0')).toBeInTheDocument();

        // Click overlay
        fireEvent.click(document.querySelector('.fixed.inset-0')!);

        // Overlay should disappear
        expect(document.querySelector('.fixed.inset-0')).not.toBeInTheDocument();
    });

    // ═══════════════════════════════════════════
    // MENU LINK NAVIGATION
    // ═══════════════════════════════════════════

    it('navigates when clicking a menu link', () => {
        renderLayout('/dashboard');

        // Click "Avisos" link
        fireEvent.click(screen.getByText('Avisos'));

        // Header and nav show "Avisos" — verify it exists
        assertVisibleAnywhere('Avisos');
    });

    it('renders all menu icons for ADMIN', () => {
        renderLayout('/dashboard');
        const icons = screen.getAllByTestId(/^icon-/);
        // Should have at least the number of visible menu items for ADMIN
        expect(icons.length).toBeGreaterThanOrEqual(ADMIN_LABELS.length);
    });
});
