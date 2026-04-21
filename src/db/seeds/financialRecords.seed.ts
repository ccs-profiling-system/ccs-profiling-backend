import { Database } from '../index';
import { financialRecords, payments } from '../schema/financialRecords';
import { generateUUIDv7 } from '../../shared/utils/uuid';

interface FinancialRecordSeed {
  total_tuition: string;
  total_fees: string;
  paymentCount: number; // Number of payments to generate
}

interface PaymentSeed {
  amount: string;
  payment_method: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'online';
  daysAgo: number; // How many days ago the payment was made
}

// Tuition and fees vary by year level
const tuitionByYearLevel: Record<number, FinancialRecordSeed> = {
  1: { total_tuition: '45000.00', total_fees: '5000.00', paymentCount: 2 },
  2: { total_tuition: '47000.00', total_fees: '5200.00', paymentCount: 3 },
  3: { total_tuition: '49000.00', total_fees: '5400.00', paymentCount: 2 },
  4: { total_tuition: '51000.00', total_fees: '5600.00', paymentCount: 4 },
};

const paymentMethods: Array<'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'online'> = [
  'cash',
  'check',
  'credit_card',
  'bank_transfer',
  'online',
];

function generateReferenceNumber(method: string): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const prefix = method.substring(0, 3).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function seedFinancialRecords(
  db: Database,
  studentIds: string[],
  studentYearLevels: Record<string, number>
) {
  const createdRecords: string[] = [];
  const createdPayments: string[] = [];

  console.log('  Creating financial records and payments...');

  for (const studentId of studentIds) {
    const yearLevel = studentYearLevels[studentId] || 1;
    const financialSeed = tuitionByYearLevel[yearLevel];

    // Create financial record
    const recordId = generateUUIDv7();
    const totalTuition = parseFloat(financialSeed.total_tuition);
    const totalFees = parseFloat(financialSeed.total_fees);
    const totalAmount = totalTuition + totalFees;

    // Generate payments (50-90% of total amount paid)
    const paymentPercentage = 0.5 + Math.random() * 0.4; // 50-90%
    const totalPaymentsAmount = totalAmount * paymentPercentage;
    const outstandingBalance = totalAmount - totalPaymentsAmount;

    // Create individual payments
    const paymentCount = financialSeed.paymentCount;
    const paymentAmounts: PaymentSeed[] = [];
    let remainingAmount = totalPaymentsAmount;

    for (let i = 0; i < paymentCount; i++) {
      const isLastPayment = i === paymentCount - 1;
      const amount = isLastPayment
        ? remainingAmount
        : remainingAmount / (paymentCount - i) * (0.8 + Math.random() * 0.4); // Vary payment amounts

      const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const daysAgo = 90 - (i * Math.floor(90 / paymentCount)); // Spread payments over 90 days

      paymentAmounts.push({
        amount: amount.toFixed(2),
        payment_method: method,
        daysAgo,
      });

      remainingAmount -= amount;
    }

    // Insert financial record
    await db.insert(financialRecords).values({
      id: recordId,
      student_id: studentId,
      total_tuition: financialSeed.total_tuition,
      total_fees: financialSeed.total_fees,
      total_payments: totalPaymentsAmount.toFixed(2),
      outstanding_balance: outstandingBalance.toFixed(2),
    });

    createdRecords.push(recordId);

    // Insert payments
    for (const paymentSeed of paymentAmounts) {
      const paymentId = generateUUIDv7();
      const paymentDate = new Date(Date.now() - paymentSeed.daysAgo * 24 * 60 * 60 * 1000);
      const formattedDate = paymentDate.toISOString().split('T')[0]; // YYYY-MM-DD

      await db.insert(payments).values({
        id: paymentId,
        student_id: studentId,
        amount: paymentSeed.amount,
        payment_date: formattedDate,
        payment_method: paymentSeed.payment_method,
        reference_number: generateReferenceNumber(paymentSeed.payment_method),
      });

      createdPayments.push(paymentId);
    }
  }

  console.log(`  - Created ${createdRecords.length} financial records`);
  console.log(`  - Created ${createdPayments.length} payment transactions`);

  return { recordIds: createdRecords, paymentIds: createdPayments };
}
