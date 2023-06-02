import { Telegraf, session } from 'telegraf'
import { message } from 'telegraf/filters'
import { code } from 'telegraf/format'
import config from 'config'
import { ogg } from './ogg.js'
import { openai } from './openai.js'
import { removeFile } from './utils.js'
import { initCommand, processTextToChat, INITIAL_SESSION } from './logic.js'

let telegram_token = ''

if (process.env.NODE_ENV === 'production') {
  telegram_token = config.get('TELEGRAM_TOKEN')
}

if (process.env.NODE_ENV === 'development') {
  telegram_token = process.env.TELEGRAM_TOKEN
}

const bot = new Telegraf(telegram_token)

bot.use(session())

bot.command('new', initCommand)
bot.command('start', initCommand)

bot.on(message('voice'), async (ctx) => {
  ctx.session ??= INITIAL_SESSION

  try {
    await ctx.reply(
      code('Message received. Waiting for a response from the server...')
    )
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
    const userId = String(ctx.message.from.id)
    const oggPath = await ogg.create(link.href, userId)
    const mp3Path = await ogg.toMp3(oggPath, userId)

    removeFile(oggPath)

    const text = await openai.transcription(mp3Path)

    await ctx.reply(code(`Your request: ${text}`))
    await processTextToChat(ctx, text)
  } catch (e) {
    console.log(`Error while voice message`, e.message)
  }
})

bot.on(message('text'), async (ctx) => {
  ctx.session ??= INITIAL_SESSION

  try {
    await ctx.reply(
      code('Message received. Waiting for a response from the server..')
    )
    await processTextToChat(ctx, ctx.message.text)
  } catch (e) {
    console.log(`Error while voice message`, e.message)
  }
})

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
