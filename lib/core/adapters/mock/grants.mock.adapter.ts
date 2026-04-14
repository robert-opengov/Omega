import type {
  IGrantsRepository,
  DashboardSummary,
  ComplianceFlag,
  Invoice,
  Deadline,
  Award,
  AwardDetail,
  BudgetSummary,
  BudgetLine,
  Drawdown,
  Expenditure,
  FinSyncEntry,
  Condition,
  ComplianceAlert,
  Report,
  Milestone,
  SubRecipient,
  SubRecipientDetail,
  GrantDocument,
  ActivityItem,
  SubRecipientSpending,
  PaginatedParams,
  PaginatedResult,
} from '@/lib/core/ports/grants.repository';

function paginate<T>(data: T[], params?: PaginatedParams): PaginatedResult<T> {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const start = (page - 1) * pageSize;
  return { data: data.slice(start, start + pageSize), total: data.length, page, pageSize };
}

export class GrantsMockAdapter implements IGrantsRepository {
  async getDashboardSummary(): Promise<DashboardSummary> {
    return {
      fundsUnderManagement: 8_200_000,
      activeGrants: 6,
      spendToDate: 4_100_000,
      spendPercentage: 50,
      reportsDueThisMonth: 4,
      nextReportDueDays: 6,
      openComplianceFlags: 4,
      criticalFlags: 2,
      warningFlags: 2,
    };
  }

  async getComplianceFlags(): Promise<ComplianceFlag[]> {
    return [
      { id: '1', severity: 'Critical', title: 'DOJ COPS Hiring — budget at 91% utilization', description: 'Contractual: $45,500 of $50,000 spent · $4,500 remaining', actionLabel: 'Manage Budget' },
      { id: '2', severity: 'Critical', title: 'HUD Lead Hazard — reimbursement aging 37 days', description: 'Request #4 · $12,300 · No response from HUD since Mar 7...', actionLabel: 'Manage Drawdowns' },
      { id: '3', severity: 'Warning', title: 'CDBG-DR — burn rate below pace...', description: '68% of period elapsed · 29% of $4.2M spent · ~$2.9M at risk...', actionLabel: 'Manage Budget' },
      { id: '4', severity: 'Warning', title: 'CDBG Entitlement — monitoring overdue...', description: 'Habitat for Humanity (High risk) · desk review 47 days overdue..', actionLabel: 'Manage Sub-Recipients' },
    ];
  }

  async getRecentInvoices(): Promise<Invoice[]> {
    return [
      { id: '1', amount: -8400, organization: 'Habitat for Humanity', grantName: 'CDBG Entitlement', date: 'Apr 11', waitingDays: 2, status: 'Under Review' },
      { id: '2', amount: -3200, organization: 'Boys & Girls Club of Riverview', grantName: 'CDBG Entitlement', date: 'Apr 9', waitingDays: 4, status: 'Under Review' },
      { id: '3', amount: -22750, organization: 'Riverview Housing Authority', grantName: 'HOME Investment Partnerships', date: 'Apr 8', waitingDays: 5, status: 'Under Review' },
    ];
  }

  async getUpcomingDeadlines(): Promise<Deadline[]> {
    return [
      { id: '1', month: 'APR', daysRemaining: 6, title: 'HUD Lead Hazard Reduction — SF-425 Q1...', subtitle: 'Due Apr 19 · Submit via HUD Exchange...' },
      { id: '2', month: 'APR', daysRemaining: 8, title: 'DOJ COPS Hiring — progress report Q1...', subtitle: 'Due Apr 21 · Submit via JustGrants...' },
      { id: '3', month: 'APR', daysRemaining: 12, title: 'CDBG Entitlement — SF-425 Q1...', subtitle: 'Due Apr 25 · Submit via IDIS...' },
      { id: '4', month: 'APR', daysRemaining: 34, title: 'ARPA SLFRF — Project & Expenditure Report', subtitle: 'Due May 17 · Submit via Treasury Portal' },
    ];
  }

