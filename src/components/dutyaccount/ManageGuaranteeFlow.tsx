import { useState } from 'react';
import RowFlyout, { anchorFrom, type FlyoutAnchor, type FlyoutItem } from '../declaration/RowFlyout';
import DocumentUploadSection from '../declaration/DocumentUploadSection';
import {
  AccountInfoSection, Amount, DeleteIconButton, FieldGrid, FloatField, FloatSelect, InfoBanner, InfoGrid, MessageDialog,
  PageShell, PrimaryButton, ResultCard, Section, SecondaryButton, SimpleTable, StatusChip, ThreeDotsButton, menuIcons, resetIcon,
} from './DutyAccountUI';
import { PaymentFlow, ReceiptModal } from './RequestScreens';
import {
  BANKS, GUARANTEE_TYPES, REFUND_BANK_ACCOUNTS, REFUND_MODES, formatAmount, newBatchNo, newReceipt, newRequestNo, parseAmount,
  type Account, type Guarantee, type Receipt, type RequestGuarantee, type RequestStatus,
} from './dutyAccountData';

type RequestType = 'New' | 'Update' | 'Reduce' | 'Withdraw';

/** One pending change in "Changes to Submit". */
type Modification = {
  id: number;
  requestType: RequestType;
  guaranteeType: 'BANK' | 'CASH';
  refNo: string;
  existing: string;
  proposed: string;
  refundMode: string;
  bank?: string;
};

type Submitted = Modification & { batchNo: string; requestNo: string; status: RequestStatus; receipt?: Receipt };

const REQUEST_LABEL: Record<RequestType, string> = {
  New: 'New Guarantee', Update: 'Update Guarantee', Reduce: 'Reduce Guarantee', Withdraw: 'Withdraw Guarantee',
};

const SETTLE_MSG = 'Attention: Please settle any outstanding balances before withdrawal of guarantees.';
const CHEQUE_MSG = 'Special Approval is required for refund by Cheque. For faster refund, please add Bank Account and submit the request using Bank Account Transfer option.';

let nextId = 1;

/** Amount input: digits, one decimal point, commas tolerated. */
const cleanAmount = (v: string) => v.replace(/[^\d.,]/g, '');
const money = (v: string, fallback: number) => formatAmount(parseAmount(v) || fallback);
const plus = <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>;

const bankAccountInfo = (
  <>Click <button type="button" className="text-[#1360d2] underline underline-offset-2">here</button> to add bank account.</>
);

/* ── "Changes to Submit" — the pending batch, shown on the list and the form pages ── */
function ChangesSection({ rows, onRemove, showEmpty }: { rows: Modification[]; onRemove: (id: number) => void; showEmpty?: boolean }) {
  if (!rows.length && !showEmpty) return null;
  return (
    <Section
      title={`Changes to Submit (${rows.length})`}
      info="These changes are not submitted yet. Review them here and click Submit to send them all together as one request batch."
    >
      <SimpleTable
        columns={[
          { label: 'S. No.', width: 80 }, { label: 'Request Type' }, { label: 'Guarantee Type' }, { label: 'Guarantee Ref. No.' },
          { label: 'Existing Amount', align: 'right' }, { label: 'Proposed Amount', align: 'right' }, { label: 'Refund Mode' },
          { label: 'Action', align: 'center', width: 90 },
        ]}
        rows={rows.map((m, i) => [
          String(i + 1), m.requestType, m.guaranteeType, m.refNo || '—',
          <Amount value={m.existing} />, <Amount value={m.proposed} />, m.refundMode || '—',
          <DeleteIconButton label={`Remove ${m.refNo || 'row'}`} message="This guarantee change will be removed from Changes to Submit." onClick={() => onRemove(m.id)} />,
        ])}
        empty="No changes added yet. Select guarantees above and choose Update, Reduce or Withdraw."
      />
    </Section>
  );
}

