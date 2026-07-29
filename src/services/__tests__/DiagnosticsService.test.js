import { afterEach, describe, expect, it, vi } from 'vitest';

import { DiagnosticsService } from '../DiagnosticsService';

describe('DiagnosticsService Bible diagnostics', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports the bundled Bible service as healthy without requesting a production API route', async () => {
    vi.stubGlobal('fetch', vi.fn(() => {
      throw new Error('The Bible diagnostic must not depend on the network');
    }));

    const result = await DiagnosticsService.testExternalAPIs();

    expect(result).toMatchObject({
      id: 'external_api',
      name: 'Serviço de Bíblia (NVI local)',
      category: 'Content',
      status: 'ok',
    });
    expect(result.details).toContain('Salmos 23:1');
  });
});
