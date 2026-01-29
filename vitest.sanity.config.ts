import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        silent: false,
        environment: 'node',
        // NO setupFiles here to avoid database cleaning between steps
        include: ['tests/sanity/**/*.test.ts'],
        testTimeout: 30000,
        hookTimeout: 30000
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        }
    }
});
