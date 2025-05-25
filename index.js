import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Root route (optional)
app.get('/', (req, res) => {
  res.send('WhatsApp Bot is Running ✅');
});

// Webhook Verification (GET)
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Webhook Listener (POST)
app.post('/webhook', async (req, res) => {
  const body = req.body;

  // Check if this is an incoming message
  if (body.object && body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
    const phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
    const from = body.entry[0].changes[0].value.messages[0].from;
    const msg_body = body.entry[0].changes[0].value.messages[0].text.body;

    console.log(`📩 Message from ${from}: ${msg_body}`);

    // Send auto-reply
    try {
      await axios({
        method: 'POST',
        url: `https://graph.facebook.com/v19.0/${phone_number_id}/messages`,
        data: {
          messaging_product: 'whatsapp',
          to: from,
          text: { body: `🤖 Hello! You said: "${msg_body}"\nThis is an automated reply from my bot.` }
        },
        headers: {
          Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Auto-reply sent.');
    } catch (error) {
      console.error('❌ Failed to send message:', error.response?.data || error.message);
    }

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
