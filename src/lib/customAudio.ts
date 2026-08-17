import type { CustomSound } from '../types'

export const MAX_CUSTOM_SOUNDS = 5
export const MAX_AUDIO_FILE_BYTES = 50 * 1024 * 1024
export const MAX_AUDIO_TOTAL_BYTES = 150 * 1024 * 1024
const allowedExtensions = new Set(['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'])

export type AudioValidationError = 'type' | 'file-size' | 'count' | 'total-size'

export function validateAudioFile(file: File, sounds: CustomSound[]): AudioValidationError | undefined {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!file.type.startsWith('audio/') && !allowedExtensions.has(extension)) return 'type'
  if (file.size > MAX_AUDIO_FILE_BYTES) return 'file-size'
  if (sounds.length >= MAX_CUSTOM_SOUNDS) return 'count'
  if (sounds.reduce((sum, sound) => sum + sound.size, 0) + file.size > MAX_AUDIO_TOTAL_BYTES) return 'total-size'
  return undefined
}

export const formatFileSize = (bytes: number, locale: string) => new Intl.NumberFormat(locale, {
  style: 'unit', unit: bytes >= 1024 * 1024 ? 'megabyte' : 'kilobyte', maximumFractionDigits: 1
}).format(bytes / (bytes >= 1024 * 1024 ? 1024 * 1024 : 1024))
