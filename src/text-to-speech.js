import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'
import jwt from 'jsonwebtoken'
import axios from 'axios'
import { getLanguage } from './utils.js'

// absolute path to folder we working on
const __dirname = dirname(fileURLToPath(import.meta.url))

class TextConverter {
  async getToken() {
    const iss = JSON.parse(process.env.TGBOT_CLIENT_EMAIL, 'utf-8')
    const private_key = JSON.parse(process.env.TGBOT_PRIVATE_KEY, 'utf-8')

    const token = jwt.sign(
      {
        iss,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
        aud: 'https://www.googleapis.com/oauth2/v4/token',
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
        iat: Math.floor(Date.now() / 1000),
      },
      private_key,
      { algorithm: 'RS256' }
    )

    const response = await axios.post(
      'https://www.googleapis.com/oauth2/v4/token',
      {
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: token,
      }
    )

    return response.data.access_token
  }

  async textToSpeech(text, lang) {
    try {
      const url = 'https://texttospeech.googleapis.com/v1beta1/text:synthesize'
      const languageCode = getLanguage(lang)
      const data = {
        input: { text },
        voice: {
          languageCode,
          name: `${languageCode}-Wavenet-A`,
        },
        audioConfig: { audioEncoding: 'MP3' },
      }

      const accsessToken = await this.getToken()

      const response = await axios({
        url,
        method: 'POST',
        data,
        headers: {
          Authorization: `Bearer ${accsessToken}`,
          'Content-Type': 'application/json',
        },
      })

      const buffer = Buffer.from(response.data.audioContent, 'base64')

      return buffer
    } catch (error) {
      console.error('Error in text to speech converter', error.message)
    }
  }
}

export const textConverter = new TextConverter()
