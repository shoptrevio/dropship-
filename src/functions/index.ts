
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import fetch from 'node-fetch';

admin.initializeApp();
const db = admin.firestore();

/**
 * A Firebase Function that triggers when a new user signs up.
 * It adds their email to a 'subscribers' collection and sends a welcome email.
 */
exports.subscribeUserAndSendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  const { email, uid } = user;

  if (!email) {
    console.error(`User ${uid} has no email address.`);
    return null;
  }

  // 1. Add user's email to the 'subscribers' collection
  try {
    await db.collection('subscribers').doc(uid).set({
      email: email,
      subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Successfully added ${email} to subscribers list.`);
  } catch (error) {
    console.error(`Failed to add user ${uid} to subscribers list:`, error);
    // Even if this fails, we can still try to send the email
  }

  // 2. Send a welcome email using a third-party service (e.g., SendGrid)
  // IMPORTANT: Replace with your actual email service provider's details and API key.
  // Store your API key securely in environment configuration, not in the code.
  // For example: `firebase functions:config:set sendgrid.key="YOUR_API_KEY"`
  const apiKey = functions.config().sendgrid?.key;
  if (!apiKey) {
    console.error('SendGrid API key not configured. Skipping welcome email.');
    return null;
  }

  const emailData = {
    personalizations: [{ to: [{ email: email }] }],
    from: { email: 'welcome@your-app-name.com' }, // Use a verified sender email
    subject: 'Welcome to CommerceAI!',
    content: [{
      type: 'text/html',
      value: '<h1>Welcome!</h1><p>Thanks for signing up. We\'re excited to have you on board.</p>',
    }],
  };

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (response.ok) {
      console.log(`Welcome email sent successfully to ${email}.`);
    } else {
      const errorBody = await response.json();
      console.error(`Failed to send welcome email to ${email}. Status: ${response.status}`, errorBody);
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send welcome email.');
  }

  return null;
});


/**
 * A Firebase Function that runs on a schedule (e.g., once a day)
 * to update all 'pending' orders to 'completed'.
 */
exports.completePendingOrders = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const pendingOrdersQuery = db
      .collection('orders')
      .where('status', '==', 'pending');

    const snapshot = await pendingOrdersQuery.get();

    if (snapshot.empty) {
      console.log('No pending orders to process.');
      return null;
    }

    const batch = db.batch();
    snapshot.forEach(doc => {
      console.log(`Updating order ${doc.id} to 'completed'.`);
      batch.update(doc.ref, { status: 'completed' });
    });

    try {
      await batch.commit();
      console.log(`Successfully updated ${snapshot.size} orders.`);
      return { success: true, count: snapshot.size };
    } catch (error) {
      console.error('Batch update failed', error);
      throw new functions.https.HttpsError('internal', 'Failed to update orders.');
    }
  });
  
/**
 * A Firebase Function that monitors stock levels and sends an alert
 * when a product's inventory drops below a certain threshold.
 */
exports.monitorStockLevels = functions.firestore
  .document('products/{productId}')
  .onUpdate(async (change, context) => {
    const productDataAfter = change.after.data();
    const productDataBefore = change.before.data();
    const productName = productDataAfter.name;
    const LOW_STOCK_THRESHOLD = 10;

    const webhookUrl = functions.config().slack?.webhook_url;
    if (!webhookUrl) {
      console.error('Slack webhook URL not configured. Skipping alert.');
      return null;
    }

    const alerts: Promise<any>[] = [];

    productDataAfter.variants.forEach((variantAfter: any, index: number) => {
      const variantBefore = productDataBefore.variants[index];
      
      // Check if stock has just dropped below the threshold
      if (variantAfter.inventory < LOW_STOCK_THRESHOLD && variantBefore.inventory >= LOW_STOCK_THRESHOLD) {
        const message = `LOW STOCK ALERT: Product "${productName}" (Variant: ${variantAfter.color || ''} ${variantAfter.size || ''}) has only ${variantAfter.inventory} units left.`;
        
        console.log(message);
        
        const alertPromise = fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: message }),
        });
        
        alerts.push(alertPromise);
      }
    });

    try {
      await Promise.all(alerts);
      console.log('Successfully sent all low stock alerts.');
    } catch (error) {
      console.error('Failed to send one or more stock alerts:', error);
      throw new functions.https.HttpsError('internal', 'Failed to send stock alerts.');
    }
    
    return null;
  });
