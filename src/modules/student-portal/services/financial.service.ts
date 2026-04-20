/**
 * Student Portal - Financial Service
 * Business logic layer for student financial records management
 * 
 * Handles financial record retrieval including tuition, fees, payments, and balance.
 * Ensures students can only access their own financial records.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { eq, desc } from 'drizzle-orm';
import { Database } from '../../../db';
import { financialRecords, payments } from '../../../db/schema/financialRecords';
import { NotFoundError } from '../../../shared/errors';
import { FinancialRecordDTO } from '../types';

export class FinancialService {
  constructor(private db: Database) {}

  /**
   * Get financial record for a student
   * 
   * Retrieves the student's financial summary including:
   * - Total tuition
   * - Total fees
   * - Total payments
   * - Outstanding balance (calculated as tuition + fees - payments)
   * - Payment history ordered by payment_date descending
   * 
   * @param studentId - The student UUID (internal ID) to retrieve financial record for
   * @returns Financial record with payment history
   * @throws NotFoundError if financial record not found
   * 
   * Requirements: 4.1, 4.2, 4.3, 4.4
   */
  async getFinancialRecord(studentId: string): Promise<FinancialRecordDTO> {
    // Retrieve financial record
    const financialResult = await this.db
      .select()
      .from(financialRecords)
      .where(eq(financialRecords.student_id, studentId))
      .limit(1);

    const financialRecord = financialResult[0];

    if (!financialRecord) {
      throw new NotFoundError('Financial record not found');
    }

    // Retrieve payment history ordered by payment_date descending
    const paymentHistory = await this.db
      .select({
        payment_date: payments.payment_date,
        amount: payments.amount,
        payment_method: payments.payment_method,
        reference_number: payments.reference_number,
      })
      .from(payments)
      .where(eq(payments.student_id, studentId))
      .orderBy(desc(payments.payment_date));

    // Calculate outstanding balance
    // Outstanding balance = (total_tuition + total_fees - total_payments)
    const totalTuition = parseFloat(financialRecord.total_tuition);
    const totalFees = parseFloat(financialRecord.total_fees);
    const totalPayments = parseFloat(financialRecord.total_payments);
    const outstandingBalance = totalTuition + totalFees - totalPayments;

    return {
      total_tuition: totalTuition,
      total_fees: totalFees,
      total_payments: totalPayments,
      outstanding_balance: outstandingBalance,
      payment_history: paymentHistory.map((payment) => ({
        payment_date: payment.payment_date,
        amount: parseFloat(payment.amount),
        payment_method: payment.payment_method,
        reference_number: payment.reference_number,
      })),
    };
  }
}
