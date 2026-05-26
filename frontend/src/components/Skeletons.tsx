import { Skeleton, Stack, Group, Paper, Box, rem } from '@mantine/core';

/**
 * PageSkeleton
 * Consistent loading skeleton for full-page content areas.
 * Shows a header block + multiple content rows.
 */
export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Stack gap="xl">
      {/* Header skeleton */}
      <Paper p="lg" radius="lg" withBorder shadow="sm">
        <Group justify="space-between" align="center">
          <Group gap="md">
            <Skeleton height={52} width={52} radius="lg" circle />
            <Stack gap={4}>
              <Skeleton height={28} width={220} radius="md" />
              <Skeleton height={14} width={180} radius="md" />
            </Stack>
          </Group>
          <Skeleton height={36} width={180} radius="md" />
        </Group>
      </Paper>

      {/* Filter/Search skeleton */}
      <Paper p="md" radius="lg" withBorder shadow="xs">
        <Skeleton height={36} width="100%" radius="md" />
      </Paper>

      {/* Content rows skeleton */}
      <Paper radius="lg" withBorder shadow="xs" p="md">
        <Stack gap="md">
          {Array.from({ length: rows }).map((_, i) => (
            <Group key={i} justify="space-between" align="center">
              <Group gap="sm">
                <Skeleton height={36} width={36} radius="xl" circle />
                <Stack gap={4}>
                  <Skeleton height={16} width={160} radius="md" />
                  <Skeleton height={12} width={100} radius="md" />
                </Stack>
              </Group>
              <Skeleton height={16} width={80} radius="md" />
              <Skeleton height={16} width={60} radius="md" />
              <Group gap="xs">
                <Skeleton height={28} width={64} radius="md" />
                <Skeleton height={28} width={64} radius="md" />
              </Group>
            </Group>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}

/**
 * CardGridSkeleton
 * Skeleton for card-grid layouts (escuelas, documentos, etc.)
 */
export function CardGridSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 'var(--mantine-spacing-lg)'
    }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Paper key={i} p="lg" radius="lg" withBorder shadow="xs">
          <Stack gap="xs">
            <Group justify="space-between">
              <Skeleton height={20} width={80} radius="md" />
              <Skeleton height={20} width={60} radius="md" />
            </Group>
            <Skeleton height={24} width="80%" radius="md" />
            <Skeleton height={1} width="100%" my="xs" />
            <Skeleton height={14} width="90%" radius="md" />
            <Skeleton height={14} width="70%" radius="md" />
            <Group justify="flex-end" mt="md">
              <Skeleton height={28} width={64} radius="md" />
              <Skeleton height={28} width={64} radius="md" />
            </Group>
          </Stack>
        </Paper>
      ))}
    </div>
  );
}

/**
 * TableSkeleton
 * Skeleton for table-based layouts (alumnos, usuarios, etc.)
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Paper radius="lg" withBorder shadow="xs" p="md">
      <Stack gap="md">
        {/* Header row */}
        <Group justify="space-between">
          <Skeleton height={14} width={120} radius="md" />
          <Skeleton height={14} width={100} radius="md" />
          <Skeleton height={14} width={80} radius="md" />
          <Skeleton height={14} width={60} radius="md" />
          <Skeleton height={14} width={100} radius="md" />
        </Group>
        {/* Data rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <Group key={i} justify="space-between" align="center" style={{ borderTop: '1px solid var(--mantine-color-gray-1)', paddingTop: 'var(--mantine-spacing-sm)' }}>
            <Group gap="sm">
              <Skeleton height={36} width={36} radius="xl" circle />
              <Stack gap={2}>
                <Skeleton height={16} width={140} radius="md" />
                <Skeleton height={12} width={90} radius="md" />
              </Stack>
            </Group>
            <Skeleton height={14} width={100} radius="md" />
            <Skeleton height={20} width={80} radius="md" />
            <Skeleton height={20} width={50} radius="md" />
            <Group gap="xs">
              <Skeleton height={28} width={64} radius="md" />
              <Skeleton height={28} width={64} radius="md" />
            </Group>
          </Group>
        ))}
      </Stack>
    </Paper>
  );
}
