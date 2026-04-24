import axe from 'axe-core'
import { expect } from 'vitest'

export interface AxeOptions {
  rules?: Record<string, { enabled: boolean }>
  disabledRules?: readonly string[]
}

/**
 * Runs axe-core on a DOM element and asserts there are no violations.
 *
 * Happy-dom is good enough to surface ARIA, label, and role mistakes.
 * Color-contrast checks are skipped because happy-dom doesn't compute
 * real styles — we rely on the visual QA pass and reduced-motion audit
 * instead for those concerns.
 */
export async function expectNoAxeViolations(
  element: Element,
  options: AxeOptions = {}
): Promise<void> {
  const disabled = new Set<string>(['color-contrast', ...(options.disabledRules ?? [])])
  const rules: Record<string, { enabled: boolean }> = { ...(options.rules ?? {}) }
  for (const id of disabled) {
    if (!rules[id]) rules[id] = { enabled: false }
  }

  const results = await axe.run(element, {
    rules,
    resultTypes: ['violations']
  })

  if (results.violations.length > 0) {
    const summary = results.violations
      .map(
        (v) =>
          `- ${v.id} (${v.impact}) — ${v.description}\n  Help: ${v.helpUrl}\n  Nodes: ${v.nodes
            .map((n) => n.target.join(' '))
            .join(', ')}`
      )
      .join('\n')
    throw new Error(`axe-core found accessibility violations:\n${summary}`)
  }

  expect(results.violations).toHaveLength(0)
}
