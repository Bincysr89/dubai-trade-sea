import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Header from '../Header';
import BackToListingBar from '../BackToListingBar';
import HappinessMeterBar from '../HappinessMeterBar';
import Dh from '../Dh';
import type { Account } from './dutyAccountData';

/* Building blocks for the Duty Account screens. They follow the Refund & Claims
   template (ClaimSubPages / ClaimSubmittedSuccessPage / SaveExitModal): red-slash
   breadcrumb, 32px title, section header above a white card, BackToListingBar. */

export const font = "'Dubai', sans-serif";

/* ── Page shell ── */
export function PageShell({ title, badge, crumbs, onHome, titleRight, onBack, onBackToListing, rightContent, resultPage, children }: {
  title: string;
  badge?: string;
  /** Trail after "Home / Service Catalog"; the last entry is the current page. */
  crumbs: { label: string; onClick?: () => void }[];
  onHome: () => void;
  titleRight?: React.ReactNode;
  onBack?: () => void;
  onBackToListing?: () => void;
  rightContent?: React.ReactNode;
  /** Success / payment pages: no action bar — the Happiness Meter bar sits at the bottom instead (claims template). */
  resultPage?: boolean;
  children: React.ReactNode;
}) {
  const trail = [{ label: 'Home', onClick: onHome }, { label: 'Service Catalog', onClick: onHome }, ...crumbs];
  const hasBar = !resultPage && !!(onBack || onBackToListing || rightContent);
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#f8fafd]" style={{ fontFamily: font }}>
      <div className="flex-shrink-0"><Header onServiceCatalogue={onHome} /></div>

      <div className="flex items-start justify-between px-4 sm:px-10 pt-[24px] pb-[12px] flex-wrap gap-[12px] flex-shrink-0">
        <nav aria-label="Breadcrumb" className="flex items-center gap-[6px] flex-wrap">
          {trail.map((c, i) => {
            const last = i === trail.length - 1;
            return (
              <React.Fragment key={c.label + i}>
                {i > 0 && <span className="text-[16px] text-[#dc3545]">/</span>}
                {last || !c.onClick
                  ? <span className={`text-[16px] ${last ? 'text-[#111838]' : 'text-[#8f94ae]'}`} style={{ fontWeight: last ? 500 : 400 }} aria-current={last ? 'page' : undefined}>{c.label}</span>
                  : <button type="button" onClick={c.onClick} className="text-[16px] text-[#8f94ae] hover:text-[#1360d2]">{c.label}</button>}
              </React.Fragment>
            );
          })}
        </nav>
        <div className="px-[16px] py-[4px] rounded-[4px] text-[16px] text-[#0e1b3d]" style={{ background: '#e2ebf9' }}>
          AE-1050879 — AEOUAT1
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-10 flex items-center justify-between gap-[12px] flex-wrap">
          <div className="flex items-center gap-[12px] flex-wrap">
            <h1 className="text-2xl sm:text-3xl lg:text-[32px] text-[#111838]" style={{ fontWeight: 500 }}>{title}</h1>
            {badge && (
              <span className="text-[14px] px-[10px] py-[2px] rounded-[4px]" style={{ background: '#e2ebf9', color: '#1360d2', fontWeight: 500 }}>{badge}</span>
            )}
          </div>
          {titleRight}
        </div>
        <div className="px-4 sm:px-10 pt-[24px] pb-[24px] flex flex-col gap-[20px]" style={resultPage ? { paddingBottom: 110 } : undefined}>{children}</div>
      </div>

      {hasBar && <BackToListingBar onBack={onBack} onBackToListing={onBackToListing} rightContent={rightContent} />}
      {resultPage && <HappinessMeterBar />}
    </div>
  );
}

/* ── Buttons (claims PrimaryBtn / secondary outline) ── */
type BtnProps = { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string };

