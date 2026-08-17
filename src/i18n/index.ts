import { enUS } from './en-US'
import { zhCN, type Messages } from './zh-CN'
import type { Locale, StarterTaskKey } from '../types'

export const messages: Record<Locale, Messages> = { 'zh-CN': zhCN, 'en-US': enUS }
export const getMessages = (locale: Locale) => messages[locale]
export const getTaskTitle = (task: { title: string; titleKey?: StarterTaskKey }, locale: Locale) => task.titleKey ? messages[locale].starterTasks[task.titleKey] : task.title
export const getCatalogName = (id: string, locale: Locale) => messages[locale].collection.items[id as keyof Messages['collection']['items']] ?? id