  async listAwards(params?: PaginatedParams): Promise<PaginatedResult<Award>> {
    const awards: Award[] = [
      { id: '1', name: 'CDBG Entitlement Grant FY2025', agency: 'HUD', fain: 'B-25-MC-06-0001', amount: 1_240_000, utilization: 67, nextReportDueDays: 12, risk: 'Medium', periodEnd: 'Sep 30, 2026', status: 'Active' },
      { id: '2', name: 'ARPA State and Local Fiscal Recovery Fund', agency: 'Treasury', fain: 'SLFRF-0237-IL', amount: 3_800_000, utilization: 82, nextReportDueDays: 34, risk: 'Low', periodEnd: 'Dec 31, 2026', status: 'Active' },
      { id: '3', name: 'EPA Brownfields Assessment Grant', agency: 'EPA', fain: 'BF-00E03421-0', amount: 500_000, utilization: 45, nextReportDueDays: 67, risk: 'Low', periodEnd: 'Aug 31, 2027', status: 'Active' },
      { id: '4', name: 'DOJ COPS Hiring Program FY2024', agency: 'DOJ', fain: '2024-UL-WX-0012', amount: 750_000, utilization: 91, nextReportDueDays: 8, risk: 'Medium', periodEnd: 'Sep 30, 2026', status: 'Active' },
      { id: '5', name: 'FEMA BRIC Pre-Disaster Mitigation', agency: 'FEMA', fain: 'EMS-2024-PC-0089', amount: 620_000, utilization: 38, nextReportDueDays: 51, risk: 'High', periodEnd: 'Sep 30, 2026', status: 'Active' },
      { id: '6', name: 'HOME Investment Partnerships FY2025', agency: 'HUD', fain: 'M-25-MC-06-0204', amount: 890_000, utilization: 74, nextReportDueDays: 22, risk: 'Medium', periodEnd: 'Sep 30, 2026', status: 'Active' },
      { id: '7', name: 'EPA Brownfields Cleanup Revolving Loan', agency: 'EPA', fain: 'BF-00E03422-0', amount: 1_000_000, utilization: 55, nextReportDueDays: 67, risk: 'Low', periodEnd: 'Jun 30, 2027', status: 'Active' },
      { id: '8', name: 'CDBG-DR Hurricane Recovery FY2023', agency: 'FEMA', fain: 'B-23-DF-06-0001', amount: 4_200_000, utilization: 29, nextReportDueDays: 19, risk: 'Low', periodEnd: 'Sep 30, 2026', status: 'Active' },
    ];
    return paginate(awards, params);
  }

  async getLastViewedAwards(): Promise<Award[]> {
    const all = await this.listAwards({ pageSize: 4 });
    return all.data.slice(0, 4);
  }

  async getAward(id: string): Promise<AwardDetail> {
    return {
      id,
      name: 'Community Development Block Grant (CDBG)',
      agency: 'HUD',
      fain: 'B-21-MC-06-0001',
      amount: 847_500,
      utilization: 46,
      nextReportDueDays: 24,
      risk: 'High',
      periodEnd: 'Sep 30, 2026',
      status: 'Active',
      cfda: 'CFDA / ALN Number 14.218',
      performancePeriod: 'Oct 1, 2024 – Sept 30, 2026',
      periodStart: 'Oct 1, 2024',
    };
  }

  async getBudgetSummary(_awardId: string): Promise<BudgetSummary> {
    return {
      totalAward: 847_500,
      expended: 387_250,
      remaining: 460_250,
      expendedPercentage: 46,
      remainingPercentage: 54,
      periodElapsedPercentage: 38,
      daysRemaining: 543,
      periodStart: 'Oct 1, 2024',
      periodEnd: 'Sep 30, 2026',
      utilizedPercentage: 46,
    };
  }

