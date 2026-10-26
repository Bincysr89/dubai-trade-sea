/* Mock data for the Duty Account (Manage Accounts) module — values follow the
   Dubai Customs account screens the module was modelled on. */

export type AccountStatus = 'Active' | 'Inactive';

export const ACCOUNT_TYPES = ['Standing Guarantee Account', 'Credit Account (CDR)', 'Debit Account'];
export const ACCOUNT_CATEGORIES = ['Standard'];
export const ACCOUNT_STATUSES: AccountStatus[] = ['Active', 'Inactive'];

export type Guarantee = {
  type: 'BANK' | 'CASH';
  refNo: string;
  amount: string;
  bank?: string;
  status: 'Active' | 'Inactive';
};

export type AccountUser = { type: string; code: string; name: string; userType: string };

export type Account = {
  accountNo: string;
  accountName: string;
  accountType: string;
  accountCategory: string;
  holder: string;          // e.g. I-21358
  holderType: string;      // e.g. Importer
  holderCode: string;      // e.g. 21358
  businessCode: string;
  totalGuarantee: string;
  usedGuarantee: string;
  availableBalance: string;
  status: AccountStatus;
  remarks: string;
  contact: {
    person: string;
    designation: string;
    mobile: string;
    phone: string;
    phone2: string;
    phone3: string;
    email: string;
    email2: string;
    email3: string;
    country: string;
    emirate: string;
    poBox: string;
    address: string;
  };
  guarantees: Guarantee[];
  virtualAccount: { bank: string; accountNo: string; iban: string };
  users: AccountUser[];
};

/* ── Requests ── */

export type RequestStatus =
  | 'Under Processing' | 'Completed' | 'Payment Completed' | 'Payment Pending'
  | 'Rejected' | 'Suspended' | 'Submitted' | 'Withdrawn';

/** Order matches the Request Status dropdown. */
export const REQUEST_STATUSES: RequestStatus[] = [
  'Under Processing', 'Completed', 'Payment Completed', 'Payment Pending', 'Rejected', 'Suspended', 'Submitted', 'Withdrawn',
];

export const REQUEST_TYPES = [
  'New Account', 'Modify Account Contact', 'Manage Account User',
  'New Guarantee', 'Update Guarantee', 'Reduce Guarantee', 'Withdraw Guarantee',
];

/** Statuses a request can still be withdrawn from. */
export const WITHDRAWABLE: RequestStatus[] = ['Under Processing', 'Submitted', 'Payment Pending', 'Suspended'];

export type RequestGuarantee = {
  type: 'Bank' | 'Cash';
  refNo: string;
  existing: string;
  proposed: string;
  refundMode?: string;
};

export type Receipt = {
  receiptNo: string;
  receiptDate: string;
  receiptType: string;
  amount: string;
  paymentMode: string;
  transactionNo: string;
  transactionDate: string;
  ePayTxnNo: string;
};

export type AuditEntry = { date: string; action: string; status: RequestStatus; by: string; remarks: string };

export type AccountRequest = {
  requestNo: string;
  requestType: string;
  accountNo: string;
  accountName: string;
  accountType: string;
  status: RequestStatus;
  statusRemarks: string;
  requestDate: string;     // DD-MM-YYYY
  requestedBy: string;
  guarantee?: RequestGuarantee;
  receipt?: Receipt;
  history: AuditEntry[];
};

/* ── Accounts ── */

const OWNER: AccountUser = { type: 'Importer', code: '21358', name: 'AEOUAT1', userType: 'Owner' };

const BASE_CONTACT: Account['contact'] = {
  person: 'SANDEEP test a',
  designation: 'TEST again a',
  mobile: '971-56-8904541',
  phone: '971-4-4444444',
  phone2: '',
  phone3: '',
  email: 'infogain.sandeepk@dubaicustoms.ae',
  email2: '',
  email3: '',
  country: 'UNITED ARAB EMIRATES',
  emirate: 'DUBAI',
  poBox: '56',
  address: 'fdsgfd',
};

