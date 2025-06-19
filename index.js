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

// 🔧 加上首頁用來測試 Render 網站
app.get('/', (req, res) => {
  res.send('✅ LINE Bot Server is running.')
})

// 🔧 Webhook route，一定要回傳 200
app.post('/webhook', middleware(config), async (req, res) => {
  try {
    // 立刻回應 200 給 LINE，不然會 timeout 當錯誤
    res.sendStatus(200)

    const events = req.body.events
    for (const event of events) {
      await handleEvent(event)
    }
  } catch (err) {
    console.error('Webhook error:', err)
    // ❗即使錯誤也回 200，LINE 不會重新傳送
    res.sendStatus(200)
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
    await client.replyMessage({
      replyToken: event.replyToken,
      messages: [reply],
    })
  } catch (err) {
    console.error('Reply error:', err)
  }
}

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 LINE Bot webhook running on port ${PORT}`)
})