  async getBudgetVsActual(_awardId: string, params?: PaginatedParams): Promise<PaginatedResult<BudgetLine>> {
    const lines: BudgetLine[] = [
      { id: '1', category: 'Personnel', budgeted: 195_000, expended: 195_000, encumbered: 195_000, remaining: 195_000 },
      { id: '2', category: 'Fringe Benefits', budgeted: 195_000, expended: 195_000, encumbered: 195_000, remaining: 195_000 },
      { id: '3', category: 'Contractual', budgeted: 195_000, expended: 195_000, encumbered: 195_000, remaining: 195_000 },
      { id: '4', category: 'Supplies', budgeted: 195_000, expended: 195_000, encumbered: 195_000, remaining: 195_000 },
      { id: '5', category: 'Travel', budgeted: 195_000, expended: 195_000, encumbered: 195_000, remaining: 195_000 },
    ];
    return paginate(lines, params);
  }

  async getDrawdowns(_awardId: string, params?: PaginatedParams): Promise<PaginatedResult<Drawdown>> {
    const drawdowns: Drawdown[] = [
      { id: '1', ref: 'DR-001', date: 'Nov 4, 2025', amount: 195_000, method: 'ASAP', status: 'Paid' },
      { id: '2', ref: 'DR-001', date: 'Nov 4, 2025', amount: 195_000, method: 'Manual', status: 'Paid' },
      { id: '3', ref: 'DR-001', date: 'Nov 4, 2025', amount: 195_000, method: 'ASAP', status: 'Paid' },
      { id: '4', ref: 'DR-001', date: 'Nov 4, 2025', amount: 195_000, method: 'ASAP', status: 'Paid' },
      { id: '5', ref: 'DR-001', date: 'Nov 4, 2025', amount: 195_000, method: 'Manual', status: 'Paid' },
    ];
    return paginate(drawdowns, params);
  }

  async getExpenditures(_awardId: string, params?: PaginatedParams): Promise<PaginatedResult<Expenditure>> {
    const items: Expenditure[] = [
      { id: '1', date: 'Mar 8, 2025', vendor: 'ABC Construction – Invoice #1847', amount: 195_000, category: 'Personnel', source: 'FIN' },
      { id: '2', date: 'Mar 8, 2025', vendor: 'ABC Construction – Invoice #1847', amount: 195_000, category: 'Travel', source: 'Manual' },
      { id: '3', date: 'Mar 8, 2025', vendor: 'ABC Construction – Invoice #1847', amount: 195_000, category: 'Fringe Benefits', source: 'FIN' },
      { id: '4', date: 'Mar 8, 2025', vendor: 'ABC Construction – Invoice #1847', amount: 195_000, category: 'Needs Assignment', source: 'FIN' },
      { id: '5', date: 'Mar 8, 2025', vendor: 'ABC Construction – Invoice #1847', amount: 195_000, category: 'Contractual', source: 'FIN' },
    ];
    return paginate(items, params);
  }

  async getFinSyncLog(_awardId: string, params?: PaginatedParams): Promise<PaginatedResult<FinSyncEntry>> {
    const entries: FinSyncEntry[] = [
      { id: '1', timestamp: 'Mar 8, 2025', transaction: 'ABC Construction – Invoice #1847', amount: 195_000, category: 'Personnel', source: 'Synced' },
      { id: '2', timestamp: 'Mar 8, 2025', transaction: 'ABC Construction – Invoice #1847', amount: 195_000, category: 'Travel', source: 'Under Review' },
      { id: '3', timestamp: 'Mar 8, 2025', transaction: 'ABC Construction – Invoice #1847', amount: 195_000, category: 'Fringe Benefits', source: 'Synced' },
      { id: '4', timestamp: 'Mar 8, 2025', transaction: 'ABC Construction – Invoice #1847', amount: 195_000, category: 'Needs Assignment', source: 'Under Review' },
      { id: '5', timestamp: 'Mar 8, 2025', transaction: 'ABC Construction – Invoice #1847', amount: 195_000, category: 'Contractual', source: 'Synced' },
    ];
    return paginate(entries, params);
  }

