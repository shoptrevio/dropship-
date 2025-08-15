
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import fetch from 'node-fetch';
import { generateProductDescription, GenerateProductDescriptionInput } from '@/ai/flows/generate-product-description';
import {Translate} from '@google-cloud/translate/build/src/v2';
import * as vision from '@google-cloud/vision';


admin.initializeApp();
const db = admin.firestore();
const translate = new Translate();
const visionClient = new vision.ImageAnnotatorClient();

/**
 * A centralized error logging and alerting function.
 * @param {any} error The error object.
 * @param {string} functionName The name of the function where the error occurred.
 * @param {any} context Additional context about the error.
 * @param {boolean} isCritical If true, sends an alert to Slack.
 */
const logErrorAndAlertAdmin = async (error: any, functionName: string, context: any, isCritical: boolean = false) => {
  const logEntry = {
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    functionName,
    errorMessage: error.message,
    errorStack: error.stack,
    context,
  };

  // Log to Firestore
  try {
    await db.collection('logs').add(logEntry);
  } catch (logError) {
    console.error('FATAL: Could not write to logs collection.', logError);
  }

  // Alert on critical errors
  if (isCritical) {
    const webhookUrl = functions.config().slack?.webhook_url;
    if (!webhookUrl) {
      console.error('Slack webhook URL not configured. Skipping critical alert.');
      return;
    }

    const message = `🚨 Critical Error in ${functionName}:\n\`\`\`${error.message}\`\`\`\nContext: \`\`\`${JSON.stringify(context)}\`\`\``;
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });
    } catch (alertError) {
      console.error('FATAL: Could not send Slack alert.', alertError);
    }
  }
};


/**
 * A Firebase Function that triggers when a new user signs up.
 * It creates a corresponding user document in Firestore.
 */
exports.createNewUserDocument = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;
  const userRef = db.collection('users').doc(uid);

  try {
    await userRef.set({
      email: email || '',
      displayName: displayName || '',
      role: 'customer', // Default role
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Successfully created user document for ${uid}`);
  } catch (error) {
    await logErrorAndAlertAdmin(error, 'createNewUserDocument', { userId: uid }, true);
  }
  return null;
});


/**
 * A Firebase Function that triggers when a new document is added to the 'product_drafts' collection.
 * It calls the Genkit AI flow to generate a product description and saves it back to the draft document.
 */
exports.generateDescriptionForProductDraft = functions.firestore
  .document('product_drafts/{draftId}')
  .onCreate(async (snap, context) => {
    const draftData = snap.data();
    const draftId = context.params.draftId;
    
    if (!draftData) {
      console.log('No data associated with the event.');
      return null;
    }

    const { productName, productCategory, keyFeatures, targetAudience } = draftData;

    if (!productName || !productCategory || !keyFeatures || !targetAudience) {
      const errorMessage = 'Draft is missing required fields.';
      console.error(errorMessage);
      return snap.ref.update({ status: 'error', errorMessage });
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
      await logErrorAndAlertAdmin(error, 'generateDescriptionForProductDraft', { draftId }, true);
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
    await logErrorAndAlertAdmin(error, 'subscribeUserAndSendWelcomeEmail', { step: 'firestore', userId: uid }, false);
  }

  // 2. Send a welcome email using a third-party service (e.g., SendGrid)
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
    await logErrorAndAlertAdmin(error, 'subscribeUserAndSendWelcomeEmail', { step: 'sendgrid', userId: uid }, true);
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
      await logErrorAndAlertAdmin(error, 'completePendingOrders', { batchSize: snapshot.size }, true);
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
    const productId = context.params.productId;
    const LOW_STOCK_THRESHOLD = 10;

    const webhookUrl = functions.config().slack?.webhook_url;
    if (!webhookUrl) {
      console.error('Slack webhook URL not configured. Skipping alert.');
      return null;
    }

    const alerts: Promise<any>[] = [];

    productDataAfter.variants.forEach((variantAfter: any, index: number) => {
      const variantBefore = productDataBefore.variants[index];
      
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
    } catch (error) {
       await logErrorAndAlertAdmin(error, 'monitorStockLevels', { productId }, false);
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
    const { orderId } = context.params;
    const { userId, items } = orderData;

    if (!userId || !items || items.length === 0) {
      console.log(`Order ${orderId} is missing user ID or items. Cannot award points.`);
      return null;
    }

    const totalSpent = items.reduce((sum: number, item: any) => {
      return sum + item.priceAtPurchase * item.quantity;
    }, 0);

    const pointsToAward = Math.floor(totalSpent / 10);

    if (pointsToAward === 0) {
      console.log(`Order total ($${totalSpent.toFixed(2)}) is less than $10. No points awarded for order ${orderId}.`);
      return null;
    }

    const userRef = db.collection('users').doc(userId);

    try {
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw new Error('User document not found!');
        }
        const currentPoints = userDoc.data()?.loyalty_points || 0;
        const newPoints = currentPoints + pointsToAward;
        transaction.update(userRef, { loyalty_points: newPoints });
      });
      
      console.log(`Awarded ${pointsToAward} loyalty points to user ${userId} for order ${orderId}.`);

    } catch (error) {
      // Use the centralized error handler
      await logErrorAndAlertAdmin(error, 'awardLoyaltyPoints', { userId, orderId }, true);
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
    const productId = context.params.productId;

    if (!dataAfter) {
      return null;
    }

    const englishName = dataAfter.name;
    const spanishName = dataAfter.name_es;
    const needsTranslation = !change.before.exists || (change.before.data().name !== englishName) || !spanishName;

    if (!englishName || !needsTranslation) {
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
      await logErrorAndAlertAdmin(error, 'translateProductName', { productId, englishName }, false);
    }
    return null;
  });

/**
 * A Firebase Function that runs on a schedule to send abandoned cart reminders.
 */
exports.sendAbandonedCartReminders = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const sendgridApiKey = functions.config().sendgrid?.key;
    if (!sendgridApiKey) {
      console.error('SendGrid API key not configured. Cannot send reminder emails.');
      return null;
    }

    const twentyFourHoursAgo = admin.firestore.Timestamp.fromMillis(
      Date.now() - 24 * 60 * 60 * 1000
    );

    const cartsRef = db.collection('carts');
    const abandonedCartsQuery = cartsRef
      .where('status', '==', 'active')
      .where('lastUpdatedAt', '<=', twentyFourHoursAgo);

    const snapshot = await abandonedCartsQuery.get();

    if (snapshot.empty) {
      console.log('No abandoned carts to process.');
      return null;
    }

    const promises = snapshot.docs.map(async (doc) => {
      const cart = doc.data();
      const userRef = db.collection('users').doc(cart.userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists || !userDoc.data()?.email) {
        return;
      }
      const user = userDoc.data();

      const emailData = {
        personalizations: [{ to: [{ email: user.email }] }],
        from: { email: 'reminders@your-app-name.com', name: 'CommerceAI' },
        subject: 'You left something in your cart!',
        content: [{
          type: 'text/html',
          value: `<h1>Don't miss out!</h1><p>You still have items in your shopping cart. Complete your purchase now!</p>`,
        }],
      };
      
      try {
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendgridApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData),
        });
        await doc.ref.update({ status: 'reminder_sent' });
      } catch (error) {
        await logErrorAndAlertAdmin(error, 'sendAbandonedCartReminders', { cartId: doc.id, userId: cart.userId }, false);
      }
    });

    await Promise.all(promises);
    return null;
  });

