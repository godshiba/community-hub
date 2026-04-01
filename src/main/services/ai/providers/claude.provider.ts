import Anthropic from '@anthropic-ai/sdk'
import type { AiProvider } from '../provider.interface'

export class ClaudeProvider implements AiProvider {
  readonly name = 'claude'
  private readonly client: Anthropic
  private readonly model: string

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey })
    this.model = model
  }

  async complete(system: string, user: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: user }]
    })
    const block = response.content[0]
    if (!block || block.type !== 'text') throw new Error('Claude returned empty response')
    return block.text
  }

  isAvailable(): boolean {
    return true
  }
}
