import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();
const db = admin.firestore();

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