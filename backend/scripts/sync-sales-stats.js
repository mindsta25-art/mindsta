/**
 * Sync Sales Statistics Script
 * This script recalculates and syncs sales statistics from the Payment collection
 * to the SystemSettings.salesStats field
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') });

import Payment from '../server/models/Payment.js';
import SystemSettings from '../server/models/SystemSettings.js';

async function syncSalesStats() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindsta';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get all successful payments
    const successfulPayments = await Payment.find({ status: 'success' });
    
    console.log(`📊 Found ${successfulPayments.length} successful payments\n`);

    if (successfulPayments.length === 0) {
      console.log('ℹ️  No payments found. Sales stats will be initialized to zero.');
    }

    // Calculate total statistics
    let totalSales = 0;
    let totalRevenue = 0;
    let totalItems = 0;
    let lastSaleDate = null;

    // Calculate monthly statistics (current month)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let monthlySales = 0;
    let monthlyRevenue = 0;

    for (const payment of successfulPayments) {
      totalSales += 1;
      // Payment.amount is stored in Naira, convert to kobo for consistent storage
      const amountInKobo = Math.round((payment.amount || 0) * 100);
      totalRevenue += amountInKobo;
      totalItems += payment.items?.length || 0;

      if (payment.paidAt) {
        if (!lastSaleDate || new Date(payment.paidAt) > new Date(lastSaleDate)) {
          lastSaleDate = payment.paidAt;
        }

        // Check if payment is from current month
        const paymentDate = new Date(payment.paidAt);
        if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
          monthlySales += 1;
          monthlyRevenue += amountInKobo;
        }
      }
    }

    // Get or create system settings
    const settings = await SystemSettings.getSingleton();

    // Update sales stats
    settings.salesStats = {
      totalSales,
      totalRevenue,
      totalItems,
      lastSaleDate,
      monthlySales,
      monthlyRevenue,
      lastMonthReset: new Date()
    };

    await settings.save();

    console.log('✅ Sales statistics synced successfully!\n');
    console.log('📈 Sales Statistics Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Total Sales:          ${totalSales.toLocaleString()}`);
    console.log(`   Total Revenue:        ₦${(totalRevenue / 100).toLocaleString()}`);
    console.log(`   Total Items Sold:     ${totalItems.toLocaleString()}`);
    console.log(`   Average Order Value:  ₦${totalSales > 0 ? ((totalRevenue / totalSales) / 100).toFixed(2) : '0.00'}`);
    console.log(`   Monthly Sales:        ${monthlySales.toLocaleString()}`);
    console.log(`   Monthly Revenue:      ₦${(monthlyRevenue / 100).toLocaleString()}`);
    console.log(`   Last Sale Date:       ${lastSaleDate ? new Date(lastSaleDate).toLocaleString() : 'N/A'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error syncing sales stats:', error.message);
    console.error(error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the sync
console.log('🚀 Sales Statistics Sync Script');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
syncSalesStats();