/**
 * A Firebase Function that triggers when an image is uploaded to Firebase Storage.
 */
exports.analyzeProductImage = functions.storage.object().onFinalize(async (object) => {
  const { contentType, name: filePath, bucket: bucketName } = object;

  if (!contentType?.startsWith('image/') || !filePath?.startsWith('products/')) {
    return null;
  }

  const pathParts = filePath.split('/');
  const productId = pathParts[1];
  if (!productId) return null;

  console.log(`Analyzing image for product: ${productId}`);
  const gcsUri = `gs://${bucketName}/${filePath}`;
  
  try {
    const [result] = await visionClient.labelDetection(gcsUri);
    const labels = result.labelAnnotations;
    
    if (!labels || labels.length === 0) return null;
    
    const tags = labels.map(label => label.description).filter(Boolean) as string[];
    
    const productRef = db.collection('products').doc(productId);
    await productRef.set({ aiGeneratedContent: { visualSearchTags: tags } }, { merge: true });

    console.log(`Successfully saved tags for product ${productId}.`);
  } catch (error) {
    await logErrorAndAlertAdmin(error, 'analyzeProductImage', { gcsUri }, true);
  }
  return null;
});


/**
 * A Firebase Function that triggers when an order's status changes to 'shipped'.
 */
exports.sendShippingNotification = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const { orderId } = context.params;
    const orderDataAfter = change.after.data();

    if (change.before.data().status !== 'shipped' && orderDataAfter.status === 'shipped') {
      const { userId } = orderDataAfter;
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists || !userDoc.data()?.email) return null;
      const userEmail = userDoc.data()?.email;
      
      const sendgridApiKey = functions.config().sendgrid?.key;
      if (!sendgridApiKey) return null;

      const emailData = {
        personalizations: [{ to: [{ email: userEmail }] }],
        from: { email: 'shipping@your-app-name.com', name: 'CommerceAI Shipping' },
        subject: `Your order #${orderId} has shipped!`,
        content: [{
          type: 'text/html',
          value: `<h1>Great News!</h1><p>Your order #${orderId} is on its way. Track it: ${orderDataAfter.tracking?.trackingNumber || 'N/A'}.</p>`,
        }],
      };
      
      try {
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${sendgridApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(emailData),
        });
      } catch (error) {
        await logErrorAndAlertAdmin(error, 'sendShippingNotification', { orderId, userId }, true);
      }
    }
    return null;
  });

/**
 * A callable Firebase Function for admin users to fetch aggregated daily sales data.
 */
exports.getDailySalesStats = functions.https.onCall(async (data, context) => {
  if (context.auth?.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Must be an admin to call this function.');
  }

  const thirtyDaysAgo = admin.firestore.Timestamp.fromMillis(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const snapshot = await db.collection('transactions').where('createdAt', '>=', thirtyDaysAgo).get();

  if (snapshot.empty) return {};

  const salesByDay: { [key: string]: number } = {};
  snapshot.forEach(doc => {
    const { createdAt, amount } = doc.data();
    const date = createdAt.toDate().toISOString().split('T')[0];
    salesByDay[date] = (salesByDay[date] || 0) + amount;
  });

  return salesByDay;
});

/**
 * A Firebase Function that assigns the 'admin' role to a user.
 */
exports.assignAdminRole = functions.firestore
  .document('admin_users/{email}')
  .onCreate(async (snap, context) => {
    const userEmail = context.params.email;
    try {
      const user = await admin.auth().getUserByEmail(userEmail);
      if (user.customClaims && (user.customClaims as any).role === 'admin') {
        return;
      }
      await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
      await db.collection('users').doc(user.uid).update({ role: 'admin' });
      console.log(`Successfully assigned admin role to ${userEmail}.`);
    } catch (error) {
      await logErrorAndAlertAdmin(error, 'assignAdminRole', { email: userEmail }, true);
    }
    return null;
  });