/* ── Refund mode + bank account fields, with the cheque special-approval message ── */
function RefundSection({ mode, setMode, bankAccount, setBankAccount, title = 'Refund Details' }: {
  mode: string; setMode: (v: string) => void; bankAccount: string; setBankAccount: (v: string) => void; title?: string;
}) {
  const [chequeNotice, setChequeNotice] = useState(false);
  return (
    <Section title={title} info={bankAccountInfo}>
      <FieldGrid>
        <FloatSelect label="Refund Mode" required value={mode} options={REFUND_MODES}
          onChange={v => { setMode(v); if (v === 'Cheque') { setBankAccount(''); setChequeNotice(true); } }} />
        {mode === 'Bank Account Transfer' && (
          <div className="md:col-span-2">
            <FloatSelect label="Bank Account No." required value={bankAccount} options={REFUND_BANK_ACCOUNTS} onChange={setBankAccount} />
          </div>
        )}
      </FieldGrid>
      {chequeNotice && <MessageDialog tone="info" title="Message" message={CHEQUE_MSG} onOk={() => setChequeNotice(false)} />}
    </Section>
  );
}

/* ── Shared shell for the form pages: Back returns to Manage Guarantee ── */
function FormShell({ title, account, batch, onRemove, onBack, onBackToListing, onHome, onAdd, children }: {
  title: string; account: Account; batch: Modification[]; onRemove: (id: number) => void;
  onBack: () => void; onBackToListing: () => void; onHome: () => void; onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <PageShell
      title={title}
      badge={`Account ${account.accountNo}`}
      crumbs={[{ label: 'Duty Account', onClick: onBackToListing }, { label: 'Manage Guarantee', onClick: onBack }, { label: title }]}
      onHome={onHome}
      onBack={onBack}
      rightContent={<PrimaryButton onClick={onAdd}>{plus} Add to Changes</PrimaryButton>}
    >
      <AccountInfoSection account={account} />
      {children}
      <ChangesSection rows={batch} onRemove={onRemove} />
    </PageShell>
  );
}

type FormProps = {
  account: Account;
  batch: Modification[];
  onAdd: (m: Modification[]) => void;
  onRemove: (id: number) => void;
  onBack: () => void;
  onBackToListing: () => void;
  onHome: () => void;
};

