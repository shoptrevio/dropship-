
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import fetch from 'node-fetch';
import { generateProductDescription, GenerateProductDescriptionInput } from '@/ai/flows/generate-product-description';
import {Translate} from '@google-cloud/translate/build/src/v2';


admin.initializeApp();
const db = admin.firestore();
const translate = new Translate();


/**
 * A Firebase Function that triggers when a new document is added to the 'product_drafts' collection.
 * It calls the Genkit AI flow to generate a product description and saves it back to the draft document.
 */
exports.generateDescriptionForProductDraft = functions.firestore
  .document('product_drafts/{draftId}')
  .onCreate(async (snap, context) => {
    const draftData = snap.data();
    
    if (!draftData) {
      console.log('No data associated with the event.');
      return null;
    }

    const { productName, productCategory, keyFeatures, targetAudience } = draftData;

    if (!productName || !productCategory || !keyFeatures || !targetAudience) {
      console.error('Draft is missing required fields for description generation.');
      return snap.ref.update({ status: 'error', errorMessage: 'Missing required fields.' });
    }

    const input: GenerateProductDescriptionInput = {
      productName,
      productCategory,
      keyFeatures,
      targetAudience,
    };

    try {
      console.log(`Generating description for: ${productName}`);
      await snap.ref.update({ status: 'generating' });

      const result = await generateProductDescription(input);
      const { description } = result;

      console.log(`Successfully generated description for: ${productName}`);
      return snap.ref.update({ 
        'aiGeneratedContent.description': description,
        status: 'completed'
      });
    } catch (error) {
      console.error('Error generating product description:', error);
      return snap.ref.update({ status: 'error', errorMessage: 'AI generation failed.' });
    }
  });


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

/**
 * A Firebase Function that awards loyalty points to a user when they complete a purchase.
 * It triggers when a new document is created in the 'orders' collection.
 */
exports.awardLoyaltyPoints = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const orderData = snap.data();
    const userId = orderData.userId;
    const items = orderData.items;

    if (!userId || !items || items.length === 0) {
      console.log('Order is missing user ID or items. Cannot award points.');
      return null;
    }

    // Calculate total amount spent
    const totalSpent = items.reduce((sum: number, item: any) => {
      return sum + item.priceAtPurchase * item.quantity;
    }, 0);

    // Award 1 point for every $10 spent
    const pointsToAward = Math.floor(totalSpent / 10);

    if (pointsToAward === 0) {
      console.log(`Order total ($${totalSpent.toFixed(2)}) is less than $10. No points awarded.`);
      return null;
    }

    const userRef = db.collection('users').doc(userId);

    try {
      // Use a transaction to safely update the user's points
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw new Error('User document not found!');
        }
        const currentPoints = userDoc.data()?.loyalty_points || 0;
        const newPoints = currentPoints + pointsToAward;
        transaction.update(userRef, { loyalty_points: newPoints });
      });

      // Alternative using FieldValue.increment() for simpler atomic updates
      // await userRef.update({
      //   loyalty_points: admin.firestore.FieldValue.increment(pointsToAward),
      // });
      
      console.log(`Awarded ${pointsToAward} loyalty points to user ${userId}.`);

    } catch (error) {
      console.error(`Failed to award loyalty points to user ${userId}:`, error);
      throw new functions.https.HttpsError('internal', 'Could not award loyalty points.');
    }
    
    return null;
  });

/**
 * A Firebase Function that automatically translates product names to Spanish.
 * It triggers when a product's name is created or updated.
 */
exports.translateProductName = functions.firestore
  .document('products/{productId}')
  .onWrite(async (change, context) => {
    const dataAfter = change.after.data();
    // If document is deleted, do nothing
    if (!dataAfter) {
      return null;
    }

    const englishName = dataAfter.name;
    const spanishName = dataAfter.name_es;

    // Check if the name has changed and a Spanish translation doesn't already exist
    // Or if the English name exists but the Spanish one doesn't
    const needsTranslation = !change.before.exists || (change.before.data().name !== englishName) || !spanishName;

    if (!englishName || !needsTranslation) {
      console.log('No new English name to translate, or Spanish name already exists. Skipping.');
      return null;
    }

    try {
      console.log(`Translating "${englishName}" to Spanish.`);
      const [translation] = await translate.translate(englishName, 'es');
      console.log(`Translated name: ${translation}`);

      return change.after.ref.update({
        name_es: translation,
      });
    } catch (error) {
      console.error('Error translating product name:', error);
      throw new functions.https.HttpsError('internal', 'Failed to translate product name.');
    }
  });
