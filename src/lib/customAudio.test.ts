import { describe, expect, it } from 'vitest'
import { MAX_AUDIO_FILE_BYTES, MAX_AUDIO_TOTAL_BYTES, MAX_CUSTOM_SOUNDS, validateAudioFile } from './customAudio'
import type { CustomSound } from '../types'

const sound = (id: string, size: number): CustomSound => ({ id, name: `${id}.mp3`, mimeType: 'audio/mpeg', size, blob: new Blob(), createdAt: 1 })
const file = (name: string, size: number, type = '') => ({ name, size, type } as File)

describe('custom audio validation', () => {
  it('accepts supported extensions and audio MIME types', () => {
    expect(validateAudioFile(file('rain.mp3', 10), [])).toBeUndefined()
    expect(validateAudioFile(file('rain.bin', 10, 'audio/mpeg'), [])).toBeUndefined()
  })

  it('rejects unsupported types and per-file limits', () => {
    expect(validateAudioFile(file('notes.txt', 10, 'text/plain'), [])).toBe('type')
    expect(validateAudioFile(file('rain.wav', MAX_AUDIO_FILE_BYTES + 1), [])).toBe('file-size')
  })

  it('enforces library count and total storage limits', () => {
    expect(validateAudioFile(file('rain.mp3', 10), Array.from({ length: MAX_CUSTOM_SOUNDS }, (_, index) => sound(`${index}`, 1)))).toBe('count')
    expect(validateAudioFile(file('rain.mp3', 2), [sound('large', MAX_AUDIO_TOTAL_BYTES - 1)])).toBe('total-size')
  })
})