/* ── New Guarantee — its own flow: add several new guarantees, then submit them together ── */
function NewGuaranteePage({ account, rows, onAddRow, onRemove, onBack, onBackToListing, onHome, onSubmit }: {
  account: Account;
  rows: Modification[];
  onAddRow: (m: Modification) => void;
  onRemove: (id: number) => void;
  onBack: () => void;
  onBackToListing: () => void;
  onHome: () => void;
  onSubmit: () => void;
}) {
  const [type, setType] = useState('Bank');
  const [refNo, setRefNo] = useState('');
  const [amount, setAmount] = useState('');
  const [bank, setBank] = useState('');
  const [docsKey, setDocsKey] = useState(0);
  const isBank = type === 'Bank';

  // Prototype: no blocking validation — blank fields fall back to sample values.
  const current = (): Modification => ({
    id: nextId++, requestType: 'New', guaranteeType: isBank ? 'BANK' : 'CASH',
    // Cash guarantees get their reference (the receipt no.) only once the e-Payment completes.
    refNo: isBank ? (refNo.trim() || `BG${String(Date.now()).slice(-7)}`) : '',
    existing: '0.00', proposed: money(amount, 10000), refundMode: '', bank: isBank ? (bank || BANKS[1]) : undefined,
  });
  const reset = () => { setType('Bank'); setRefNo(''); setAmount(''); setBank(''); setDocsKey(k => k + 1); };
  // First the form; after Add Guarantee the page switches to the review of guarantees to submit.
  const [mode, setMode] = useState<'form' | 'review'>(rows.length ? 'review' : 'form');
  const add = () => { onAddRow(current()); reset(); setMode('review'); };
  const crumbs = [{ label: 'Duty Account', onClick: onBackToListing }, { label: 'Manage Guarantee', onClick: onBack }, { label: 'New Guarantee' }];

  if (mode === 'review') {
    return (
      <PageShell
        title="New Guarantee"
        badge={`Account ${account.accountNo}`}
        crumbs={crumbs}
        onHome={onHome}
        onBack={onBack}
        rightContent={<PrimaryButton disabled={rows.length === 0} onClick={() => onSubmit()}>Submit{rows.length ? ` (${rows.length})` : ''}</PrimaryButton>}
      >
        <AccountInfoSection account={account} />
        <Section
          title={`New Guarantees to Submit (${rows.length})`}
          info="Review the new guarantees below. Use Add New Guarantee to add another, then click Submit to send them all in one submission."
          action={<PrimaryButton onClick={() => setMode('form')}>{plus} Add New Guarantee</PrimaryButton>}
        >
          <SimpleTable
            columns={[
              { label: 'S. No.', width: 80 }, { label: 'Guarantee Type' }, { label: 'Guarantee Ref. No.' }, { label: 'Bank' },
              { label: 'Amount', align: 'right' }, { label: 'Action', align: 'center', width: 90 },
            ]}
            rows={rows.map((m, i) => [
              String(i + 1), m.guaranteeType === 'BANK' ? 'Bank' : 'Cash (e-Payment Only)', m.refNo || 'Issued on payment', m.bank ?? '—',
              <Amount value={m.proposed} />,
              <DeleteIconButton label={`Remove guarantee ${i + 1}`} message="This new guarantee will be removed from the submission." onClick={() => onRemove(m.id)} />,
            ])}
            empty="No new guarantees added yet. Click Add New Guarantee to add one."
          />
        </Section>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="New Guarantee"
      badge={`Account ${account.accountNo}`}
      crumbs={crumbs}
      onHome={onHome}
      // Back from the form returns to the review when guarantees are already added.
      onBack={rows.length ? () => { reset(); setMode('review'); } : onBack}
      rightContent={(
        <div className="flex items-center gap-[12px]">
          <SecondaryButton onClick={reset}>{resetIcon} Reset</SecondaryButton>
          <PrimaryButton onClick={add}>{plus} Add Guarantee</PrimaryButton>
        </div>
      )}
    >
      <AccountInfoSection account={account} />

      <Section title="New Guarantee Details">
        <FieldGrid>
          <FloatSelect label="Guarantee Type" required value={type} options={GUARANTEE_TYPES} onChange={setType} />
          {isBank
            ? <FloatField label="Guarantee Ref. No." required value={refNo} onChange={setRefNo} />
            : <FloatField label="Guarantee Ref. No." value="" readOnly />}
          <FloatField label="Amount" required amount value={amount} onChange={v => setAmount(cleanAmount(v))} />
          <FloatSelect label="Bank" required={isBank} value={isBank ? bank : ''} options={BANKS} disabled={!isBank} onChange={setBank} />
        </FieldGrid>
      </Section>

      {isBank && (
        <DocumentUploadSection
          key={docsKey}
          hideAuthority
          docTypes={[
            { label: 'Bank Guarantee Copy', required: true, nature: 'Original' },
            { label: 'Confirmation Email from Bank', required: true, nature: 'Copy' },
          ]}
          intro={(
            <div className="flex flex-col gap-[12px]">
              <a href="#" onClick={e => e.preventDefault()} className="inline-flex items-center gap-[6px] text-[16px] text-[#1360d2] hover:underline w-fit">
                Download Bank Guarantee Format
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0l-5-5m5 5l5-5M4 19h16" /></svg>
              </a>
              <InfoBanner>
                Kindly request your bank to send a confirmation email to <strong>Refund.finance@dubaicustoms.ae</strong> confirming the issuance of the guarantee and the authenticity of signatures appearing thereon.
              </InfoBanner>
            </div>
          )}
        />
      )}
    </PageShell>
  );
}

/* ── One collapsible block per selected guarantee: its own amount, refund details and documents ── */
function GuaranteeBlock({ g, index, total, open, onToggle, summary, children }: {
  g: Guarantee; index: number; total: number; open: boolean; onToggle: () => void; summary?: React.ReactNode; children: React.ReactNode;
}) {
  // A single guarantee keeps the plain page layout — the accordion is only for multiple selections.
  if (total === 1) return <>{children}</>;
  return (
    <div className="rounded-[10px]" style={{ background: '#eef3fb', border: '1px solid #d5e3fb' }}>
      <button type="button" onClick={onToggle} aria-expanded={open}
        className="w-full flex items-center gap-[12px] px-[20px] py-[16px] text-left flex-wrap">
        <span className="size-[28px] rounded-full inline-flex items-center justify-center text-[14px] text-white flex-shrink-0" style={{ background: '#1360d2', fontWeight: 600 }}>
          {index + 1}
        </span>
        <span className="text-[18px] text-[#0e1b3d]" style={{ fontWeight: 600 }}>Guarantee {g.refNo}</span>
        <span className="text-[13px] px-[8px] py-[2px] rounded-[4px]" style={{ background: '#fff', color: '#1360d2', fontWeight: 500 }}>{g.type}</span>
        <span className="text-[16px] text-[#455174]">Current <Amount value={g.amount} /></span>
        {summary && <span className="text-[16px] text-[#455174]">{summary}</span>}
        <span className="flex-1" />
        <span className="text-[14px] text-[#697498]">{index + 1} of {total}</span>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#1360d2" strokeWidth="2.5" className={`transition-transform ${open ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && <div className="px-[16px] pb-[16px] flex flex-col gap-[20px]">{children}</div>}
    </div>
  );
}

/** Which blocks are expanded — the first one starts open. */
function useOpenBlocks(guarantees: Guarantee[]) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(guarantees[0] ? [guarantees[0].refNo] : []));
  const toggle = (ref: string) => setOpen(o => { const n = new Set(o); if (n.has(ref)) n.delete(ref); else n.add(ref); return n; });
  return { isOpen: (ref: string) => open.has(ref), toggle };
}