function account(
  accountType: string,
  accountNo: string,
  totalGuarantee: string,
  usedGuarantee: string,
  availableBalance: string,
  status: AccountStatus,
  guarantees: Guarantee[],
  remarks = '',
): Account {
  return {
    accountNo,
    accountName: 'AEOUAT1',
    accountType,
    accountCategory: 'Standard',
    holder: 'I-21358',
    holderType: 'Importer',
    holderCode: '21358',
    businessCode: 'AE-1050879',
    totalGuarantee,
    usedGuarantee,
    availableBalance,
    status,
    remarks,
    contact: { ...BASE_CONTACT },
    guarantees,
    virtualAccount: { bank: 'DUBAI ISLAMIC BANK', accountNo: `1234567890${accountNo.slice(-5)}`, iban: `AE0000001234567890${accountNo.slice(-5)}` },
    users: [OWNER],
  };
}

const CDR = 'Credit Account (CDR)';
const SGA = 'Standing Guarantee Account';

export const ACCOUNTS: Account[] = [
  account(CDR, '222683', '9,999,999,999.00', '6,464.00', '9,999,993,535.00', 'Inactive',
    [{ type: 'BANK', refNo: '5436546', amount: '9,999,999,999.00', bank: 'ABN AMRO BANK, ABUDHABI', status: 'Active' }]),
  account(CDR, '222685', '985,000,000.00', '6,489.00', '984,993,511.00', 'Inactive',
    [{ type: 'BANK', refNo: '5436601', amount: '985,000,000.00', bank: 'ARAB BANK PLC, DEIRA', status: 'Active' }], 'TEST'),
  account(CDR, '222839', '8,569,791,119.00', '-16,063.00', '8,569,807,182.00', 'Inactive',
    [{ type: 'BANK', refNo: '5437012', amount: '8,569,791,119.00', bank: 'BANK OF BARODA, DUBAI', status: 'Active' }]),
  account(CDR, '222840', '8,956,829,999.00', '-10,413.00', '8,956,840,412.00', 'Inactive',
    [{ type: 'BANK', refNo: '5437108', amount: '8,956,829,999.00', bank: 'UNION NATIONAL BANK, DUBAI', status: 'Active' }]),
  account(CDR, '222843', '896,625,078.00', '-13,540.00', '896,638,618.00', 'Active', [
    { type: 'BANK', refNo: '234239', amount: '896,570,078.00', bank: 'ABN AMRO BANK, DUBAI', status: 'Active' },
    { type: 'CASH', refNo: 'Z12932', amount: '25,000.00', status: 'Active' },
    { type: 'CASH', refNo: 'Z13056', amount: '30,000.00', status: 'Active' },
  ]),
  account(SGA, '334012', '40,000.00', '0.00', '40,000.00', 'Active',
    [{ type: 'BANK', refNo: '5440012', amount: '40,000.00', bank: 'ABUDHABI ISLAMIC BANK, ABUDHABI', status: 'Active' }]),
  account(SGA, '334013', '45,000.00', '1,612.00', '43,388.00', 'Active',
    [{ type: 'CASH', refNo: 'Z13300', amount: '45,000.00', status: 'Active' }], 'SID test'),
  account(SGA, '334014', '0.00', '0.00', '0.00', 'Inactive', []),
  account(SGA, '334084', '0.00', '0.00', '0.00', 'Inactive', [], 'xxxx'),
  account(SGA, '334094', '438,000.00', '0.00', '438,000.00', 'Active',
    [{ type: 'BANK', refNo: '5440094', amount: '438,000.00', bank: 'ARAB AFRICAN INTL BANK, DUBAI', status: 'Active' }], 'TEST'),
  account('Debit Account', '60351', '0.00', '0.00', '10.01', 'Active', [], '852'),
];

export function findAccount(accountNo: string): Account | undefined {
  return ACCOUNTS.find(a => a.accountNo === accountNo);
}

/* ── Seed requests ── */

const BY = 'aeouat1';

