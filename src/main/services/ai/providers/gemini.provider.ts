import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AiProvider } from '../provider.interface'

export class GeminiProvider implements AiProvider {
  readonly name = 'gemini'
  private readonly client: GoogleGenerativeAI
  private readonly model: string

  constructor(apiKey: string, model: string) {
    this.client = new GoogleGenerativeAI(apiKey)
    this.model = model
  }

  async complete(system: string, user: string): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: system
    })
    const result = await model.generateContent(user)
    const text = result.response.text()
    if (!text) throw new Error('Gemini returned empty response')
    return text
  }

  isAvailable(): boolean {
    return true
  }
}
