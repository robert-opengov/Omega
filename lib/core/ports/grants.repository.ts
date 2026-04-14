/**
 * Grants Management domain types and repository interface.
 *
 * This port defines the contract for all grant-related data operations.
 * Adapters implement this interface against specific backends (GAB v1, mock, etc.).
 */

// ---------------------------------------------------------------------------
// Shared pagination
// ---------------------------------------------------------------------------

export interface PaginatedParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export type RiskLevel = 'High' | 'Medium' | 'Low';
export type GrantStatus = 'Active' | 'Closed' | 'Pending';
export type ComplianceSeverity = 'Critical' | 'Warning';
export type ConditionStatus = 'Met' | 'In Progress' | 'N/A' | 'Not Met';
export type DrawdownMethod = 'ASAP' | 'Manual';
export type DrawdownStatus = 'Paid' | 'Pending' | 'Rejected';
export type InvoiceStatus = 'Approved' | 'Under Review' | 'Rejected' | 'No Invoice';
export type ReportStatus = 'Draft' | 'Not Started' | 'In Progress' | 'Submitted';
export type SyncSource = 'FIN' | 'Manual' | 'Synced' | 'Under Review';

export interface DashboardSummary {
  fundsUnderManagement: number;
  activeGrants: number;
  spendToDate: number;
  spendPercentage: number;
  reportsDueThisMonth: number;
  nextReportDueDays: number;
  openComplianceFlags: number;
  criticalFlags: number;
  warningFlags: number;
}

export interface ComplianceFlag {
  id: string;
  severity: ComplianceSeverity;
  title: string;
  description: string;
  actionLabel: string;
  actionHref?: string;
}

export interface Invoice {
  id: string;
  amount: number;
  organization: string;
  grantName: string;
  date: string;
  waitingDays: number;
  status: InvoiceStatus;
}

export interface Deadline {
  id: string;
  month: string;
  daysRemaining: number;
  title: string;
  subtitle: string;
}

export interface Award {
  id: string;
  name: string;
  agency: string;
  fain: string;
  amount: number;
  utilization: number;
  nextReportDueDays: number;
  risk: RiskLevel;
  periodEnd: string;
  status: GrantStatus;
}

export interface AwardDetail extends Award {
  cfda: string;
  performancePeriod: string;
  periodStart: string;
}

export interface BudgetSummary {
  totalAward: number;
  expended: number;
  remaining: number;
  expendedPercentage: number;
  remainingPercentage: number;
  periodElapsedPercentage: number;
  daysRemaining: number;
  periodStart: string;
  periodEnd: string;
  utilizedPercentage: number;
}

export interface BudgetLine {
  id: string;
  category: string;
  budgeted: number;
  expended: number;
  encumbered: number;
  remaining: number;
}

export interface Drawdown {
  id: string;
  ref: string;
  date: string;
  amount: number;
  method: DrawdownMethod;
  status: DrawdownStatus;
}

export interface Expenditure {
  id: string;
  date: string;
  vendor: string;
  amount: number;
  category: string;
  source: SyncSource;
}

export interface FinSyncEntry {
  id: string;
  timestamp: string;
  transaction: string;
  amount: number;
  category: string;
  source: SyncSource;
}

export interface Condition {
  id: string;
  title: string;
  subtitle: string;
  status: ConditionStatus;
  evidence?: Array<{ label: string; href: string }>;
  notes?: string;
}

export interface ComplianceAlert {
  id: string;
  title: string;
  description: string;
  icon: 'ai' | 'pending' | 'warning';
  highlighted?: boolean;
}

export interface Report {
  id: string;
  title: string;
  dueDate: string;
  status: ReportStatus;
  group: 'now' | 'next';
}

export interface Milestone {
  id: string;
  date: string;
  title: string;
  completed?: boolean;
  assignee?: { name: string; avatar?: string };
}

export interface SubRecipient {
  id: string;
  organization: string;
  ein?: string;
  avatarUrl?: string;
  risk: RiskLevel;
  nextMonitoringDue: string;
  isOverdue?: boolean;
  utilization: number;
  expendedAmount: number;
  totalAmount: number;
  invoiceStatus: InvoiceStatus;
}

export interface SubRecipientDetail {
  id: string;
  organization: string;
  ein: string;
  budgetSummary: BudgetSummary;
  invoices: Invoice[];
}

export interface GrantDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  type: string;
  uploadDate: string;
  uploadedBy: { name: string; avatar?: string };
}

export interface ActivityItem {
  id: string;
  amount: string;
  amountType: 'debit' | 'credit';
  source: string;
  description: string;
  category?: string;
  categoryVariant?: 'success' | 'warning' | 'danger' | 'info' | 'primary';
  timestamp: string;
}

export interface SubRecipientSpending {
  name: string;
  percentage: number;
  warning?: boolean;
}

// ---------------------------------------------------------------------------
// Repository interface
// ---------------------------------------------------------------------------

export interface IGrantsRepository {
  // Dashboard
  getDashboardSummary(): Promise<DashboardSummary>;
  getComplianceFlags(): Promise<ComplianceFlag[]>;
  getRecentInvoices(): Promise<Invoice[]>;
  getUpcomingDeadlines(): Promise<Deadline[]>;

  // Awards
  listAwards(params?: PaginatedParams): Promise<PaginatedResult<Award>>;
  getAward(id: string): Promise<AwardDetail>;
  getLastViewedAwards(): Promise<Award[]>;

  // Budget
  getBudgetSummary(awardId: string): Promise<BudgetSummary>;
  getBudgetVsActual(awardId: string, params?: PaginatedParams): Promise<PaginatedResult<BudgetLine>>;
  getDrawdowns(awardId: string, params?: PaginatedParams): Promise<PaginatedResult<Drawdown>>;
  getExpenditures(awardId: string, params?: PaginatedParams): Promise<PaginatedResult<Expenditure>>;
  getFinSyncLog(awardId: string, params?: PaginatedParams): Promise<PaginatedResult<FinSyncEntry>>;

  // Compliance
  getConditions(awardId: string): Promise<Condition[]>;
  getComplianceAlerts(awardId: string): Promise<ComplianceAlert[]>;

  // Reports
  getReports(awardId: string): Promise<Report[]>;
  getMilestones(awardId: string): Promise<Milestone[]>;

  // Sub-Recipients
  getSubRecipients(awardId: string, params?: PaginatedParams): Promise<PaginatedResult<SubRecipient>>;
  getSubRecipientDetail(awardId: string, subId: string): Promise<SubRecipientDetail>;
  getSubRecipientSpending(awardId: string): Promise<SubRecipientSpending[]>;

  // Documents
  getDocuments(awardId: string, params?: PaginatedParams): Promise<PaginatedResult<GrantDocument>>;

  // Activity
  getRecentActivity(awardId: string): Promise<ActivityItem[]>;
}