function req(
  requestNo: string, requestType: string, accountNo: string, status: RequestStatus, requestDate: string,
  extra: Partial<AccountRequest> = {},
): AccountRequest {
  const a = findAccount(accountNo)!;
  const created: AuditEntry = { date: `${requestDate} 09:15`, action: 'Request Created', status: 'Submitted', by: BY, remarks: '—' };
  const history: AuditEntry[] = [created];
  if (status !== 'Submitted') {
    history.push({ date: `${requestDate} 11:40`, action: status === 'Withdrawn' ? 'Request Withdrawn' : 'Status Updated', status, by: status === 'Withdrawn' ? BY : 'Dubai Customs', remarks: extra.statusRemarks || '—' });
  }
  return {
    requestNo, requestType, accountNo, accountName: a.accountName, accountType: a.accountType,
    status, statusRemarks: '', requestDate, requestedBy: BY, history, ...extra,
  };
}

export const INITIAL_REQUESTS: AccountRequest[] = [
  req('56840', 'Reduce Guarantee', '222843', 'Under Processing', '26-10-2026',
    { guarantee: { type: 'Cash', refNo: 'Z13056', existing: '30,000.00', proposed: '20,000.00', refundMode: 'Bank Account Transfer' } }),
  req('56839', 'New Guarantee', '222843', 'Completed', '26-10-2026', {
    statusRemarks: 'Payment Completed.',
    guarantee: { type: 'Cash', refNo: 'Z13413', existing: '0.00', proposed: '25,000.00' },
    receipt: {
      receiptNo: 'Z-13413', receiptDate: '26-10-2026 00:00:00', receiptType: 'Credit Account Cash Guarantee Top Up', amount: '25,000.00',
      paymentMode: 'Credit Card', transactionNo: '590000238362037', transactionDate: '26-10-2026 00:00:00', ePayTxnNo: '20023216',
    },
  }),
  req('56838', 'Withdraw Guarantee', '222843', 'Under Processing', '26-10-2026',
    { guarantee: { type: 'Bank', refNo: '234239', existing: '896,570,078.00', proposed: '0.00' } }),
  req('56837', 'Reduce Guarantee', '222843', 'Under Processing', '26-10-2026',
    { guarantee: { type: 'Cash', refNo: 'Z12932', existing: '25,000.00', proposed: '20,000.00', refundMode: 'Cheque' } }),
  req('56836', 'New Guarantee', '222843', 'Under Processing', '26-10-2026',
    { guarantee: { type: 'Bank', refNo: 'bAnk76567567', existing: '0.00', proposed: '10,000.00' } }),
  req('56833', 'New Guarantee', '334084', 'Payment Completed', '24-10-2026', {
    statusRemarks: 'Payment received, pending approval.',
    guarantee: { type: 'Cash', refNo: 'Z13390', existing: '0.00', proposed: '12,000.00' },
    receipt: {
      receiptNo: 'Z-13390', receiptDate: '24-10-2026 00:00:00', receiptType: 'Standing Guarantee Account Cash Guarantee Top Up', amount: '12,000.00',
      paymentMode: 'Credit Card', transactionNo: '590000238360114', transactionDate: '24-10-2026 00:00:00', ePayTxnNo: '20023108',
    },
  }),
  req('56832', 'Withdraw Guarantee', '334012', 'Withdrawn', '23-10-2026',
    { statusRemarks: 'Raised by mistake', guarantee: { type: 'Bank', refNo: '5440012', existing: '40,000.00', proposed: '0.00' } }),
  req('56830', 'New Account', '334094', 'Submitted', '22-10-2026'),
  req('56827', 'New Guarantee', '334013', 'Payment Pending', '20-10-2026',
    { guarantee: { type: 'Cash', refNo: '', existing: '0.00', proposed: '15,000.00' } }),
  req('56824', 'Update Guarantee', '222683', 'Rejected', '18-10-2026', {
    statusRemarks: 'Amendment copy is not attested by the bank.',
    guarantee: { type: 'Bank', refNo: '5436546', existing: '9,999,999,999.00', proposed: '9,500,000,000.00' },
  }),
  req('56812', 'Manage Account User', '222843', 'Suspended', '14-10-2026', { statusRemarks: 'Trade license copy is not legible.' }),
  req('56801', 'Modify Account Contact', '222683', 'Completed', '12-10-2026', { statusRemarks: 'Contact details updated.' }),
];

