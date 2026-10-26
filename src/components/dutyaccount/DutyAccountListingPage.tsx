import React, { useEffect, useMemo, useRef, useState } from 'react';
import Header from '../Header';
import Pagination from '../Pagination';
import { ColumnFilter } from '../ColumnFilter';
import StatusFilterHeader from '../StatusFilterHeader';
import ManageColumnsModal from '../ManageColumnsModal';
import RowFlyout, { anchorFrom, type FlyoutAnchor, type FlyoutItem } from '../declaration/RowFlyout';
import { DateInput, StatusAsOnBadge } from '../DatePicker';
import { useTableBehaviors, DragDots, ScrollArrows } from '../../hooks/useTableBehaviors';
import { Amount, StatusChip, STATUS_COLOR, ThreeDotsButton, menuIcons, font } from './DutyAccountUI';
import {
  ACCOUNT_CATEGORIES, ACCOUNT_STATUSES, ACCOUNT_TYPES, REQUEST_STATUSES, REQUEST_TYPES, WITHDRAWABLE, toIso,
  type Account, type AccountRequest,
} from './dutyAccountData';

export type AccountAction = 'view' | 'contact' | 'users' | 'manageGuarantee';
export type ListingTab = 'accounts' | 'requests';

// Built on use, not at module load: DutyAccountUI → Header → … → this file is an import
// cycle, so `menuIcons` may not be initialised yet when this module first evaluates.
const accountMenu = (): (FlyoutItem & { action: AccountAction })[] => [
  { label: 'View Account Details',    icon: menuIcons.view,      action: 'view' },
  { label: 'Manage Contact Details',  icon: menuIcons.contact,   action: 'contact' },
  { label: 'Manage Account User',     icon: menuIcons.users,     action: 'users' },
  { label: 'Manage Guarantee',        icon: menuIcons.manage,    action: 'manageGuarantee' },
];
const ACCOUNT_MENU_SIZE = 4;

export type RequestAction = 'details' | 'audit' | 'withdraw' | 'pay' | 'receipt';

/** Request row menu — what is offered depends on the request's status. */
const requestMenu = (r: AccountRequest): (FlyoutItem & { action: RequestAction })[] => [
  { label: 'Request Details', icon: menuIcons.view, action: 'details' },
  ...(r.status === 'Payment Pending' ? [{ label: 'Make Payment', icon: menuIcons.pay, action: 'pay' as const }] : []),
  ...(r.receipt ? [{ label: 'Print Receipt', icon: menuIcons.print, action: 'receipt' as const }] : []),
  ...(WITHDRAWABLE.includes(r.status) ? [{ label: 'Withdraw', icon: menuIcons.withdraw, action: 'withdraw' as const }] : []),
  { label: 'Audit History', icon: menuIcons.history, action: 'audit' },
];

type Col<T> = { key: string; label: string; w: number; render: (r: T) => React.ReactNode; align?: 'right' };

const txt = (v: string) => <span className="text-[16px] text-[#0e1b3d] whitespace-nowrap">{v || '—'}</span>;

const STATUS_W = 200;
const ACTION_W = 79;

