/** Normalized AI provider interface — all providers implement this */
export interface AiProvider {
  readonly name: string
  complete(system: string, user: string): Promise<string>
  isAvailable(): boolean
}
