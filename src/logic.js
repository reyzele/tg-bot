import { openai } from './openai.js'
import { textConverter } from './text-to-speech.js'

export const INITIAL_SESSION = {
  messages: [],
}

export async function initCommand(ctx) {
  ctx.session = { ...INITIAL_SESSION }
  await ctx.reply('Waiting for your voice or text message...')
}

export async function processTextToChat(ctx, content) {
  try {
    ctx.session.messages.push({ role: openai.roles.USER, content })

    const result = await openai.chat(ctx.session.messages)

    //console.log('OpenAI result:', result)

    if (result) {
      const { message, lang } = result

      ctx.session.messages.push({
        role: openai.roles.ASSISTANT,
        content: message.content,
      })

      await ctx.reply(message.content)

      const source = await textConverter.textToSpeech(message.content, lang)
      await ctx.sendAudio(
        { source },
        { title: 'Answer from assistant', performer: 'ChatGPT' }
      )
    } else {
      const text = 'Please try again...'
      await ctx.reply(text)
    }
  } catch (e) {
    console.error('Error while proccesing text to gpt', e.message)
  }
}