  async getConditions(_awardId: string): Promise<Condition[]> {
    return [
      { id: '1', title: 'Environmental Review (24 CFR Part 58)', subtitle: 'CDBG Template: Due before committing funds', status: 'Met', evidence: [{ label: 'RROF submitted 02/14/2026', href: '#' }], notes: 'Covered all FY26 activities under single Tiered Review.' },
      { id: '2', title: 'Section 3 Plan (Economic Opportunities)', subtitle: 'CDBG Template: Due before procurement > $200k', status: 'In Progress' },
      { id: '3', title: 'Citizen Participation Plan', subtitle: 'CDBG Template: Due annual', status: 'Met' },
      { id: '4', title: 'Davis-Bacon Wage Rates', subtitle: 'CDBG Template: Due ongoing (construction > $2k)', status: 'N/A' },
      { id: '5', title: 'Fair Housing Certification', subtitle: 'Award-specific: Due Dec 31, 2025', status: 'Met' },
    ];
  }

  async getComplianceAlerts(_awardId: string): Promise<ComplianceAlert[]> {
    return [
      { id: '1', title: 'Consulting Contract – Apex Group...', description: 'Coded to Supplies but description matches Contractual', icon: 'ai', highlighted: true },
      { id: '2', title: 'Drawdown #5 pending 37 days', description: '$12,300 submitted Oct 5 – no status update from HUD.', icon: 'pending' },
      { id: '3', title: 'Drawdown #5 pending 37 days', description: '$12,300 submitted Oct 5 – no status update from HUD.', icon: 'pending' },
      { id: '4', title: 'Drawdown #5 pending 37 days', description: '$12,300 submitted Oct 5 – no status update from HUD.', icon: 'pending' },
    ];
  }

  async getReports(_awardId: string): Promise<Report[]> {
    return [
      { id: '1', title: 'SF-425 Federal Financial Report', dueDate: 'Apr 30, 2026', status: 'Draft', group: 'now' },
      { id: '2', title: 'SF-425 Federal Financial Report', dueDate: 'Apr 30, 2026', status: 'Draft', group: 'now' },
      { id: '3', title: 'SF-425 Federal Financial Report', dueDate: 'Apr 30, 2026', status: 'Not Started', group: 'next' },
      { id: '4', title: 'SF-425 Federal Financial Report', dueDate: 'Apr 30, 2026', status: 'Not Started', group: 'next' },
    ];
  }

  async getMilestones(_awardId: string): Promise<Milestone[]> {
    return [
      { id: '1', date: 'Jan 8', title: 'Completed Phase 2 environmental assessment for all FY26 properties.', completed: true },
      { id: '2', date: 'Jan 16', title: 'Hire project coordinator Carlos Mendez – position vacant since March.', assignee: { name: 'Carlos Mendez' } },
      { id: '3', date: 'Feb 2', title: 'Fair Housing Council outreached – 200 households.' },
    ];
  }

  async getSubRecipients(_awardId: string, params?: PaginatedParams): Promise<PaginatedResult<SubRecipient>> {
    const subs: SubRecipient[] = [
      { id: '1', organization: 'Habitat for Humanity – Riverview', ein: '95-1234567', risk: 'High', nextMonitoringDue: 'Mar 8, 2025', isOverdue: true, utilization: 62, expendedAmount: 112_000, totalAmount: 180_000, invoiceStatus: 'No Invoice' },
      { id: '2', organization: 'Riverview Community Action', ein: '94-7654321', risk: 'Medium', nextMonitoringDue: 'Apr 30, 2026', utilization: 43, expendedAmount: 28_500, totalAmount: 65_000, invoiceStatus: 'Approved' },
      { id: '3', organization: 'Fair Housing Council', ein: '33-9876543', risk: 'Low', nextMonitoringDue: 'July 30, 2026', utilization: 38, expendedAmount: 15_000, totalAmount: 40_000, invoiceStatus: 'Under Review' },
    ];
    return paginate(subs, params);
  }

