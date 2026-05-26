import { createTheme } from '@mantine/core';
import type { MantineColorsTuple } from '@mantine/core';

// Definimos una paleta de azules profesional para la escuela
const bluePalette: MantineColorsTuple = [
  '#eef2ff',
  '#e0e7ff',
  '#c7d2fe',
  '#a5b4fc',
  '#818cf8',
  '#6366f1',
  '#4f46e5',
  '#4338ca',
  '#3730a3',
  '#312e81',
];

export const theme = createTheme({
  primaryColor: 'blue',
  colors: {
    blue: bluePalette,
  },
  fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  defaultRadius: 'md',
});
