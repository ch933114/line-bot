require('dotenv').config()
const express = require('express')
const { middleware, MessagingApiClient } = require('@line/bot-sdk')

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
}

const client = new MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
})

const app = express()
app.use(express.json())

app.get('/', (req, res) => {
  res.send('✅ LINE Bot Server is running.')
})

app.post('/webhook', middleware(config), async (req, res) => {
  try {
    res.sendStatus(200) // 先回 200
    const events = req.body.events
    for (const event of events) {
      await handleEvent(event)
    }
  } catch (err) {
    console.error('Webhook error:', err)
    res.sendStatus(200) // 失敗也回 200 避免 webhook 被停用
  }
})

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return
  }

  const reply = {
    type: 'text',
    text: `你剛剛說了：「${event.message.text}」`,
  }

  try {
    // 修正這裡的呼叫方式
    await client.replyMessage(event.replyToken, [reply])
  } catch (err) {
    console.error('Reply error:', err)
  }
}

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 LINE Bot webhook running on port ${PORT}`)
})
