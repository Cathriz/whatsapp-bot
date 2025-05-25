import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Webhook verification endpoint (GET)
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  } else {
    return res.sendStatus(400);
  }
});

// Webhook event handler (POST)
app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    if (
      body.object === 'whatsapp_business_account' &&
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.messages
    ) {
      const phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
      const from = body.entry[0].changes[0].value.messages[0].from;
      const msg_body = body.entry[0].changes[0].value.messages[0].text?.body || '';
      
      console.log(`Received message from ${from}: ${msg_body}`);

      let replyText = 'Hello! How can I assist you today?';

      if (msg_body.toLowerCase().includes('menu')) {
        replyText = 'Here is the menu:\n1. Product Info\n2. Pricing\n3. Support';
      } else if (msg_body.toLowerCase().includes('cancel')) {
        replyText = 'Your request has been canceled. Let me know if you need anything else!';
      }

      const data = {
        messaging_product: 'whatsapp',
        to: from,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: replyText },
          action: {
            buttons: [
              {
                type: 'reply',
                reply: { id: 'menu_button', title: 'Menu' }
              },
              {
                type: 'reply',
                reply: { id: 'cancel_button', title: 'Cancel' }
              }
            ]
          }
        }
      };

      const url = `https://graph.facebook.com/v17.0/${phone_number_id}/messages`;
      const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

      await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ACCESS_TOKEN}`
        }
      });

      return res.sendStatus(200);
    } else {
      return res.sendStatus(404);
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    return res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