export function PrimaryButton({ children, onClick, disabled, className = '' }: BtnProps) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`h-[48px] px-[28px] rounded-[4px] text-[16px] text-white inline-flex items-center justify-center gap-[8px] transition-colors hover:bg-[#0f4fab] ${className}`}
      style={{ background: disabled ? '#a7c3eb' : '#1360d2', cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 500, boxShadow: disabled ? 'none' : '0px 0px 8px rgba(28,72,191,0.16)' }}>
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, disabled, className = '' }: BtnProps) {
  return (
    <button type="button" data-secondary-btn onClick={onClick} disabled={disabled}
      className={`h-[48px] px-[28px] rounded-[4px] text-[16px] bg-white inline-flex items-center justify-center gap-[8px] transition-colors ${className}`}
      style={{ border: '1.5px solid #1360d2', color: '#1360d2', fontWeight: 500, opacity: disabled ? 0.5 : 1 }}>
      {children}
    </button>
  );
}

/* ── Section header + card ── */
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-[8px] px-[24px] py-[24px] ${className}`} style={{ boxShadow: '0px 5px 32px rgba(143,155,186,0.16)' }}>
      {children}
    </div>
  );
}

export function Section({ title, action, info, children }: {
  title: string;
  action?: React.ReactNode;
  /** Blue info bar between the heading and the card (Refund & Claims pattern). */
  info?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-[12px]">
      <div className="flex items-center justify-between gap-[12px] flex-wrap">
        <h2 className="text-[18px] text-[#0e1b3d]" style={{ fontWeight: 500 }}>{title}</h2>
        {action}
      </div>
      {info && <InfoBanner tone="info">{info}</InfoBanner>}
      <Card>{children}</Card>
    </section>
  );
}

/* ── Read-only label / value grid ── */
const GRID_COLS: Record<2 | 3 | 4, string> = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-2 lg:grid-cols-3',
  4: 'md:grid-cols-2 lg:grid-cols-4',
};

export function InfoGrid({ items, cols = 4 }: { items: [string, React.ReactNode][]; cols?: 2 | 3 | 4 }) {
  return (
    <div className={`grid grid-cols-1 ${GRID_COLS[cols]} gap-x-[24px] gap-y-[20px]`}>
      {items.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-[6px] min-w-0">
          <span className="text-[16px] text-[#696f83]">{label}</span>
          <span className="text-[16px] text-[#051937] break-words" style={{ fontWeight: 500 }}>{value === '' || value == null ? '—' : value}</span>
        </div>
      ))}
    </div>
  );
}

/** Form-field grid: four per row on full screen, as in Refund & Claims. */
export function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-[24px] gap-y-[24px]">{children}</div>;
}

/* ── "Account Information" card shown at the top of every account sub-page ── */
export function AccountInfoSection({ account, action }: { account: Account; action?: React.ReactNode }) {
  return (
    <Section title="Account Information" action={action}>
      <InfoGrid items={[
        ['Account', `${account.accountNo} - ${account.accountName}`],
        ['Account Holder Type', account.holderType],
        ['Account Holder Code', account.holderCode],
        ['Business Code', account.businessCode],
      ]} />
    </Section>
  );
}

/* ── Amount with the Dirham glyph ── */
export function Amount({ value, strong }: { value: string; strong?: boolean }) {
  const negative = value.trim().startsWith('-');
  return (
    <span className="inline-flex items-baseline gap-[4px] whitespace-nowrap" style={{ color: negative ? '#c0392b' : undefined, fontWeight: strong ? 600 : undefined }}>
      <Dh /> {value}
    </span>
  );
}

/* ── Status chip ── */
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  'Active':            { bg: 'rgba(40,167,69,0.10)',   color: '#28a745' },
  'Approved':          { bg: 'rgba(40,167,69,0.10)',   color: '#28a745' },
  'Completed':         { bg: 'rgba(40,167,69,0.10)',   color: '#28a745' },
  'Payment Completed': { bg: 'rgba(23,162,184,0.12)',  color: '#0f7c8c' },
  'New':               { bg: 'rgba(124,58,237,0.10)',  color: '#7c3aed' },
  'Inactive':          { bg: 'rgba(105,116,152,0.12)', color: '#697498' },
  'Withdrawn':         { bg: 'rgba(105,116,152,0.12)', color: '#697498' },
  'Submitted':         { bg: 'rgba(19,96,210,0.10)',   color: '#1360d2' },
  'Under Processing':  { bg: 'rgba(255,169,26,0.16)',  color: '#b45309' },
  'Payment Pending':   { bg: 'rgba(255,169,26,0.16)',  color: '#b45309' },
  'Rejected':          { bg: 'rgba(192,57,43,0.10)',   color: '#c0392b' },
  'Suspended':         { bg: 'rgba(220,53,69,0.10)',   color: '#dc3545' },
};
export const STATUS_COLOR: Record<string, string> = Object.fromEntries(Object.entries(STATUS_STYLE).map(([k, v]) => [k, v.color]));

export function StatusChip({ status }: { status: string }) {
  const st = STATUS_STYLE[status] ?? STATUS_STYLE.Inactive;
  return (
    <span className="text-[16px] whitespace-nowrap inline-flex items-center" style={{ background: st.bg, color: st.color, padding: '4px 12px', borderRadius: 4, lineHeight: '20px', fontWeight: 500 }}>
      {status}
    </span>
  );
}

/* ── Data table inside a card ── */
export type SimpleCol = { label: string; align?: 'left' | 'right' | 'center'; width?: number };

export function SimpleTable({ columns, rows, empty = 'No records found', headerCells }: {
  columns: SimpleCol[];
  rows: React.ReactNode[][];
  empty?: string;
  /** Replaces a header label with custom content (e.g. a select-all checkbox), by column index. */
  headerCells?: Record<number, React.ReactNode>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0, fontFamily: font, minWidth: columns.length * 140 }}>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={c.label} style={{
                background: '#a6c2e9', padding: '12px', textAlign: c.align ?? 'left', fontWeight: 500, whiteSpace: 'nowrap',
                width: c.width, paddingLeft: i === 0 ? 16 : 12,
                borderTopLeftRadius: i === 0 ? 8 : 0, borderBottomLeftRadius: i === 0 ? 8 : 0,
                borderTopRightRadius: i === columns.length - 1 ? 8 : 0, borderBottomRightRadius: i === columns.length - 1 ? 8 : 0,
              }}>
                {headerCells?.[i] ?? <span className="text-[16px] text-[#051937]">{c.label}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center text-[16px] text-[#697498]" style={{ padding: '20px 12px' }}>{empty}</td>
            </tr>
          ) : rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((cell, ci) => (
                <td key={ci} className="text-[16px] text-[#0e1b3d]" style={{
                  padding: '0 12px', height: 56, borderBottom: '1px solid #eef2fb', textAlign: columns[ci]?.align ?? 'left',
                  paddingLeft: ci === 0 ? 16 : 12, whiteSpace: 'nowrap',
                }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Field chrome shared by the inputs below (matches FloatingField / DTSelect) ── */
function FieldLabel({ htmlFor, label, required, floated, active, left = 16 }: {
  htmlFor?: string; label: string; required?: boolean; floated: boolean; active: boolean; left?: number;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="absolute pointer-events-none transition-all"
      style={{
        left: floated ? 10 : left,
        top: floated ? -9 : '50%',
        transform: floated ? 'none' : 'translateY(-50%)',
        background: floated ? '#fff' : 'transparent',
        padding: floated ? '0 4px' : 0,
        fontSize: floated ? 12 : 16,
        color: floated && active ? '#1360d2' : '#000',
        transitionDuration: '120ms',
        whiteSpace: 'nowrap',
        maxWidth: 'calc(100% - 24px)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {required && <span style={{ color: '#dc3545' }}>*</span>}
      {required ? ' ' : ''}{label}
    </label>
  );
}

function FieldError({ error }: { error?: string }) {
  return error ? <span role="alert" className="block text-[14px] text-[#dc3545] mt-[4px]">{error}</span> : null;
}

const borderFor = (error: string | undefined, active: boolean) => (error ? '#dc3545' : active ? '#1360d2' : '#d5ddfb');

/* ── Floating-label text field ── */
export function FloatField({ label, required, value, onChange, readOnly, amount, error, placeholder }: {
  label: string; required?: boolean; value: string; onChange?: (v: string) => void;
  readOnly?: boolean; amount?: boolean; error?: string; placeholder?: string;
}) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const floated = focused || value.length > 0;
  return (
    <div>
      <div className="relative">
        <div className="rounded-[4px] flex items-center gap-[6px] px-[16px] h-[56px] transition-colors"
          style={{ border: `1px solid ${borderFor(error, focused)}`, background: readOnly ? '#f5f7fa' : '#fff' }}>
          {amount && <span className="text-[16px] text-[#0e1b3d]"><Dh /></span>}
          <input
            id={id}
            value={value}
            readOnly={readOnly}
            aria-invalid={!!error}
            onChange={e => onChange?.(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={floated ? placeholder : ''}
            className="flex-1 min-w-0 text-[16px] focus:outline-none bg-transparent placeholder:text-[#697498]"
            style={{ color: readOnly ? '#697498' : '#0e1b3d' }}
          />
        </div>
        <FieldLabel htmlFor={id} label={label} required={required} floated={floated} active={focused} left={amount ? 38 : 16} />
      </div>
      <FieldError error={error} />
    </div>
  );
}

/* ── Floating-label dropdown (scrolls for long lists such as banks) ── */
export function FloatSelect({ label, required, value, onChange, options, error, disabled }: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void; options: string[];
  error?: string; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return (
    <div ref={ref}>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(o => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={label}
          className="rounded-[4px] flex items-center px-[16px] w-full text-left h-[56px] transition-colors"
          style={{ border: `1px solid ${borderFor(error, open)}`, background: disabled ? '#f5f7fa' : '#fff', cursor: disabled ? 'default' : 'pointer' }}
        >
          <span className="flex-1 truncate text-[16px]" style={{ color: disabled ? '#697498' : '#0e1b3d' }}>{value || (open ? 'Select' : '')}</span>
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="#697498" strokeWidth="2" className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}><path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <FieldLabel label={label} required={required} floated={!!value || open} active={open} />
        {open && (
          <div role="listbox" className="absolute z-[80] left-0 right-0 mt-[6px] bg-white rounded-[8px] py-[4px] overflow-y-auto"
            style={{ maxHeight: 300, boxShadow: '0px 2px 16px 0px rgba(0,0,0,0.12)', border: '1px solid #f0f0f5' }}>
            {options.map(opt => {
              const selected = opt === value;
              return (
                <button key={opt} type="button" role="option" aria-selected={selected}
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className="block w-full text-left px-[14px] py-[10px] text-[16px] transition-colors hover:bg-[#e2ebf9]"
                  style={{ background: selected ? '#e2ebf9' : undefined, color: selected ? '#1360d2' : '#0e1b3d', fontWeight: selected ? 500 : 400 }}>
                  {opt}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <FieldError error={error} />
    </div>
  );
}

/* ── Result card (claims success template: NonRemittanceSuccessPage / NRPayment* pages) ── */
// Icons copied from the Refund & Claims result pages: NonRemittanceSuccessPage (tick) and
// NRPaymentProcessingPage (payment pending), so every result screen matches that template.
const CLAIMS_TICK = (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" aria-hidden>
      <circle cx="50" cy="50" r="44" fill="#28A745" />
      <path d="M30 51 l13 13 27-29" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const RESULT_ICON = {
  success: CLAIMS_TICK,
  paid: CLAIMS_TICK,
  pending: (
    <svg width="80" height="80" viewBox="0 0 100 100" fill="none" aria-hidden>
      <path d="M49.6656 32.3052C47.7559 32.3052 46.1935 30.7427 46.1935 28.8331L46.1935 14.9447C46.1935 13.0351 47.7559 11.4727 49.6656 11.4727C51.5752 11.4727 53.1377 13.0351 53.1377 14.9447L53.1377 28.8331C53.1377 30.7427 51.5752 32.3052 49.6656 32.3052ZM49.6656 87.8585C47.7559 87.8585 46.1935 86.2961 46.1935 84.3864L46.1935 70.4981C46.1935 68.5884 47.7559 67.026 49.6656 67.026C51.5752 67.026 53.1377 68.5884 53.1377 70.4981L53.1377 84.3864C53.1377 86.2961 51.5752 87.8585 49.6656 87.8585ZM84.3864 53.1377L70.4981 53.1377C68.5884 53.1377 67.026 51.5752 67.026 49.6656C67.026 47.7559 68.5884 46.1935 70.4981 46.1935L84.3864 46.1935C86.2961 46.1935 87.8585 47.7559 87.8585 49.6656C87.8585 51.5752 86.2961 53.1377 84.3864 53.1377ZM28.8331 53.1377L14.9447 53.1377C13.0351 53.1377 11.4727 51.5752 11.4727 49.6656C11.4727 47.7559 13.0351 46.1935 14.9447 46.1935L28.8331 46.1935C30.7427 46.1935 32.3052 47.7559 32.3052 49.6656C32.3052 51.5752 30.7427 53.1377 28.8331 53.1377ZM74.2132 77.6853C73.3105 77.6853 72.4424 77.3381 71.748 76.6784L61.922 66.8524C61.6006 66.5309 61.3456 66.1493 61.1716 65.7293C60.9977 65.3093 60.9081 64.8592 60.9081 64.4046C60.9081 63.95 60.9977 63.4998 61.1716 63.0798C61.3456 62.6598 61.6006 62.2782 61.922 61.9567C62.2435 61.6353 62.6251 61.3803 63.0451 61.2063C63.4651 61.0324 63.9152 60.9428 64.3698 60.9428C64.8245 60.9428 65.2746 61.0324 65.6946 61.2063C66.1146 61.3803 66.4962 61.6353 66.8177 61.9567L76.6437 71.7827C77.1282 72.2676 77.4577 72.8856 77.5903 73.5581C77.7229 74.2306 77.6527 74.9274 77.3885 75.5599C77.1243 76.1924 76.6781 76.7322 76.1066 77.1106C75.5351 77.489 74.8639 77.689 74.1785 77.6853H74.2132ZM34.9439 38.416C34.0412 38.416 33.1732 38.0688 32.4788 37.4091L22.6528 27.5831C22.3313 27.2617 22.0763 26.8801 21.9024 26.4601C21.7284 26.0401 21.6388 25.5899 21.6388 25.1353C21.6388 24.6807 21.7284 24.2306 21.9024 23.8106C22.0763 23.3906 22.3313 23.0089 22.6528 22.6875C22.9742 22.366 23.3558 22.111 23.7758 21.9371C24.1958 21.7631 24.646 21.6736 25.1006 21.6736C25.5552 21.6736 26.0053 21.7631 26.4253 21.9371C26.8453 22.111 27.227 22.366 27.5484 22.6875L37.3744 32.5135C37.8589 32.9984 38.1884 33.6163 38.321 34.2888C38.4536 34.9613 38.3834 35.6581 38.1192 36.2906C37.8551 36.9231 37.4089 37.4629 36.8373 37.8413C36.2658 38.2197 35.5947 38.4198 34.9092 38.416H34.9439ZM25.1179 77.6853C24.2152 77.6853 23.3472 77.3381 22.6528 76.6784C22.3309 76.3572 22.0755 75.9756 21.9013 75.5556C21.7271 75.1356 21.6374 74.6853 21.6374 74.2306C21.6374 73.7758 21.7271 73.3256 21.9013 72.9055C22.0755 72.4855 22.3309 72.104 22.6528 71.7827L32.4788 61.9567C32.8002 61.6353 33.1818 61.3803 33.6018 61.2063C34.0218 61.0324 34.472 60.9428 34.9266 60.9428C35.3812 60.9428 35.8313 61.0324 36.2513 61.2063C36.6713 61.3803 37.0529 61.6353 37.3744 61.9567C37.6959 62.2782 37.9508 62.6598 38.1248 63.0798C38.2988 63.4998 38.3883 63.95 38.3883 64.4046C38.3883 64.8592 38.2988 65.3093 38.1248 65.7293C37.9508 66.1493 37.6959 66.5309 37.3744 66.8524L27.5484 76.6784C26.854 77.3728 25.986 77.6853 25.0832 77.6853H25.1179ZM64.3872 38.416C63.4845 38.416 62.6164 38.0688 61.922 37.4091C61.6002 37.0879 61.3448 36.7064 61.1706 36.2863C60.9963 35.8663 60.9066 35.416 60.9066 34.9613C60.9066 34.5066 60.9963 34.0563 61.1706 33.6363C61.3448 33.2162 61.6002 32.8347 61.922 32.5135L71.748 22.6875C72.0695 22.366 72.4511 22.111 72.8711 21.9371C73.2911 21.7631 73.7412 21.6736 74.1958 21.6736C74.6504 21.6736 75.1006 21.7631 75.5206 21.9371C75.9406 22.111 76.3222 22.366 76.6437 22.6875C76.9651 23.0089 77.2201 23.3906 77.3941 23.8106C77.568 24.2306 77.6576 24.6807 77.6576 25.1353C77.6576 25.5899 77.568 26.0401 77.3941 26.4601C77.2201 26.8801 76.9651 27.2617 76.6437 27.5831L66.8177 37.4091C66.1232 38.1035 65.2552 38.416 64.3525 38.416H64.3872Z" fill="#375EF9" />
    </svg>
  ),
};

export function ResultCard({ tone = 'success', heading, message, note, details, children, actions }: {
  tone?: keyof typeof RESULT_ICON;
  heading: string;
  message?: React.ReactNode;
  /** Yellow info note under the message. */
  note?: React.ReactNode;
  /** Reference details shown as a one-row table (label header + value), as on the other success screens. */
  details?: [string, React.ReactNode][];
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div role="status" className="bg-white rounded-[8px] flex flex-col items-center gap-[32px] px-[24px] py-[60px]" style={{ boxShadow: '0px 5px 32px rgba(143,155,186,0.16)' }}>
      {RESULT_ICON[tone]}
      <p className="text-[24px] text-[#0e1b3d] text-center" style={{ fontWeight: 500 }}>{heading}</p>
      {message && <p className="text-[16px] text-[#696f83] text-center max-w-[640px]" style={{ lineHeight: 1.5 }}>{message}</p>}
      {note && (
        <div className="w-full max-w-[640px] flex items-start gap-[12px] rounded-[6px] px-[16px] py-[14px]" style={{ background: '#fff8e1', border: '1px solid #f5c842' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden>
            <circle cx="11" cy="11" r="10" fill="#f5c842" />
            <text x="11" y="16" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">i</text>
          </svg>
          <p className="text-[15px] text-[#b45309]" style={{ lineHeight: 1.5 }}>{note}</p>
        </div>
      )}
      {details && details.length > 0 && (
        <div className="w-full max-w-[1100px]">
          <SimpleTable columns={details.map(([label]) => ({ label }))} rows={[details.map(([, value]) => value)]} />
        </div>
      )}
      {children && <div className="w-full max-w-[1100px]">{children}</div>}
      {/* Claims result buttons are 52px tall */}
      {actions && <div className="flex flex-wrap items-center justify-center gap-[14px] [&>button]:!h-[52px]">{actions}</div>}
    </div>
  );
}

/* ── Banners (claims success / info / note) ── */
export function SuccessBanner({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" className="flex items-start gap-[12px] rounded-[8px] px-[20px] py-[16px]" style={{ background: '#d4edda', border: '1px solid #c3e6cb' }}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#155724" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-[2px]">
        <circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" />
      </svg>
      <p className="text-[16px] text-[#155724]" style={{ lineHeight: 1.5 }}>{children}</p>
    </div>
  );
}

export function InfoBanner({ children, tone = 'warning' }: { children: React.ReactNode; tone?: 'warning' | 'info' }) {
  const c = tone === 'warning'
    ? { bg: '#fff8e1', border: '#ffe082', text: '#856404' }
    : { bg: '#eef4ff', border: '#d5e3fb', text: '#1d3f7a' };
  return (
    <div className="flex items-start gap-[12px] rounded-[8px] px-[20px] py-[14px]" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={c.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-[3px]">
        <circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" />
      </svg>
      <p className="text-[16px]" style={{ color: c.text, lineHeight: 1.5 }}>{children}</p>
    </div>
  );
}

/* ── Overlay helper ── */
export function Overlay({ children, onClose, z = 400 }: { children: React.ReactNode; onClose?: () => void; z?: number }) {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return createPortal(
    <div data-print-root className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: z, background: 'rgba(0,0,0,0.45)', fontFamily: font }}>
      {/* Print only the dialog: hide the app behind it and the dialog chrome. */}
      <style>{`@media print {
        body > :not([data-print-root]) { display: none !important; }
        [data-print-root] { position: static !important; padding: 0 !important; background: none !important; }
        [data-print-root] .da-no-print { display: none !important; }
        [data-print-root] [role=dialog], [data-print-root] [role=alertdialog] { max-height: none !important; box-shadow: none !important; }
        [data-print-root] [role=dialog] > div { overflow: visible !important; }
      }`}</style>
      {children}
    </div>,
    document.body,
  );
}

/* ── Content modal (Account Detail, Withdraw Guarantee, Request Details) ── */
export function Modal({ title, onClose, children, footer, width = 960 }: {
  title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; width?: number;
}) {
  return (
    <Overlay onClose={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="relative bg-white rounded-[12px] flex flex-col w-full max-h-[90vh]"
        style={{ maxWidth: width, boxShadow: '0px 8px 40px rgba(0,0,0,0.18)' }}>
        <div className="flex items-center justify-between px-[24px] py-[18px] flex-shrink-0" style={{ borderBottom: '1px solid #e8edf6' }}>
          <h3 className="text-[20px] text-[#0e1b3d]" style={{ fontWeight: 700 }}>{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="da-no-print size-[36px] flex items-center justify-center rounded-full hover:bg-[#f0f4ff] text-[#697498]">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-[24px] py-[20px] flex flex-col gap-[20px]">{children}</div>
        {footer && (
          <div className="da-no-print flex items-center justify-center gap-[12px] px-[24px] py-[16px] flex-shrink-0 flex-wrap" style={{ borderTop: '1px solid #e8edf6' }}>
            {footer}
          </div>
        )}
      </div>
    </Overlay>
  );
}

/** Heading used inside modals and the flyout. */
export function SubHeading({ children }: { children: React.ReactNode }) {
  return <h4 className="text-[18px] text-[#0e1b3d]" style={{ fontWeight: 500 }}>{children}</h4>;
}

/* ── Message / confirmation popup (SaveExitModal style) ── */
const DIALOG_ICON = {
  warning: (
    <div className="flex items-center justify-center w-[64px] h-[64px] rounded-full" style={{ background: '#fff8e6' }}>
      <svg viewBox="0 0 96 96" fill="none" width="36" height="36" aria-hidden>
        <circle cx="48" cy="48" r="42" fill="none" stroke="#FFC020" strokeWidth="7" />
        <rect x="44.5" y="22" width="7" height="32" rx="3.5" fill="#FFC020" />
        <circle cx="48" cy="68" r="4.5" fill="#FFC020" />
      </svg>
    </div>
  ),
  info: (
    <div className="flex items-center justify-center w-[64px] h-[64px] rounded-full" style={{ background: '#e8f0fc' }}>
      <svg viewBox="0 0 96 96" fill="none" width="36" height="36" aria-hidden>
        <circle cx="48" cy="48" r="42" fill="none" stroke="#1360d2" strokeWidth="7" />
        <circle cx="48" cy="28" r="4.5" fill="#1360d2" />
        <rect x="44.5" y="40" width="7" height="34" rx="3.5" fill="#1360d2" />
      </svg>
    </div>
  ),
  confirm: (
    <div className="flex items-center justify-center w-[64px] h-[64px] rounded-full" style={{ background: '#e8f0fc' }}>
      <svg viewBox="0 0 96 96" fill="none" width="36" height="36" aria-hidden>
        <circle cx="48" cy="48" r="42" fill="none" stroke="#1360d2" strokeWidth="7" />
        <path d="M36 38a12 12 0 1 1 17 11c-3 1.5-5 4-5 7v3" stroke="#1360d2" strokeWidth="7" strokeLinecap="round" fill="none" />
        <circle cx="48" cy="72" r="4.5" fill="#1360d2" />
      </svg>
    </div>
  ),
};

export function MessageDialog({ tone = 'info', title, message, okLabel = 'OK', cancelLabel, onOk, onCancel }: {
  tone?: keyof typeof DIALOG_ICON;
  title: string;
  message: React.ReactNode;
  okLabel?: string;
  cancelLabel?: string;
  onOk: () => void;
  onCancel?: () => void;
}) {
  return (
    <Overlay onClose={onCancel ?? onOk} z={500}>
      <div role="alertdialog" aria-modal="true" aria-label={title}
        className="bg-white rounded-[12px] flex flex-col items-center gap-[28px] px-[40px] py-[40px] max-w-[480px] w-full"
        style={{ boxShadow: '0px 8px 40px rgba(0,0,0,0.18)' }}>
        {DIALOG_ICON[tone]}
        <div className="text-center flex flex-col gap-[8px]">
          <p className="text-[20px] text-[#0e1b3d]" style={{ fontWeight: 700 }}>{title}</p>
          <p className="text-[16px] text-[#697498]" style={{ lineHeight: 1.5 }}>{message}</p>
        </div>
        <div className="flex gap-[12px] w-full justify-center">
          {cancelLabel && <SecondaryButton onClick={onCancel} className="flex-1">{cancelLabel}</SecondaryButton>}
          <PrimaryButton onClick={onOk} className={cancelLabel ? 'flex-1' : 'min-w-[160px]'}>{okLabel}</PrimaryButton>
        </div>
      </div>
    </Overlay>
  );
}

/* ── Reset button icon and the client-profile info line ── */
export const resetIcon = (
  <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M17 10a7 7 0 1 1-2.05-4.95" /><path d="M17 3v4h-4" /></svg>
);

export function ClientProfileInfo() {
  return <>Click <button type="button" className="text-[#1360d2] underline underline-offset-2">here</button> to update contact details in Client Profile.</>;
}

/* ── Row-menu icons ── */
export const menuIcons = {
  view: <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" /><circle cx="10" cy="10" r="2.5" /></svg>,
  guarantee: <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M10 2l6 2.5v5c0 4-2.7 6.6-6 8.5-3.3-1.9-6-4.5-6-8.5v-5L10 2z" /><path d="M7.5 10l1.8 1.8L13 8" strokeLinecap="round" /></svg>,
  contact: <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2.5" y="4" width="15" height="12" rx="2" /><circle cx="7.5" cy="9" r="2" /><path d="M4.8 13.5c.6-1.3 1.6-2 2.7-2s2.1.7 2.7 2M12 8h3.5M12 11h3.5" strokeLinecap="round" /></svg>,
  users: <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="7.5" cy="7" r="2.8" /><path d="M2.5 16.5c.7-2.6 2.6-4 5-4s4.3 1.4 5 4" /><circle cx="14" cy="6.5" r="2.2" /><path d="M14.5 11.5c1.6.3 2.6 1.5 3 3.3" /></svg>,
  manage: <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 13.5V17h3.5L16 7.5 12.5 4 3 13.5z" /><path d="M11.5 5L15 8.5" /></svg>,
  reduce: <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="7.5" /><path d="M6.5 10h7" /></svg>,
  withdraw: <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h14M8 5V3h4v2M16 5l-1 12H5L4 5" /><path d="M8 9v5M12 9v5" /></svg>,
  print: <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M5 8V3h10v5M5 15H3V8h14v7h-2" /><rect x="5" y="12" width="10" height="5" /></svg>,
  pay: <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><rect x="2" y="4.5" width="16" height="11" rx="2" /><path d="M2 8.5h16M5.5 12.5h3" strokeLinecap="round" /></svg>,
  history: <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 10a6.5 6.5 0 1 0 2-4.7" /><path d="M3 3.5v3.5h3.5" /><path d="M10 6.5V10l2.5 1.5" /></svg>,
};

export function ThreeDotsButton({ onClick, label = 'Row actions' }: { onClick: (e: React.MouseEvent) => void; label?: string }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="size-[32px] rounded-full inline-flex items-center justify-center hover:bg-[#e2ebf9] transition-colors">
      <svg viewBox="0 0 20 20" width="18" height="18" fill="#697498"><circle cx="10" cy="4" r="1.7" /><circle cx="10" cy="10" r="1.7" /><circle cx="10" cy="16" r="1.7" /></svg>
    </button>
  );
}

/** Delete icon that always asks "Are you sure to delete?" first (Refund & Claims behaviour). */
export function DeleteIconButton({ onClick, label, message = 'This record will be removed.' }: { onClick: () => void; label: string; message?: string }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <button type="button" aria-label={label} onClick={() => setConfirming(true)} className="size-[34px] rounded-[6px] inline-flex items-center justify-center hover:bg-[#fdecee] transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC3545" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" />
        </svg>
      </button>
      {confirming && (
        <MessageDialog tone="warning" title="Are you sure to delete?" message={message}
          cancelLabel="No" okLabel="Yes" onCancel={() => setConfirming(false)} onOk={() => { setConfirming(false); onClick(); }} />
      )}
    </>
  );
}
