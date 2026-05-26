import { describe, it, expect, beforeEach } from 'vitest';
import { attendanceBuffer } from '../utils/attendanceBuffer';

describe('attendanceBuffer', () => {
  beforeEach(() => {
    attendanceBuffer.clear();
  });

  it('should save a pending attendance and retrieve it', () => {
    attendanceBuffer.save('12345678');
    const pending = attendanceBuffer.getAll();
    
    expect(pending).toHaveLength(1);
    expect(pending[0].numero_empleado).toBe('12345678');
    expect(pending[0].id).toBeDefined();
  });

  it('should store multiple pending attendances', () => {
    attendanceBuffer.save('111');
    attendanceBuffer.save('222');
    attendanceBuffer.save('333');
    
    expect(attendanceBuffer.getAll()).toHaveLength(3);
  });

  it('should remove a specific record by ID', () => {
    attendanceBuffer.save('123');
    const id = attendanceBuffer.getAll()[0].id;
    
    attendanceBuffer.remove(id);
    expect(attendanceBuffer.getAll()).toHaveLength(0);
  });

  it('should correctly report if there are pending items', () => {
    expect(attendanceBuffer.hasPending()).toBe(false);
    attendanceBuffer.save('123');
    expect(attendanceBuffer.hasPending()).toBe(true);
  });

  it('should clear all pending items', () => {
    attendanceBuffer.save('123');
    attendanceBuffer.save('456');
    attendanceBuffer.clear();
    expect(attendanceBuffer.getAll()).toHaveLength(0);
  });
});