  async getSubRecipientDetail(_awardId: string, _subId: string): Promise<SubRecipientDetail> {
    return {
      id: '1',
      organization: 'Habitat for Humanity – Riverview',
      ein: '95-1234567',
      budgetSummary: {
        totalAward: 847_500,
        expended: 112_000,
        remaining: 68_000,
        expendedPercentage: 62,
        remainingPercentage: 38,
        periodElapsedPercentage: 38,
        daysRemaining: 543,
        periodStart: 'Oct 1, 2024',
        periodEnd: 'Sep 30, 2026',
        utilizedPercentage: 46,
      },
      invoices: [
        { id: '1', amount: 12_000, organization: 'Mar 15, 2026', grantName: '', date: 'Mar 15, 2026', waitingDays: 0, status: 'Rejected' },
        { id: '2', amount: 12_000, organization: 'Mar 15, 2026', grantName: '', date: 'Mar 15, 2026', waitingDays: 0, status: 'Under Review' },
        { id: '3', amount: 12_000, organization: 'Mar 15, 2026', grantName: '', date: 'Mar 15, 2026', waitingDays: 0, status: 'Approved' },
      ],
    };
  }

  async getSubRecipientSpending(_awardId: string): Promise<SubRecipientSpending[]> {
    return [
      { name: 'Sub-recipient 1', percentage: 50 },
      { name: 'Sub-recipient 2', percentage: 50 },
      { name: 'Sub-recipient 3', percentage: 50 },
      { name: 'Sub-recipient 4', percentage: 13, warning: true },
      { name: 'Sub-recipient 5', percentage: 50 },
      { name: 'Sub-recipient 6', percentage: 50 },
      { name: 'Sub-recipient 7', percentage: 50 },
    ];
  }

  async getDocuments(_awardId: string, params?: PaginatedParams): Promise<PaginatedResult<GrantDocument>> {
    const docs: GrantDocument[] = [
      { id: '1', fileName: 'Notice of Award – CDBG FY2025.pdf', fileUrl: '#', type: 'Award Agreement', uploadDate: 'Oct 1, 2024', uploadedBy: { name: 'Maria Chen' } },
      { id: '2', fileName: 'Notice of Award – CDBG FY2025.pdf', fileUrl: '#', type: 'Approved Budget', uploadDate: 'Oct 1, 2024', uploadedBy: { name: 'Maria Chen' } },
      { id: '3', fileName: 'Notice of Award – CDBG FY2025.pdf', fileUrl: '#', type: 'Certification', uploadDate: 'Oct 1, 2024', uploadedBy: { name: 'Maria Chen' } },
      { id: '4', fileName: 'Notice of Award – CDBG FY2025.pdf', fileUrl: '#', type: 'Submitted Report', uploadDate: 'Oct 1, 2024', uploadedBy: { name: 'Maria Chen' } },
      { id: '5', fileName: 'Notice of Award – CDBG FY2025.pdf', fileUrl: '#', type: 'Submitted Report', uploadDate: 'Oct 1, 2024', uploadedBy: { name: 'Maria Chen' } },
    ];
    return paginate(docs, params);
  }

  async getRecentActivity(_awardId: string): Promise<ActivityItem[]> {
    return [
      { id: '1', amount: '-$10,416.16', amountType: 'debit', source: 'System (FIN Sync)', description: 'City Payroll – March 2026', category: 'Personnel', categoryVariant: 'primary', timestamp: '10/24/26' },
      { id: '2', amount: '+$5,000.00', amountType: 'credit', source: 'Drawdown Processed', description: 'Lorem ipsum – March 2026', category: 'Lorem', categoryVariant: 'info', timestamp: '10/24/26' },
      { id: '3', amount: '-$10,416.16', amountType: 'debit', source: 'System (FIN Sync)', description: 'City Payroll – March 2026', category: 'Travel', categoryVariant: 'warning', timestamp: '10/24/26' },
      { id: '4', amount: '-$10,416.16', amountType: 'debit', source: 'System (FIN Sync)', description: 'City Payroll – March 2026', category: 'Fringe Benefits', categoryVariant: 'success', timestamp: '10/24/26' },
      { id: '5', amount: '-$10,416.16', amountType: 'debit', source: 'System (FIN Sync)', description: 'City Payroll – March 2026', category: 'Needs Assignment', categoryVariant: 'warning', timestamp: '10/24/26' },
    ];
  }
}
