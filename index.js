require('dotenv').config();
const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const app = express();
const client = new Client(config);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 處理收到的訊息
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userInput = event.message.text;

  try {
    // 取得 Gemini 模型
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // 呼叫 Gemini 產生回應
    const result = await model.generateContent(userInput);
    const response = result.response;
    const text = response.text() || '抱歉，我暫時無法回應。';

    // 用 LINE Bot 回覆使用者
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: text,
    });
  } catch (error) {
    console.error('Gemini API 錯誤:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '發生錯誤，請稍後再試。',
    });
  }
}

app.post('/webhook', middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`LINE Bot is running on port ${port}`);
});
