import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles
export type UserRole = "admin" | "receptionist" | "staff" | "member";
export type Gender = "male" | "female";
export type AttendanceMethod = "manual" | "facial" | "fingerprint" | "rfid";
export type FreezeStatus = "pending" | "approved" | "rejected";
export type MemberStatus = "active" | "inactive" | "frozen";
export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";
export type AlertType = "fee_due" | "membership_expiring" | "membership_expired" | "freeze_approved" | "freeze_rejected";
export type TransactionType = "payment" | "expense" | "refund" | "adjustment";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

// Branches
export const branches = pgTable("branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  location: text("location").notNull(),
  contactNumber: text("contact_number"),
});

// Users (for authentication and role management)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  uid: text("uid").notNull().unique(),
  mobile: text("mobile").notNull().unique(),
  email: text("email"),
  role: text("role").notNull(),
  branchId: varchar("branch_id").references(() => branches.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Members
export const members = pgTable("members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  mobile: text("mobile").notNull(),
  email: text("email"),
  address: text("address"),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  emergencyContact: text("emergency_contact"),
  photoUrl: text("photo_url"),
  membershipPlanId: varchar("membership_plan_id").references(() => membershipPlans.id),
  joinDate: text("join_date").notNull(),
  expiryDate: text("expiry_date"),
  status: text("status").notNull().default("active"),
  branchId: varchar("branch_id").references(() => branches.id),
  biometricData: text("biometric_data"),
});

// Membership Plans
export const membershipPlans = pgTable("membership_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  fee: decimal("fee", { precision: 10, scale: 2 }).notNull(),
  durationDays: integer("duration_days").notNull(),
  branchId: varchar("branch_id").references(() => branches.id),
  isActive: boolean("is_active").default(true),
});

// Employees
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  mobile: text("mobile").notNull(),
  email: text("email"),
  gender: text("gender"),
  designation: text("designation"),
  salary: decimal("salary", { precision: 10, scale: 2 }).notNull(),
  shiftStart: text("shift_start"),
  shiftEnd: text("shift_end"),
  restDay: text("rest_day"),
  joinDate: text("join_date").notNull(),
  photoUrl: text("photo_url"),
  branchId: varchar("branch_id").references(() => branches.id),
  isActive: boolean("is_active").default(true),
});

// Attendance (for both members and employees)
export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").references(() => members.id),
  employeeId: varchar("employee_id").references(() => employees.id),
  date: text("date").notNull(),
  time: text("time").notNull(),
  method: text("method").notNull(),
  branchId: varchar("branch_id").references(() => branches.id),
});

// Freeze Requests
export const freezeRequests = pgTable("freeze_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").references(() => members.id).notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"),
  requestedAt: timestamp("requested_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
});

// Payroll
export const payroll = pgTable("payroll", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id).notNull(),
  month: text("month").notNull(),
  year: integer("year").notNull(),
  basicSalary: decimal("basic_salary", { precision: 10, scale: 2 }).notNull(),
  daysWorked: integer("days_worked").notNull(),
  totalDays: integer("total_days").notNull(),
  calculatedSalary: decimal("calculated_salary", { precision: 10, scale: 2 }).notNull(),
  deductions: decimal("deductions", { precision: 10, scale: 2 }).default("0"),
  netSalary: decimal("net_salary", { precision: 10, scale: 2 }).notNull(),
  generatedAt: timestamp("generated_at").defaultNow(),
  generatedBy: varchar("generated_by").references(() => users.id),
});

// Payments
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").references(() => members.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: text("payment_date").notNull(),
  paymentTime: text("payment_time"),
  paymentMethod: text("payment_method"),
  planId: varchar("plan_id").references(() => membershipPlans.id),
  receiptNumber: text("receipt_number"),
  status: text("status").default("completed"),
  collectedBy: varchar("collected_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Expenses
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  branchId: varchar("branch_id").references(() => branches.id),
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: text("date").notNull(),
  description: text("description"),
  createdBy: varchar("created_by").references(() => users.id),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// System Settings
export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// RBAC Permissions
export const rbacPermissions = pgTable("rbac_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  module: text("module").notNull(),
  canView: boolean("can_view").default(false),
  canCreate: boolean("can_create").default(false),
  canEdit: boolean("can_edit").default(false),
  canDelete: boolean("can_delete").default(false),
  canExport: boolean("can_export").default(false),
});

// Fee Alerts
export const feeAlerts = pgTable("fee_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").references(() => members.id).notNull(),
  alertType: text("alert_type").notNull(),
  dueDate: text("due_date"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  message: text("message").notNull(),
  isResolved: boolean("is_resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Task Assignments
export const taskAssignments = pgTable("task_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignedTo: varchar("assigned_to").references(() => users.id).notNull(),
  assignedBy: varchar("assigned_by").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: text("due_date"),
  priority: text("priority").default("medium"),
  status: text("status").default("pending"),
  branchId: varchar("branch_id").references(() => branches.id),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Ledger Transactions (Unified view of all financial transactions)
export const ledgerTransactions = pgTable("ledger_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  branchId: varchar("branch_id").references(() => branches.id),
  type: text("type").notNull(),
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: text("date").notNull(),
  description: text("description"),
  referenceId: varchar("reference_id"),
  referenceType: text("reference_type"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert Schemas and Types

export const insertBranchSchema = createInsertSchema(branches).omit({ id: true });
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type Branch = typeof branches.$inferSelect;

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertMemberSchema = createInsertSchema(members).omit({ id: true });
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;

export const insertMembershipPlanSchema = createInsertSchema(membershipPlans).omit({ id: true });
export type InsertMembershipPlan = z.infer<typeof insertMembershipPlanSchema>;
export type MembershipPlan = typeof membershipPlans.$inferSelect;

export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true });
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

export const insertFreezeRequestSchema = createInsertSchema(freezeRequests).omit({ 
  id: true, 
  requestedAt: true, 
  reviewedAt: true 
});
export type InsertFreezeRequest = z.infer<typeof insertFreezeRequestSchema>;
export type FreezeRequest = typeof freezeRequests.$inferSelect;

export const insertPayrollSchema = createInsertSchema(payroll).omit({ id: true, generatedAt: true });
export type InsertPayroll = z.infer<typeof insertPayrollSchema>;
export type Payroll = typeof payroll.$inferSelect;

export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true });
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

export const insertNotificationSchema = createInsertSchema(notifications).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({ 
  id: true, 
  updatedAt: true 
});
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;

export const insertRbacPermissionSchema = createInsertSchema(rbacPermissions).omit({ id: true });
export type InsertRbacPermission = z.infer<typeof insertRbacPermissionSchema>;
export type RbacPermission = typeof rbacPermissions.$inferSelect;

export const insertFeeAlertSchema = createInsertSchema(feeAlerts).omit({ id: true, createdAt: true, resolvedAt: true });
export type InsertFeeAlert = z.infer<typeof insertFeeAlertSchema>;
export type FeeAlert = typeof feeAlerts.$inferSelect;

export const insertTaskAssignmentSchema = createInsertSchema(taskAssignments).omit({ id: true, createdAt: true, completedAt: true });
export type InsertTaskAssignment = z.infer<typeof insertTaskAssignmentSchema>;
export type TaskAssignment = typeof taskAssignments.$inferSelect;

export const insertLedgerTransactionSchema = createInsertSchema(ledgerTransactions).omit({ id: true, createdAt: true });
export type InsertLedgerTransaction = z.infer<typeof insertLedgerTransactionSchema>;
export type LedgerTransaction = typeof ledgerTransactions.$inferSelect;
