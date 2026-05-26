import { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Text, Title, Paper, Stack, Group, ThemeIcon, Code, ScrollArea } from '@mantine/core';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary
 * Catches React rendering errors and displays a friendly fallback UI
 * instead of a blank white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Paper p="xl" radius="lg" withBorder shadow="md" bg="red.0" maw={600} mx="auto" mt="xl">
          <Stack gap="md" align="center" ta="center">
            <ThemeIcon size={64} radius="xl" color="red" variant="light">
              <AlertTriangle size={36} />
            </ThemeIcon>
            <Title order={2} fw={800} c="red.8">
              Algo salió mal
            </Title>
            <Text size="sm" c="dimmed" maw={400}>
              Ocurrió un error inesperado en la interfaz. El equipo técnico ha sido notificado.
            </Text>
            
            {this.state.error && (
              <Paper p="sm" bg="white" withBorder radius="md" w="100%">
                <Text size="xs" fw={700} c="dimmed" mb={4}>Detalle técnico:</Text>
                <ScrollArea.Autosize mah={120}>
                  <Code block color="red" fz="xs">
                    {this.state.error.message}
                  </Code>
                </ScrollArea.Autosize>
              </Paper>
            )}

            <Group gap="xs" mt="sm">
              <Button
                variant="outline"
                color="red"
                leftSection={<RefreshCw size={16} />}
                onClick={() => window.location.reload()}
              >
                Recargar Página
              </Button>
              <Button
                component="a"
                href="/dashboard"
                leftSection={<Home size={16} />}
              >
                Ir al Dashboard
              </Button>
            </Group>
          </Stack>
        </Paper>
      );
    }

    return this.props.children;
  }
}
