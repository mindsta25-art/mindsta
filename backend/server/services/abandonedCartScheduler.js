/**
 * Abandoned Cart Email Scheduler
 *
 * Runs every hour.  Finds carts that:
 *   1. Have at least one item
 *   2. Were last updated > 24 hours ago (configurable via ABANDONED_CART_HOURS env var)
 *   3. Have NOT already had an email sent in this abandonment cycle
 *
 * Sends the user a single reminder email then stamps abandonedEmailSentAt so we
 * don't send again until they add something new (cart.js resets the field on add).
 */

import Cart from '../models/Cart.js';
import User from '../models/User.js';
import { sendAbandonedCartEmail } from './emailService.js';

const ABANDONED_HOURS = parseInt(process.env.ABANDONED_CART_HOURS || '24', 10);
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // every hour

export const runAbandonedCartCheck = async () => {
  try {
    const cutoff = new Date(Date.now() - ABANDONED_HOURS * 60 * 60 * 1000);

    // Carts with items, not updated recently, email not yet sent this cycle
    const abandonedCarts = await Cart.find({
      'items.0': { $exists: true },           // at least one item
      updatedAt: { $lt: cutoff },             // stale for ABANDONED_HOURS+
      $or: [
        { abandonedEmailSentAt: null },
        { abandonedEmailSentAt: { $exists: false } },
      ],
    }).lean();

    if (abandonedCarts.length === 0) return;

    console.log(`[AbandonedCart] Found ${abandonedCarts.length} abandoned cart(s) to remind`);

    for (const cart of abandonedCarts) {
      try {
        const user = await User.findById(cart.userId).select('email fullName isVerified status').lean();

        // Only email verified, active accounts
        if (!user || !user.isVerified || user.status !== 'active') continue;

        await sendAbandonedCartEmail(
          user.email,
          user.fullName,
          cart.items,
          cart.totalAmount || 0,
        );

        // Stamp so we don't email again
        await Cart.updateOne({ _id: cart._id }, { $set: { abandonedEmailSentAt: new Date() } });

        console.log(`[AbandonedCart] ✅ Reminder sent to ${user.email}`);
      } catch (userErr) {
        console.error(`[AbandonedCart] ❌ Failed for cart ${cart._id}:`, userErr.message);
      }
    }
  } catch (err) {
    console.error('[AbandonedCart] ❌ Scheduler error:', err.message);
  }
};

export const startAbandonedCartScheduler = () => {
  console.log(`[AbandonedCart] Scheduler started — checking every hour, ${ABANDONED_HOURS}h threshold`);
  // Run once immediately on startup (catches any overnight stragglers)
  runAbandonedCartCheck();
  setInterval(runAbandonedCartCheck, CHECK_INTERVAL_MS);
};
