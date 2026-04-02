import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/main/services/**/*.ts',
        'src/renderer/stores/**/*.ts'
      ],
      exclude: [
        'src/main/services/database.service.ts',
        'src/main/services/discord.service.ts',
        'src/main/services/telegram.service.ts',
        'src/main/services/platform-manager.ts',
        'src/main/services/platform.types.ts',
        'src/main/services/ai/providers/**',
        'src/main/services/ai/agent.service.ts',
        'src/main/services/ai/conversation.engine.ts',
        'src/main/services/ai/provider.interface.ts',
        'src/main/services/ai/provider.factory.ts',
        'src/main/services/ai/profile.service.ts',
        'src/main/services/ai/prompts/**'
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80
      }
    },
    setupFiles: ['src/test/setup.ts']
  },
  resolve: {
    alias: {
      '@shared': resolve('src/shared'),
      '@main': resolve('src/main'),
      '@': resolve('src/renderer'),
      '@renderer': resolve('src/renderer')
    }
  }
})