/* ── Advance-filter field primitives (same look as the shared listing template) ── */
function flLabel(active: boolean): React.CSSProperties {
  return {
    position: 'absolute', left: 12, top: active ? 0 : '50%', transform: 'translateY(-50%)',
    fontSize: active ? 12 : 16, color: '#0e1b3d', background: active ? '#fff' : 'transparent',
    padding: active ? '0 4px' : 0, pointerEvents: 'none', transition: 'top 0.15s ease, font-size 0.15s ease',
    fontFamily: font, whiteSpace: 'nowrap', zIndex: 1,
  };
}
function AFText({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <input value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="h-[56px] w-full rounded-[4px] px-[12px] text-[16px] text-[#0e1b3d] focus:outline-none bg-white"
        style={{ fontFamily: font, border: `1px solid ${focused ? '#1360d2' : '#d5ddfb'}` }} />
      <span style={flLabel(focused || !!value)}>{label}</span>
    </div>
  );
}
function AFSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="h-[56px] w-full rounded-[4px] px-[12px] flex items-center gap-[6px] text-[16px] text-[#0e1b3d] bg-white text-left"
        style={{ fontFamily: font, border: `1px solid ${open ? '#1360d2' : '#d5ddfb'}` }}>
        <span className="flex-1 truncate">{value}</span>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#697498" strokeWidth="2.5" className={`transition-transform ${open ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
      </button>
      <span style={flLabel(open || !!value)}>{label}</span>
      {open && (
        <div className="absolute z-[200] top-[60px] left-0 w-full bg-white rounded-[8px] py-[4px]" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.12)', border: '1px solid #f0f0f5' }}>
          {['', ...options].map(opt => (
            <button key={opt || 'all'} type="button" onClick={() => { onChange(opt); setOpen(false); }}
              className="w-full px-[14px] py-[10px] text-left text-[16px] hover:bg-[#e2ebf9]"
              style={{ fontFamily: font, color: opt ? '#0e1b3d' : '#697498' }}>
              {opt || '— All —'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type FilterDef = { key: string; label: string; type: 'text' | 'date' | 'select'; options?: string[] };

export default function DutyAccountListingPage({
  accounts, requests, tab, onTabChange, onBack, onCreate, onAccountAction, onRequestAction,
}: {
  accounts: Account[];
  requests: AccountRequest[];
  tab: ListingTab;
  onTabChange: (t: ListingTab) => void;
  onBack: () => void;
  onCreate: () => void;
  onAccountAction: (action: AccountAction, account: Account) => void;
  onRequestAction: (action: RequestAction, req: AccountRequest) => void;
}) {
  /* ── Column definitions ── */
  const accountCols: Col<Account>[] = useMemo(() => [
    { key: 'accountType', label: 'Account Type', w: 200, render: a => txt(a.accountType) },
    { key: 'accountCategory', label: 'Account Category', w: 170, render: a => txt(a.accountCategory) },
    {
      key: 'account', label: 'Account', w: 190, render: a => (
        <button type="button" onClick={() => onAccountAction('view', a)} className="text-[16px] text-[#1360d2] underline-offset-2 hover:underline whitespace-nowrap">
          {a.accountNo} - {a.accountName}
        </button>
      ),
    },
    { key: 'holder', label: 'Account Holder', w: 160, render: a => txt(a.holder) },
    { key: 'totalGuarantee', label: 'Total Guarantee Amount', w: 230, align: 'right', render: a => <Amount value={a.totalGuarantee} /> },
    { key: 'usedGuarantee', label: 'Used Guarantee Amount', w: 220, align: 'right', render: a => <Amount value={a.usedGuarantee} /> },
    { key: 'availableBalance', label: 'Available Balance', w: 220, align: 'right', render: a => <Amount value={a.availableBalance} /> },
    { key: 'remarks', label: 'Remarks', w: 140, render: a => a.remarks ? <span className="text-[16px] text-[#c0392b]">{a.remarks}</span> : txt('') },
  ], [onAccountAction]);

  const requestCols: Col<AccountRequest>[] = useMemo(() => [
    {
      key: 'requestNo', label: 'Request No.', w: 140, render: r => (
        <button type="button" onClick={() => onRequestAction('details', r)} className="text-[16px] text-[#1360d2] underline-offset-2 hover:underline">
          {r.requestNo}
        </button>
      ),
    },
    { key: 'requestType', label: 'Request Type', w: 210, render: r => txt(r.requestType) },
    { key: 'account', label: 'Account', w: 190, render: r => txt(`${r.accountNo}-${r.accountName}`) },
    {
      key: 'statusRemarks', label: 'Status Remarks', w: 260, render: r => (
        <span className="text-[16px] text-[#0e1b3d] block whitespace-normal" style={{ lineHeight: 1.3 }}>{r.statusRemarks || '—'}</span>
      ),
    },
    { key: 'requestDate', label: 'Request Date', w: 160, render: r => txt(r.requestDate) },
    { key: 'requestedBy', label: 'Requested By', w: 160, render: r => txt(r.requestedBy) },
  ], [onRequestAction]);

  const [visibleAccountCols, setVisibleAccountCols] = useState(() => accountCols.map(c => c.key));
  const [visibleRequestCols, setVisibleRequestCols] = useState(() => requestCols.map(c => c.key));
  const isAccounts = tab === 'accounts';

  /* ── Toolbar state ── */
  const searchFields = isAccounts ? ['Account No.', 'Account Holder'] : ['Request No.', 'Account No.'];
  const [searchField, setSearchField] = useState(searchFields[0]);
  const [fieldDropOpen, setFieldDropOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [statusDropOpen, setStatusDropOpen] = useState(false);
  const [afOpen, setAfOpen] = useState(false);
  const [afDraft, setAfDraft] = useState<Record<string, string>>({});
  const [afApplied, setAfApplied] = useState<Record<string, string>>({});
  const [statusFrom, setStatusFrom] = useState('2026-09-26');
  const [statusTo, setStatusTo] = useState('2026-10-26');
  const [showColModal, setShowColModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [menu, setMenu] = useState<{ index: number; at: FlyoutAnchor } | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

  // Each tab starts from a clean toolbar.
  useEffect(() => {
    setSearchField(isAccounts ? 'Account No.' : 'Request No.');
    setSearch(''); setStatusFilter(null); setAfDraft({}); setAfApplied({}); setAfOpen(false); setPage(1); setMenu(null);
  }, [isAccounts]);

  useEffect(() => {
    if (!statusDropOpen && !fieldDropOpen) return;
    const close = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusDropOpen(false);
      if (fieldRef.current && !fieldRef.current.contains(e.target as Node)) setFieldDropOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [statusDropOpen, fieldDropOpen]);

  const statusOptions: string[] = isAccounts ? ACCOUNT_STATUSES : REQUEST_STATUSES;

  const filterDefs: FilterDef[] = isAccounts
    ? [
        { key: 'accountType', label: 'Account Type', type: 'select', options: ACCOUNT_TYPES },
        { key: 'accountCategory', label: 'Account Category', type: 'select', options: ACCOUNT_CATEGORIES },
        { key: 'accountNo', label: 'Account No.', type: 'text' },
        { key: 'holder', label: 'Account Holder Code', type: 'text' },
        { key: 'status', label: 'Status', type: 'select', options: statusOptions },
      ]
    : [
        { key: 'requestType', label: 'Request Type', type: 'select', options: REQUEST_TYPES },
        { key: 'status', label: 'Request Status', type: 'select', options: statusOptions },
        { key: 'accountType', label: 'Account Type', type: 'select', options: ACCOUNT_TYPES },
        { key: 'account', label: 'Account', type: 'select', options: accounts.map(a => `${a.accountNo} - ${a.accountName}`) },
        { key: 'dateFrom', label: 'From Date', type: 'date' },
        { key: 'dateTo', label: 'To Date', type: 'date' },
      ];
  const filtersActive = Object.values(afApplied).some(Boolean);

  /* ── Filtering ── */
  const has = (v: string, q: string) => v.toLowerCase().includes(q.trim().toLowerCase());
  const accountRows = accounts.filter(a => {
    if (search && !has(searchField === 'Account No.' ? `${a.accountNo} ${a.accountName}` : a.holder, search)) return false;
    if (statusFilter && a.status !== statusFilter) return false;
    const f = afApplied;
    if (f.accountType && a.accountType !== f.accountType) return false;
    if (f.accountCategory && a.accountCategory !== f.accountCategory) return false;
    if (f.accountNo && !has(a.accountNo, f.accountNo)) return false;
    if (f.holder && !has(a.holder, f.holder)) return false;
    if (f.status && a.status !== f.status) return false;
    return true;
  });
  const requestRows = requests.filter(r => {
    if (search && !has(searchField === 'Request No.' ? r.requestNo : r.accountNo, search)) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    const f = afApplied;
    if (f.requestType && r.requestType !== f.requestType) return false;
    if (f.status && r.status !== f.status) return false;
    if (f.accountType && r.accountType !== f.accountType) return false;
    if (f.account && !f.account.startsWith(`${r.accountNo} `)) return false;
    const iso = toIso(r.requestDate);
    if (f.dateFrom && iso < f.dateFrom.slice(0, 10)) return false;
    if (f.dateTo && iso > f.dateTo.slice(0, 10)) return false;
    return true;
  });
  const total = isAccounts ? accountRows.length : requestRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = (Math.min(page, totalPages) - 1) * pageSize;

  /* ── Table behaviours (drag-reorder, resize, scroll arrows) ── */
  const {
    tableRef, scrollRef, hoveredColKey, resizeIndicatorLeft, isNearResize,
    atScrollStart, atScrollEnd, handleScroll, scrollToStart, scrollToEnd,
    handleTableMouseMove, handleTableMouseLeave, handleTableMouseDown,
    onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, getThStyle, getTdBg, getW,
  } = useTableBehaviors();

  const visibleKeys = isAccounts ? visibleAccountCols : visibleRequestCols;
  const setVisibleKeys = isAccounts ? setVisibleAccountCols : setVisibleRequestCols;
  const allCols = (isAccounts ? accountCols : requestCols) as Col<Account | AccountRequest>[];
  const cols = visibleKeys.map(k => allCols.find(c => c.key === k)!).filter(Boolean);
  const stickyWidth = STATUS_W + ACTION_W;
  const tableMinWidth = cols.reduce((s, c) => s + getW(c.key, c.w), 0) + stickyWidth;
  const pageRows: (Account | AccountRequest)[] = (isAccounts ? accountRows : requestRows).slice(pageStart, pageStart + pageSize);

  const pickMenu = (label: string, row: Account | AccountRequest) => {
    if (isAccounts) {
      const item = accountMenu().find(m => m.label === label);
      if (item) onAccountAction(item.action, row as Account);
    } else {
      const item = requestMenu(row as AccountRequest).find(m => m.label === label);
      if (item) onRequestAction(item.action, row as AccountRequest);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f8fafd] flex flex-col overflow-hidden" style={{ fontFamily: font }}>
      <div className="flex-shrink-0"><Header onServiceCatalogue={onBack} /></div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-8">
        {/* Breadcrumb + agent banner */}
        <div className="flex items-center justify-between mt-[16px] mb-[8px] flex-wrap gap-[8px]">
          <div className="flex items-center gap-[4px] text-[16px]">
            <span className="text-[#8f94ae] cursor-pointer hover:text-[#1360d2]" onClick={onBack}>Home</span>
            <span className="text-[#dc3545] px-[4px]">/</span>
            <span className="text-[#8f94ae] cursor-pointer hover:text-[#1360d2]" onClick={onBack}>Service Catalog</span>
            <span className="text-[#dc3545] px-[4px]">/</span>
            <span className="text-[#111838] font-medium">Duty Account</span>
          </div>
          <div className="px-[16px] py-[5px] rounded-[4px] text-[16px] text-[#0e1b3d]" style={{ background: '#e2ebf9' }}>
            AE-1050879 — AEOUAT1
          </div>
        </div>

        <h1 className="text-[28px] font-bold text-[#0e1b3d] mb-[20px]">Duty Account</h1>

        {/* Toolbar row 1 — Advance Filters / Search / Status / Need Help / primary action */}
        <div className="flex items-center gap-[10px] mb-[12px] flex-wrap">
          <button
            type="button"
            onClick={() => setAfOpen(o => !o)}
            aria-expanded={afOpen}
            className={`h-[48px] px-[14px] flex items-center gap-[8px] rounded-[4px] border text-[16px] transition-colors ${
              afOpen ? 'bg-[#e2ebf9] border-[#1360d2] text-[#1360d2]' : 'bg-white border-[#d5ddfb] text-[#0e1b3d] hover:bg-[#f0f4ff]'}`}
          >
            Advance Filters
            <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 5h14M5 10h10M7 15h6" strokeLinecap="round" /></svg>
          </button>

          <div className="flex h-[48px] rounded-[4px] border border-[#d5ddfb] bg-white relative flex-1 min-w-[280px] sm:min-w-[320px]">
            <div ref={fieldRef} className="flex items-center gap-[6px] px-[12px] border-r border-[#d5ddfb] select-none flex-shrink-0 cursor-pointer" onClick={() => setFieldDropOpen(o => !o)}>
              <span className="text-[16px] text-[#0e1b3d] whitespace-nowrap">{searchField}</span>
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none"><path d="M5 8l5 5 5-5" stroke="#0e1b3d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {fieldDropOpen && (
                <div className="absolute left-0 top-[50px] bg-white rounded-[8px] py-[4px] z-[200]" style={{ minWidth: 200, boxShadow: '0 2px 16px rgba(0,0,0,0.12)', border: '1px solid #f0f0f5' }}>
                  {searchFields.map(f => (
                    <button key={f} type="button" className="group w-full px-[14px] py-[10px] text-left hover:bg-[#1360d2]"
                      onClick={e => { e.stopPropagation(); setSearchField(f); setSearch(''); setFieldDropOpen(false); }}>
                      <span className="text-[16px] text-[#111838] group-hover:text-white">{f}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center pl-[12px] pr-[5px] gap-[8px] flex-1 min-w-0">
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder={`Search by ${searchField.replace('.', '').toLowerCase()}`}
                className="w-full min-w-0 text-[16px] text-[#0e1b3d] placeholder-[#8f94ae] bg-transparent focus:outline-none"
              />
              <span className="flex-shrink-0 inline-flex items-center justify-center rounded-[6px]" style={{ width: 38, height: 38, background: '#1360d2' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M11.76 10.27L17.49 16L16 17.49L10.27 11.76C9.2 12.53 7.91 13 6.5 13C2.91 13 0 10.09 0 6.5C0 2.91 2.91 0 6.5 0C10.09 0 13 2.91 13 6.5C13 7.91 12.53 9.2 11.76 10.27ZM6.5 2C4.01 2 2 4.01 2 6.5C2 8.99 4.01 11 6.5 11C8.99 11 11 8.99 11 6.5C11 4.01 8.99 2 6.5 2Z" fill="#ffffff" /></svg>
              </span>
            </div>
          </div>

          <div ref={statusRef} className="relative">
            {/* Same control as the Refund & Claims toolbar status dropdown */}
            <button type="button" onClick={() => setStatusDropOpen(o => !o)} aria-haspopup="listbox" aria-expanded={statusDropOpen}
              className="flex items-center gap-[8px] bg-white border border-[#d5ddfb] rounded-[4px] h-[48px] px-[16px] hover:bg-[#f7faff] transition-colors">
              <span className="text-[16px] text-[#1360d2] font-medium whitespace-nowrap">{statusFilter ?? (isAccounts ? 'Account Status' : 'Request Status')}</span>
              <svg viewBox="0 0 24 24" className={`size-[22px] text-[#1360d2] transition-transform ${statusDropOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {statusDropOpen && (
              <div role="listbox" className="absolute z-[80] top-[52px] left-0 bg-white rounded-[8px] py-[4px] overflow-hidden"
                style={{ minWidth: 220, boxShadow: '0px 2px 16px 0px rgba(0,0,0,0.12)', border: '1px solid #f0f0f5' }}>
                {[null, ...statusOptions].map(s => (
                  <button key={s ?? 'all'} type="button" role="option" aria-selected={statusFilter === s}
                    onClick={() => { setStatusFilter(s); setStatusDropOpen(false); setPage(1); }}
                    className="block w-full text-left px-[14px] py-[8px] text-[16px] hover:bg-[#e2ebf9] transition-colors"
                    style={{ color: statusFilter === s ? '#1360d2' : '#0e1b3d', fontWeight: statusFilter === s ? 500 : 400 }}>
                    {s ?? 'All Statuses'}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1" />

          <button type="button" className="flex items-center gap-[6px] text-[16px] text-[#1360d2] hover:opacity-80 px-[8px]">
            Need Help
            <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="#1360d2" strokeWidth="1.7"><circle cx="10" cy="10" r="7.5" /><path d="M10 14v-1" strokeLinecap="round" /><path d="M8 8a2 2 0 1 1 2.7 1.9c-.4.2-.7.6-.7 1.1" strokeLinecap="round" /></svg>
          </button>

          <button type="button" onClick={onCreate} className="h-[48px] px-[24px] rounded-[4px] text-[16px] text-white hover:opacity-90" style={{ background: '#1360d2', fontWeight: 500 }}>
            Create New Account
          </button>
        </div>

        {/* Advance Filters panel — Apply/Reset sit inline after the last field */}
        {afOpen && (
          <div className="relative bg-white rounded-[8px] border border-[#d5ddfb] p-5 mb-[12px]" style={{ boxShadow: '4px 4px 30px 0px rgba(0,0,0,0.12)' }}>
            <button type="button" onClick={() => setAfOpen(false)} aria-label="Close filters"
              className="absolute top-3 right-3 size-[28px] flex items-center justify-center rounded-full hover:bg-[#f0f4ff] text-[#697498]">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {filterDefs.map(d => {
                const v = afDraft[d.key] ?? '';
                const set = (nv: string) => setAfDraft(p => ({ ...p, [d.key]: nv }));
                if (d.type === 'date') return <DateInput key={d.key} label={d.label} value={v} onChange={set} />;
                if (d.type === 'select') return <AFSelect key={d.key} label={d.label} value={v} options={d.options!} onChange={set} />;
                return <AFText key={d.key} label={d.label} value={v} onChange={set} />;
              })}
              <div className="flex items-end gap-[10px]">
                <button type="button" onClick={() => { setAfApplied(afDraft); setPage(1); }} className="h-[48px] px-5 rounded-[4px] text-[16px] text-white" style={{ background: '#1360d2' }}>
                  Apply
                </button>
                <button type="button" onClick={() => { setAfDraft({}); setAfApplied({}); }} data-secondary-btn className="h-[48px] px-5 rounded-[4px] border border-[#1360d2] text-[16px] text-[#1360d2] bg-white">
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar row 2 — tabs, Status As On, Columns */}
        <div className="flex items-center mb-[4px] gap-[12px] flex-wrap">
          <div role="tablist" aria-label="Duty account views" className="bg-white flex items-center gap-[12px] h-[48px] px-[16px] py-[8px] rounded-[6px] flex-shrink-0" style={{ boxShadow: '0px 4px 10px rgba(0,0,0,0.08)' }}>
            {([['accounts', 'Accounts'], ['requests', 'All Requests']] as const).map(([key, label]) => (
              <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => onTabChange(key)}
                className={`h-[40px] px-[16px] rounded-[4px] text-[16px] font-medium transition-colors ${
                  tab === key ? 'bg-[#1360d2] text-white' : 'bg-[#f7faff] text-[#697498] border border-[#e5efff]'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex justify-center basis-full lg:basis-auto lg:flex-1">
            <StatusAsOnBadge disabled={filtersActive} fromValue={statusFrom} toValue={statusTo} onApply={(f, t) => { setStatusFrom(f); setStatusTo(t); }} />
          </div>
          <button type="button" onClick={() => setShowColModal(true)}
            className="flex items-center gap-[6px] h-[40px] px-[14px] rounded-[6px] bg-white border border-[#d5ddfb] text-[#1360d2] text-[16px] font-medium flex-shrink-0"
            style={{ boxShadow: '0px 4px 10px rgba(0,0,0,0.08)' }}>
            <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="#1360d2" strokeWidth="1.6"><rect x="2" y="3" width="4" height="14" rx="1" /><rect x="8" y="3" width="4" height="14" rx="1" /><rect x="14" y="3" width="4" height="14" rx="1" /></svg>
            Columns
          </button>
        </div>

        {/* Table */}
        <div style={{ position: 'relative' }}>
          <ScrollArrows atStart={atScrollStart} atEnd={atScrollEnd} onLeft={scrollToStart} onRight={scrollToEnd} stickyWidth={stickyWidth} />
          <div ref={scrollRef} onScroll={handleScroll} className="overflow-x-auto pb-[20px]" style={{ position: 'relative' }}>
            {resizeIndicatorLeft !== null && (
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: resizeIndicatorLeft, width: 3, background: '#1360D2', borderRadius: 2, pointerEvents: 'none', zIndex: 100 }} />
            )}
            <table
              ref={tableRef}
              onMouseMove={handleTableMouseMove}
              onMouseLeave={handleTableMouseLeave}
              onMouseDown={handleTableMouseDown}
              className="w-full"
              style={{ minWidth: tableMinWidth, borderCollapse: 'separate', borderSpacing: '0 8px', cursor: isNearResize ? 'col-resize' : undefined }}
            >
              <thead>
                <tr>
                  {cols.map((col, idx) => (
                    <th
                      key={col.key}
                      data-col-key={col.key}
                      onDragOver={e => onDragOver(col.key, e)}
                      onDragLeave={onDragLeave}
                      onDrop={e => onDrop(col.key, e, visibleKeys, setVisibleKeys)}
                      style={{
                        position: 'relative', width: getW(col.key, col.w), minWidth: getW(col.key, col.w),
                        padding: '18px 12px 10px', paddingLeft: idx === 0 ? 16 : 12, textAlign: col.align ?? 'left', fontWeight: 500,
                        borderRadius: idx === 0 ? '8px 0 0 8px' : undefined, ...getThStyle(col.key),
                      }}
                    >
                      <div draggable onDragStart={e => onDragStart(col.key, e)} onDragEnd={onDragEnd}
                        style={{ display: hoveredColKey === col.key ? 'flex' : 'none', position: 'absolute', top: 3, left: '50%', transform: 'translateX(-50%)', cursor: 'grab', zIndex: 4 }}>
                        <DragDots />
                      </div>
                      <div className={col.align === 'right' ? 'flex justify-end' : undefined}>
                        <ColumnFilter label={col.label} labelClass="text-[16px] font-medium text-[#051937]" />
                      </div>
                    </th>
                  ))}
                  <th style={{ position: 'sticky', right: ACTION_W, width: STATUS_W, minWidth: STATUS_W, background: '#a6c2e9', padding: '10px 12px', textAlign: 'left', fontWeight: 500, boxShadow: '-3px 0 6px rgba(0,0,0,0.06)', zIndex: 2 }}>
                    <StatusFilterHeader label={isAccounts ? 'Status' : 'Request Status'} options={statusOptions} value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} colorMap={STATUS_COLOR} />
                  </th>
                  <th style={{ position: 'sticky', right: 0, width: ACTION_W, minWidth: ACTION_W, background: '#a6c2e9', padding: '10px 12px', textAlign: 'left', fontWeight: 500, zIndex: 2, borderRadius: '0 8px 8px 0' }}>
                    <span className="text-[16px] text-[#051937]">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={cols.length + 2} className="bg-white text-center text-[16px] text-[#697498]" style={{ padding: '28px 12px', borderRadius: 8 }}>
                      No records match the selected filters.
                    </td>
                  </tr>
                )}
                {pageRows.map((row, i) => (
                  <tr key={isAccounts ? (row as Account).accountNo : (row as AccountRequest).requestNo}>
                    {cols.map((col, ci) => (
                      <td key={col.key} data-col-key={col.key} style={{
                        background: getTdBg(col.key) ?? '#fff', padding: '0 12px', paddingLeft: ci === 0 ? 16 : 12, height: 60,
                        verticalAlign: 'middle', textAlign: col.align ?? 'left', width: getW(col.key, col.w), borderBottom: '1px solid #f8f8f8',
                      }}>
                        {col.render(row)}
                      </td>
                    ))}
                    <td style={{ position: 'sticky', right: ACTION_W, background: '#fff', padding: '0 12px', height: 60, verticalAlign: 'middle', width: STATUS_W, boxShadow: '-3px 0 6px rgba(0,0,0,0.06)', borderBottom: '1px solid #f8f8f8', zIndex: 1 }}>
                      <StatusChip status={row.status} />
                    </td>
                    <td style={{ position: 'sticky', right: 0, background: '#fff', padding: '0 12px', height: 60, verticalAlign: 'middle', width: ACTION_W, textAlign: 'center', borderBottom: '1px solid #f8f8f8', zIndex: 1 }}>
                      <ThreeDotsButton onClick={e => setMenu({ index: i, at: anchorFrom(e, isAccounts ? ACCOUNT_MENU_SIZE : requestMenu(row as AccountRequest).length, 250) })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={Math.min(page, totalPages)} totalPages={totalPages} pageSize={pageSize} totalItems={total} onPageChange={setPage} onPageSizeChange={n => { setPageSize(n); setPage(1); }} />
        </div>
      </div>

      {menu && pageRows[menu.index] && (
        <RowFlyout
          items={isAccounts ? accountMenu() : requestMenu(pageRows[menu.index] as AccountRequest)}
          at={menu.at}
          width={250}
          onPick={label => pickMenu(label, pageRows[menu.index])}
          onClose={() => setMenu(null)}
        />
      )}

      {showColModal && (
        <ManageColumnsModal
          columns={allCols.map(c => ({ key: c.key, label: c.label }))}
          visible={visibleKeys}
          lockedColumns={[{ key: '_status', label: isAccounts ? 'Status' : 'Request Status' }, { key: '_action', label: 'Action' }]}
          onSave={keys => { setVisibleKeys(keys); setShowColModal(false); }}
          onClose={() => setShowColModal(false)}
        />
      )}
    </div>
  );
}