type PerGuarantee = Record<string, string>;
const setKey = (set: React.Dispatch<React.SetStateAction<PerGuarantee>>, ref: string) => (v: string) => set(m => ({ ...m, [ref]: v }));

function GuaranteeInfo({ g, field }: { g: Guarantee; field: React.ReactNode }) {
  return (
    <Section title="Guarantee Details">
      <InfoGrid items={[
        ['Guarantee Type', g.type],
        ['Guarantee Ref. No.', g.refNo],
        ['Bank', g.bank ?? '—'],
        ['Current Amount', <Amount value={g.amount} />],
      ]} />
      <div className="mt-[24px]"><FieldGrid>{field}</FieldGrid></div>
    </Section>
  );
}

const multiInfo = (n: number, what: string) =>
  `${n} guarantees selected. Each has its own ${what} — open each guarantee below to complete it, then click Add to Changes.`;

/* ── Update Guarantee (any type, one or more — each with its own amount and documents) ── */
function UpdateGuaranteePage({ guarantees, ...p }: FormProps & { guarantees: Guarantee[] }) {
  const [amounts, setAmounts] = useState<PerGuarantee>({});
  const { isOpen, toggle } = useOpenBlocks(guarantees);
  const add = () => {
    p.onAdd(guarantees.map(g => ({
      id: nextId++, requestType: 'Update', guaranteeType: g.type, refNo: g.refNo, existing: g.amount,
      proposed: money(amounts[g.refNo] ?? '', parseAmount(g.amount)), refundMode: '',
    })));
    p.onBack();
  };
  return (
    <FormShell title="Update Guarantee" {...p} onAdd={add}>
      {guarantees.length > 1 && <InfoBanner tone="info">{multiInfo(guarantees.length, 'new amount and documents')}</InfoBanner>}
      {guarantees.map((g, i) => (
        <GuaranteeBlock key={g.refNo} g={g} index={i} total={guarantees.length} open={isOpen(g.refNo)} onToggle={() => toggle(g.refNo)}
          summary={amounts[g.refNo] ? <>→ New <Amount value={formatAmount(parseAmount(amounts[g.refNo]))} /></> : undefined}>
          <GuaranteeInfo g={g} field={(
            <FloatField label="New Amount" required amount placeholder={g.amount.replace(/,/g, '')} value={amounts[g.refNo] ?? ''}
              onChange={v => setKey(setAmounts, g.refNo)(cleanAmount(v))} />
          )} />
          <DocumentUploadSection
            hideAuthority
            title={guarantees.length > 1 ? `Upload Documents — ${g.refNo}` : 'Upload Documents'}
            docTypes={[
              { label: 'Amendment Guarantee Copy', required: true, nature: 'Original' },
              { label: 'Bank Guarantee Copy', nature: 'Copy' },
            ]}
          />
        </GuaranteeBlock>
      ))}
    </FormShell>
  );
}