export const ACCOUNT_HOLDER_TYPES = [
  'Clearing Agent', 'Freezone Licencee', 'Cargo Handler', 'Importer', 'Shipping Agent', 'Vessel Management',
];

/* Account holder codes the "Account Holder Code" lookup resolves to a name. */
export const HOLDER_LOOKUP: Record<string, string> = {
  '50124': 'U1REDHATIMP',
  '50310': 'GULF STAR TRADING LLC',
  '41877': 'AL MANARA CLEARING',
  '33021': 'SEA BRIDGE SHIPPING',
};

export const GUARANTEE_TYPES = ['Bank', 'Cash (e-Payment Only)'];

export const BANKS = [
  'ALAHLI BANK OF KUWAIT, DEIRA',
  'ABN AMRO BANK, DUBAI',
  'ABN AMRO BANK, SHARJAH',
  'ABUDHABI ISLAMIC BANK, ABUDHABI',
  'ARAB AFRICAN INTL BANK, DEIRA',
  'ARAB AFRICAN INTL BANK, DUBAI',
  'ARAB BANK FOR INV & FOR TRADE, DXB',
  'ARAB BANK PLC, ABUDHABI',
  'ARAB BANK PLC, DEIRA',
  'ARAB BANK PLC, SHARJAH',
  'BLOM BANK FRANCE, DEIRA',
  'BANK MELLI IRAN, MAIN BR. DEIRA',
  'BANK MELLI IRAN, DUBAI',
  'BANK MELLI IRAN, FUJAIRAH',
  'BANK OF BARODA, DUBAI',
  'BANK OF BARODA, DEIRA',
  'UNION NATIONAL BANK, DEIRA',
  'UNION NATIONAL BANK, MAKTOM',
  'UNION NATIONAL BANK, DUBAI',
];

export const REFUND_MODES = ['Bank Account Transfer', 'Cheque'];

/* Bank accounts registered for refunds ("Bank Account No." dropdown). */
export const REFUND_BANK_ACCOUNTS = [
  'AE111111111111111111147 - ABN AMRO BANK, ABUDHABI',
  'AE333333333333333312377 - ABUDHABI COMMERCIAL BANK, AJMAN',
  'AE000000000000010102334 - ABUDHABI COMMERCIAL BANK, AL RIGGAH',
  'AE000000000000000123123 - ABN AMRO BANK, ABUDHABI',
];

let nextRequestNo = 56841;
/** Sequential request numbers, continuing from the last one in the seed data. */
export function newRequestNo(): string {
  return String(nextRequestNo++);
}

let nextBatchNo = 10934;
export function newBatchNo(): string {
  return String(nextBatchNo++);
}

let nextReceipt = 13414;
/** A paid e-Payment receipt for a cash guarantee top-up. The receipt number doubles as the guarantee ref. */
export function newReceipt(account: Account, amount: string): Receipt {
  const n = nextReceipt++;
  const stamp = `${todayLabel()} 00:00:00`;
  return {
    receiptNo: `Z-${n}`,
    receiptDate: stamp,
    receiptType: `${account.accountType.replace(/ \(CDR\)$/, '')} Cash Guarantee Top Up`,
    amount,
    paymentMode: 'Credit Card',
    transactionNo: `5900002383${String(62037 + n - 13413).padStart(5, '0')}`,
    transactionDate: stamp,
    ePayTxnNo: String(20023216 + n - 13413),
  };
}

/** "1,234.50" → 1234.5 */
export function parseAmount(v: string): number {
  return Number(v.replace(/,/g, '')) || 0;
}

/** 1234.5 → "1,234.50" */
export function formatAmount(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function holderLabel(a: Account): string {
  return `${a.holderType} ${a.holderCode} ${a.accountName}`;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Today as DD-MM-YYYY (the date format used across the request screens). */
export function todayLabel(): string {
  const d = new Date();
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

/** Now as DD-MM-YYYY HH:mm, for audit entries. */
export function nowLabel(): string {
  const d = new Date();
  return `${todayLabel()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** DD-MM-YYYY → YYYY-MM-DD so request dates compare with date-picker values. */
export function toIso(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split('-');
  return `${y}-${m}-${d}`;
}
