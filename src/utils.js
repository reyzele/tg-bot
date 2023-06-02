import { unlink } from 'fs/promises'

export async function removeFile(path) {
  try {
    await unlink(path)
  } catch (e) {
    console.log('Error while removing file', e.message)
  }
}

const LANGUAGES = {
  ru: 'ru-RU',
  en: 'en-US',
  he: 'he-IL',
}

export const getLanguage = (lang) => LANGUAGES[lang] || LANGUAGES['ru']