/* ── Reduce Guarantee (any type, one or more — each with its own refund details and documents) ── */
function ReduceGuaranteePage({ guarantees, ...p }: FormProps & { guarantees: Guarantee[] }) {
  const [refunds, setRefunds] = useState<PerGuarantee>({});
  const [modes, setModes] = useState<PerGuarantee>({});
  const [accounts, setAccounts] = useState<PerGuarantee>({});
  const [settleNotice, setSettleNotice] = useState(false);
  const { isOpen, toggle } = useOpenBlocks(guarantees);

  const confirmAdd = () => {
    setSettleNotice(false);
    p.onAdd(guarantees.map(g => {
      const current = parseAmount(g.amount);
      const refund = Math.min(parseAmount(refunds[g.refNo] ?? '') || current / 2, current);
      return {
        id: nextId++, requestType: 'Reduce', guaranteeType: g.type, refNo: g.refNo, existing: g.amount,
        proposed: formatAmount(current - refund), refundMode: modes[g.refNo] ?? '',
      };
    }));
    p.onBack();
  };

  return (
    <FormShell title="Reduce Guarantee" {...p} onAdd={() => setSettleNotice(true)}>
      {guarantees.length > 1 && <InfoBanner tone="info">{multiInfo(guarantees.length, 'refund amount, refund details and documents')}</InfoBanner>}
      {guarantees.map((g, i) => (
        <GuaranteeBlock key={g.refNo} g={g} index={i} total={guarantees.length} open={isOpen(g.refNo)} onToggle={() => toggle(g.refNo)}
          summary={refunds[g.refNo] ? <>→ Refund <Amount value={formatAmount(parseAmount(refunds[g.refNo]))} /></> : undefined}>
          <GuaranteeInfo g={g} field={(
            <FloatField label="Refund Amount" required amount placeholder={g.amount.replace(/,/g, '')} value={refunds[g.refNo] ?? ''}
              onChange={v => setKey(setRefunds, g.refNo)(cleanAmount(v))} />
          )} />
          <RefundSection
            mode={modes[g.refNo] ?? ''} setMode={setKey(setModes, g.refNo)}
            bankAccount={accounts[g.refNo] ?? ''} setBankAccount={setKey(setAccounts, g.refNo)}
          />
          <DocumentUploadSection
            hideAuthority
            title={guarantees.length > 1 ? `Upload Documents — ${g.refNo}` : 'Upload Documents'}
            docTypes={[
              { label: 'Trade License Copy', required: true, nature: 'Copy' },
              { label: 'Receipt Copy', required: true, nature: 'Original' },
              { label: 'Additional Document 1', nature: 'Any' },
              { label: 'Additional Document 2', nature: 'Any' },
            ]}
          />
        </GuaranteeBlock>
      ))}
      {settleNotice && <MessageDialog tone="warning" title="Message" message={SETTLE_MSG} onOk={confirmAdd} onCancel={() => setSettleNotice(false)} />}
    </FormShell>
  );
}

/* ── Withdraw Guarantee page: details + refund per cash guarantee, then one confirmation popup ── */
function WithdrawGuaranteePage({ guarantees, ...p }: FormProps & { guarantees: Guarantee[] }) {
  const [modes, setModes] = useState<PerGuarantee>({});
  const [accounts, setAccounts] = useState<PerGuarantee>({});
  const [confirming, setConfirming] = useState(false);
  const cash = guarantees.filter(g => g.type === 'CASH');

  const confirmAdd = () => {
    setConfirming(false);
    p.onAdd(guarantees.map(g => ({
      id: nextId++, requestType: 'Withdraw', guaranteeType: g.type, refNo: g.refNo,
      existing: g.amount, proposed: '0.00', refundMode: g.type === 'CASH' ? (modes[g.refNo] ?? '') : '',
    })));
    p.onBack();
  };

  return (
    <FormShell title="Withdraw Guarantee" {...p} onAdd={() => setConfirming(true)}>
      <Section title={`Selected Guarantees (${guarantees.length})`} info="The full amount of each guarantee below will be withdrawn.">
        <SimpleTable
          columns={[{ label: 'Guarantee Type' }, { label: 'Guarantee Ref. No.' }, { label: 'Bank' }, { label: 'Current Amount', align: 'right' }, { label: 'Proposed Amount', align: 'right' }]}
          rows={guarantees.map(g => [g.type, g.refNo, g.bank ?? '—', <Amount value={g.amount} />, <Amount value="0.00" />])}
        />
      </Section>
      {cash.map(g => (
        <RefundSection key={g.refNo} title={cash.length > 1 ? `Refund Details — ${g.refNo}` : 'Refund Details'}
          mode={modes[g.refNo] ?? ''} setMode={setKey(setModes, g.refNo)}
          bankAccount={accounts[g.refNo] ?? ''} setBankAccount={setKey(setAccounts, g.refNo)} />
      ))}
      {cash.length < guarantees.length && (
        <InfoBanner tone="info">Bank guarantees are released back to the issuing bank once the withdrawal is approved, so they need no refund details.</InfoBanner>
      )}
      {confirming && (
        <MessageDialog tone="confirm" title="Confirmation" message="Are you sure to withdraw your Guarantee?"
          okLabel="OK" cancelLabel="Cancel" onOk={confirmAdd} onCancel={() => setConfirming(false)} />
      )}
    </FormShell>
  );
}

