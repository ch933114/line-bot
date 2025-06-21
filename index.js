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
  if (event.type !== 'message' || event.message.type !== 'text') return;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 加入人格與語言設定
    const systemPrompt = `
你是一個親切且知識豐富的 LINE 助理，請使用繁體中文回答問題。
回答要清楚、簡短，避免使用英文。
    `;

    // 使用 Chat-like Prompt（多輪訊息格式）
    const result = await model.generateContent([
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'user', parts: [{ text: event.message.text }] }
    ]);

    const text = result.response.text() || '抱歉，我暫時無法回應。';

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text,
    });

  } catch (error) {
    console.error('Gemini API 錯誤:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '發生錯誤，請稍後再試。',
    });
  }
}


app.get('/webhook', (req, res) => {
  res.send('Webhook endpoint is working.');
});

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
