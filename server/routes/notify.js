const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate Limiter specifically for notifications to prevent spam
const notifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per 15 minutes
  message: { error: 'Too many notifications sent. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', notifyLimiter, async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'Message content is required' });
  }

  try {
    const response = await axios.post('https://ntfy.sh/my-site-alerts-98x21q', message.trim(), {
      headers: {
        'Title': 'New Custom Website Alert',
        'Priority': 'high',
        'Tags': 'bell,incoming_letter'
      }
    });

    if (response.status === 200) {
      console.log('✅ Notification sent successfully to ntfy');
      return res.json({ success: true, message: 'Notification sent successfully' });
    } else {
      throw new Error(`ntfy returned status ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Failed to send notification via ntfy:', error.message);
    return res.status(500).json({ error: 'Failed to send notification' });
  }
});

module.exports = router;
