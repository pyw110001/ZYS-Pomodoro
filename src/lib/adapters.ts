export interface EntitlementProvider {
  hasProAccess(): Promise<boolean>
}

export interface AnalyticsAdapter {
  track(event: string, properties?: Record<string, unknown>): void
}

export const freeEntitlementProvider: EntitlementProvider = {
  async hasProAccess() { return false }
}

export const noOpAnalytics: AnalyticsAdapter = {
  track() { /* Deliberately local-only for MVP. */ }
}
