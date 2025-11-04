import { describe, it, expect } from 'vitest';
import {
  buildPackagePayload,
  toOptionalBoolean
} from '../../src/routes/packages-simple';

describe('packages-simple helpers', () => {
  it('should parse checkbox-style boolean values correctly', () => {
    expect(toOptionalBoolean('on')).toBe(true);
    expect(toOptionalBoolean('true')).toBe(true);
    expect(toOptionalBoolean('1')).toBe(true);
    expect(toOptionalBoolean('off')).toBe(false);
    expect(toOptionalBoolean('false')).toBe(false);
    expect(toOptionalBoolean('0')).toBe(false);
  });

  it('should clear classesPerWeek when package becomes unlimited', () => {
    const payload = buildPackagePayload({
      name: 'Plano Ilimitado',
      billingType: 'monthly',
      isUnlimitedAccess: 'true',
      classesPerWeek: 4
    });

    expect(payload.isUnlimitedAccess).toBe(true);
    expect(payload.classesPerWeek).toBeNull();
  });

  it('should preserve classesPerWeek when package is limited', () => {
    const payload = buildPackagePayload({
      name: 'Plano Limitado',
      billingType: 'monthly',
      isUnlimitedAccess: 'false',
      classesPerWeek: '3'
    });

    expect(payload.isUnlimitedAccess).toBe(false);
    expect(payload.classesPerWeek).toBe(3);
  });
});
