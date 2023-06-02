import { Configuration, OpenAIApi } from 'openai'
import config from 'config'
import { createReadStream } from 'fs'
import langdetect from 'langdetect'

class OpenAI {
  roles = {
    ASSISTANT: 'assistant',
    USER: 'user',
    SYSTEM: 'system',
  }

  constructor(apiKey) {
    const configuration = new Configuration({
      apiKey,
    })
    this.openai = new OpenAIApi(configuration)
  }

  async chat(messages) {
    try {
      const response = await this.openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages,
      })
      const message = response.data.choices[0].message
      const language = langdetect.detect(message.content)

      return {
        message,
        lang: language[0].lang,
      }
    } catch (e) {
      console.log('Error while gpt chat', e.message)
    }
  }

  async transcription(filepath) {
    try {
      const response = await this.openai.createTranscription(
        createReadStream(filepath),
        'whisper-1'
      )
      return response.data.text
    } catch (e) {
      console.log('Error while transcription', e.message)
    }
  }
}

let open_key = ''

if (process.env.NODE_ENV === 'production') {
  open_key = config.get('OPENAI_KEY')
}

if (process.env.NODE_ENV === 'development') {
  open_key = process.env.OPENAI_KEY
}

export const openai = new OpenAI(open_key)