/* ── Manage Guarantee: list → forms → success ── */
type Action = 'update' | 'reduce' | 'withdraw';
type View =
  | { kind: 'list' }
  | { kind: 'new' }
  | { kind: Action; guarantees: Guarantee[] }
  | { kind: 'success' };

const ACTION_LABEL: Record<Action, string> = { update: 'Update Guarantee', reduce: 'Reduce Guarantee', withdraw: 'Withdraw Guarantee' };

export type SubmittedGuaranteeRequest = { requestNo: string; requestType: string; status: RequestStatus; guarantee: RequestGuarantee };

export default function ManageGuaranteeFlow({ account, onBackToListing, onHome, onSubmitted, onPaid, onViewRequests }: {
  account: Account;
  onBackToListing: () => void;
  onHome: () => void;
  onSubmitted: (requests: SubmittedGuaranteeRequest[]) => void;
  onPaid: (requestNo: string, receipt: Receipt) => void;
  onViewRequests: () => void;
}) {
  const [view, setView] = useState<View>({ kind: 'list' });
  const [batch, setBatch] = useState<Modification[]>([]);
  const [submitted, setSubmitted] = useState<Submitted[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState<{ guarantee: Guarantee; at: FlyoutAnchor } | null>(null);
  // Reduce and Withdraw open with the "settle outstanding balances" notice before their page.
  const [notice, setNotice] = useState<{ action: 'reduce' | 'withdraw'; guarantees: Guarantee[] } | null>(null);
  const [paying, setPaying] = useState<Submitted | null>(null);
  const [receiptFor, setReceiptFor] = useState<Receipt | null>(null);
  const [justPaid, setJustPaid] = useState<Receipt | null>(null);

  const [newBatch, setNewBatch] = useState<Modification[]>([]);
  const remove = (id: number) => setBatch(b => b.filter(m => m.id !== id));
  // A later change to the same guarantee replaces its earlier pending change.
  const addToBatch = (rows: Modification[]) => {
    setBatch(b => [...b.filter(m => !m.refNo || !rows.some(r => r.refNo === m.refNo)), ...rows]);
    setSelected(new Set());
  };
  // New guarantees and changes to existing guarantees are submitted from their own flows.
  const submitRows = (rows: Modification[]) => {
    const batchNo = newBatchNo();
    // A new cash guarantee is paid by e-Payment before it is processed.
    const done: Submitted[] = rows.map(m => ({
      ...m, batchNo, requestNo: newRequestNo(),
      status: m.requestType === 'New' && m.guaranteeType === 'CASH' ? 'Payment Pending' : 'Under Processing',
    }));
    setSubmitted(done);
    setView({ kind: 'success' });
    onSubmitted(done.map(d => ({
      requestNo: d.requestNo, requestType: REQUEST_LABEL[d.requestType], status: d.status,
      guarantee: { type: d.guaranteeType === 'BANK' ? 'Bank' : 'Cash', refNo: d.refNo, existing: d.existing, proposed: d.proposed, refundMode: d.refundMode || undefined },
    })));
  };
  const submit = () => { submitRows(batch); setBatch([]); };
  const submitNew = () => { submitRows(newBatch); setNewBatch([]); };
  const completePayment = (s: Submitted) => {
    const receipt = newReceipt(account, s.proposed);
    setSubmitted(list => list.map(x => x.requestNo === s.requestNo ? { ...x, status: 'Completed', refNo: receipt.receiptNo.replace('-', ''), receipt } : x));
    setPaying(null);
    setJustPaid(receipt);
    onPaid(s.requestNo, receipt);
  };
  const start = (action: Action, list: Guarantee[]) => {
    if (action === 'update') setView({ kind: 'update', guarantees: list });
    else setNotice({ action, guarantees: list });
  };
  const formProps: FormProps = {
    account, batch, onAdd: addToBatch, onRemove: remove, onBack: () => setView({ kind: 'list' }), onBackToListing, onHome,
  };

  if (view.kind === 'new') {
    return (
      <NewGuaranteePage account={account} rows={newBatch} onAddRow={m => setNewBatch(b => [...b, m])}
        onRemove={id => setNewBatch(b => b.filter(m => m.id !== id))}
        onBack={formProps.onBack} onBackToListing={onBackToListing} onHome={onHome} onSubmit={submitNew} />
    );
  }
  if (view.kind === 'update') return <UpdateGuaranteePage guarantees={view.guarantees} {...formProps} />;
  if (view.kind === 'reduce') return <ReduceGuaranteePage guarantees={view.guarantees} {...formProps} />;
  if (view.kind === 'withdraw') return <WithdrawGuaranteePage guarantees={view.guarantees} {...formProps} />;

  if (view.kind === 'success') {
    const pending = submitted.some(s => s.status === 'Payment Pending');
    return (
      <PageShell
        title="Manage Guarantee"
        badge={`Account ${account.accountNo}`}
        crumbs={[{ label: 'Duty Account', onClick: onBackToListing }, { label: 'Guarantee Request Details' }]}
        onHome={onHome}
        resultPage
      >
        <ResultCard
          tone={pending ? 'pending' : 'success'}
          heading={pending
            ? 'Guarantee Request Submitted - Payment Pending'
            : justPaid ? 'Guarantee Request Submitted - Payment Successful' : 'Guarantee Request Has Been Successfully Submitted'}
          message={pending
            ? 'Guarantee request has been successfully submitted as follows. Cash guarantees stay in Payment Pending until paid — click Pay to complete the e-Payment.'
            : justPaid
              ? <>Payment has been received and receipt <strong>{justPaid.receiptNo}</strong> has been generated. Use Print Receipt to view it.</>
              : 'Guarantee request has been successfully submitted as follows and is currently under processing.'}
          note={<>All email messages related to these requests will be sent to <strong>{account.contact.email}</strong> for <strong>{account.businessCode}</strong>.</>}
          actions={(
            <>
              <SecondaryButton onClick={onBackToListing}>Back to Listing</SecondaryButton>
              <PrimaryButton onClick={onViewRequests}>View All Requests</PrimaryButton>
            </>
          )}
        >
          <SimpleTable
            columns={[{ label: 'Batch No.' }, { label: 'Request No.' }, { label: 'Request Type' }, { label: 'Guarantee Type' }, { label: 'Guarantee Ref. No.' }, { label: 'Status' }, { label: 'Action', align: 'center', width: 170 }]}
            rows={submitted.map(s => [
              s.batchNo, s.requestNo, REQUEST_LABEL[s.requestType], s.guaranteeType === 'BANK' ? 'Bank' : 'Cash', s.refNo || '—',
              <StatusChip status={s.status} />,
              s.status === 'Payment Pending'
                ? <PrimaryButton className="!h-[40px] !px-[20px]" onClick={() => setPaying(s)}>{menuIcons.pay} Pay</PrimaryButton>
                : s.receipt
                  ? <SecondaryButton className="!h-[40px] !px-[16px]" onClick={() => setReceiptFor(s.receipt!)}>{menuIcons.print} Print Receipt</SecondaryButton>
                  : '—',
            ])}
          />
        </ResultCard>
        {paying && <PaymentFlow amount={paying.proposed} onCancel={() => setPaying(null)} onPaid={() => completePayment(paying)} />}
        {receiptFor && <ReceiptModal account={account} receipt={receiptFor} onClose={() => setReceiptFor(null)} />}
      </PageShell>
    );
  }

  /* ── Existing guarantees (select → action) and the pending changes ── */
  const pendingBy = new Map(batch.map(b => [b.refNo, b.requestType]));
  const chosen = account.guarantees.filter(g => selected.has(g.refNo));
  const allChecked = account.guarantees.length > 0 && chosen.length === account.guarantees.length;
  const toggle = (ref: string) => setSelected(s => { const n = new Set(s); if (n.has(ref)) n.delete(ref); else n.add(ref); return n; });
  const rowMenu: FlyoutItem[] = [
    { label: ACTION_LABEL.update, icon: menuIcons.manage },
    { label: ACTION_LABEL.reduce, icon: menuIcons.reduce },
    { label: ACTION_LABEL.withdraw, icon: menuIcons.withdraw },
  ];
  const actionFor = (label: string) => (Object.keys(ACTION_LABEL) as Action[]).find(a => ACTION_LABEL[a] === label)!;

  const checkbox = (checked: boolean, onChange: () => void, label: string) => (
    <input type="checkbox" checked={checked} onChange={onChange} aria-label={label}
      className="size-[18px] cursor-pointer align-middle" style={{ accentColor: '#1360d2' }} />
  );

  return (
    <PageShell
      title="Manage Guarantee"
      badge={`Account ${account.accountNo}`}
      crumbs={[{ label: 'Duty Account', onClick: onBackToListing }, { label: 'Manage Guarantee' }]}
      onHome={onHome}
      onBackToListing={onBackToListing}
      rightContent={<PrimaryButton disabled={batch.length === 0} onClick={submit}>Submit{batch.length ? ` (${batch.length})` : ''}</PrimaryButton>}
    >
      <AccountInfoSection
        account={account}
        action={<PrimaryButton onClick={() => setView({ kind: 'new' })}>{plus} Create New Guarantee</PrimaryButton>}
      />

      <Section
        title="Existing Guarantees"
        info="Select one or more guarantees, then choose Update, Reduce or Withdraw. Each change is added to Changes to Submit below — nothing is sent until you click Submit."
        action={chosen.length > 0 && (
          <div className="flex items-center gap-[12px] flex-wrap">
            <span className="text-[16px] text-[#455174]">{chosen.length} selected</span>
            <SecondaryButton onClick={() => start('update', chosen)}>{menuIcons.manage} Update</SecondaryButton>
            <SecondaryButton onClick={() => start('reduce', chosen)}>{menuIcons.reduce} Reduce</SecondaryButton>
            <SecondaryButton onClick={() => start('withdraw', chosen)}>{menuIcons.withdraw} Withdraw</SecondaryButton>
          </div>
        )}
      >
        <SimpleTable
          columns={[
            { label: '', width: 56 }, { label: 'Guarantee Type' }, { label: 'Guarantee Ref. No.' }, { label: 'Bank' },
            { label: 'Amount', align: 'right' }, { label: 'Action', align: 'center', width: 90 },
          ]}
          headerCells={{ 0: checkbox(allChecked, () => setSelected(allChecked ? new Set() : new Set(account.guarantees.map(g => g.refNo))), 'Select all guarantees') }}
          rows={account.guarantees.map(g => [
            checkbox(selected.has(g.refNo), () => toggle(g.refNo), `Select guarantee ${g.refNo}`),
            g.type,
            <span className="inline-flex items-center gap-[8px]">
              {g.refNo}
              {pendingBy.has(g.refNo) && (
                <span className="text-[13px] px-[8px] py-[2px] rounded-[4px]" style={{ background: 'rgba(19,96,210,0.10)', color: '#1360d2', fontWeight: 500 }}>
                  {pendingBy.get(g.refNo)} added
                </span>
              )}
            </span>,
            g.bank ?? '—',
            <Amount value={g.amount} />,
            <ThreeDotsButton label={`Actions for ${g.refNo}`} onClick={e => setMenu({ guarantee: g, at: anchorFrom(e, 3, 230) })} />,
          ])}
          empty="No guarantees on this account yet. Use Create New Guarantee to add one."
        />
      </Section>

      <ChangesSection rows={batch} onRemove={remove} showEmpty />

      {menu && (
        <RowFlyout items={rowMenu} at={menu.at} width={230}
          onPick={label => start(actionFor(label), [menu.guarantee])} onClose={() => setMenu(null)} />
      )}

      {notice && (
        <MessageDialog tone="warning" title="Message" message={SETTLE_MSG}
          onOk={() => { setView({ kind: notice.action, guarantees: notice.guarantees }); setNotice(null); }}
          onCancel={() => setNotice(null)} />
      )}
    </PageShell>
  );
}
