import { pgTable, varchar, decimal, date, uuid, index } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestamps } from './utils';
import { students } from './students';

/**
 * Financial Records table schema
 * 
 * Stores student financial summary including tuition, fees, payments, and outstanding balance.
 * Each student has one financial record that is updated as payments are made.
 * 
 * Requirements: 4.1-4.5
 */
export const financialRecords = pgTable('financial_records', {
  id: uuidPrimaryKey(),
  student_id: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull().unique(),
  total_tuition: decimal('total_tuition', { precision: 10, scale: 2 }).notNull().default('0.00'),
  total_fees: decimal('total_fees', { precision: 10, scale: 2 }).notNull().default('0.00'),
  total_payments: decimal('total_payments', { precision: 10, scale: 2 }).notNull().default('0.00'),
  outstanding_balance: decimal('outstanding_balance', { precision: 10, scale: 2 }).notNull().default('0.00'),
  ...timestamps,
}, (table) => ({
  // Index on student_id for query optimization
  studentIdIdx: index('financial_records_student_id_idx').on(table.student_id),
}));

/**
 * Payments table schema
 * 
 * Stores individual payment transactions made by students.
 * Tracks payment method and reference number for reconciliation.
 * 
 * Requirements: 4.1-4.5
 */
export const payments = pgTable('payments', {
  id: uuidPrimaryKey(),
  student_id: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  payment_date: date('payment_date').notNull(),
  payment_method: varchar('payment_method', { length: 50 }).notNull(), // 'cash', 'check', 'credit_card', 'bank_transfer', 'online'
  reference_number: varchar('reference_number', { length: 100 }).notNull(),
  ...timestamps,
}, (table) => ({
  // Index on student_id for query optimization
  studentIdIdx: index('payments_student_id_idx').on(table.student_id),
  // Index on payment_date for ordering
  paymentDateIdx: index('payments_payment_date_idx').on(table.payment_date),
}));
