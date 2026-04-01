import OpenAI from 'openai'
import type { AiProvider } from '../provider.interface'

/** Grok uses the OpenAI-compatible API with a different base URL */
export class GrokProvider implements AiProvider {
  readonly name = 'grok'
  private readonly client: OpenAI
  private readonly model: string

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.x.ai/v1'
    })
    this.model = model
  }

  async complete(system: string, user: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    })
    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('Grok returned empty response')
    return content
  }

  isAvailable(): boolean {
    return true
  }
}
