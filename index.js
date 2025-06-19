require('dotenv').config()
const express = require('express')
const line = require('@line/bot-sdk')

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
}

const app = express()
app.use(express.json())
app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then(result => res.json(result))
})

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null)
  }

  const reply = {
    type: 'text',
    text: `你剛剛說了：「${event.message.text}」`,
  }

  const { MessagingApiClient } = require('@line/bot-sdk')

  const client = new MessagingApiClient({
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  })

  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [reply],
  })
}

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`LINE Bot webhook running on port ${PORT}`)
})
