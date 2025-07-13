// const express = require('express');
// const app = express();

// app.use(express.json());

// // Simple GET endpoint for testing
// app.get("/hi", (req, res) => {
//   res.status(200).send("Hi");
// });

// // Webhook endpoint
// app.post('/webhook/moderation', (req, res) => {
//   const { public_id, moderation, notification_type } = req.body;

//   // Log the full incoming webhook body for debugging
//   console.log("Received webhook body:", JSON.stringify(req.body, null, 2));

//   // Check if it's a moderation notification
//   if (notification_type === 'moderation') {
//     if (Array.isArray(moderation) && moderation.length > 0) {
//       const status = moderation[0].status;

//       if (status === 'approved') {
//         console.log(`✅ Image ${public_id} was approved.`);
        
//       } else {
//         console.log(`❌ Image ${public_id} was rejected.`);
//         // TODO: Handle rejected image (e.g., notify user)
//       }
//     } else {
//       console.log("⚠️ Moderation data missing or malformed.");
//     }
//   } else {
//     console.log("⚠️ Received unexpected notification type:", notification_type);
//   }

//   // Acknowledge receipt of the webhook
//   res.sendStatus(200);
// });

// app.listen(3000, () => {
//   console.log('✅ Webhook server running on port 3000');
// });


  

