import React from 'react';
import { Pagination, Group, Text } from '@mantine/core';

interface PaginationProps {
    total: number;
    pageSize: number;
    currentPage: number;
    onPageChange: (page: number) => void;
}

const CustomPagination = ({ total, pageSize, currentPage, onPageChange }: PaginationProps) => {
    const totalPages = Math.ceil(total / pageSize);

    if (totalPages <= 1) return null;

    return (
        <Group justify="center" mt="xl">
            <Pagination 
                total={totalPages} 
                value={currentPage} 
                onChange={onPageChange} 
                color="blue" 
                radius="md" 
                // Using siblings to keep the pagination compact
                siblings={1}
            />
            <Text size="sm" c="dimmed" ml="sm">
                Total: {total} registros
            </T>
            </Text>
        </Group>
    );
};

export default CustomPagination;
