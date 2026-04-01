import OpenAI from 'openai'
import type { AiProvider } from '../provider.interface'

export class OpenAiProvider implements AiProvider {
  readonly name = 'openai'
  private readonly client: OpenAI
  private readonly model: string

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey })
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
    if (!content) throw new Error('OpenAI returned empty response')
    return content
  }

  isAvailable(): boolean {
    return true
  }
}
