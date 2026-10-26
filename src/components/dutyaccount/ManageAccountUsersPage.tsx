import { useState } from 'react';
import DocumentUploadSection from '../declaration/DocumentUploadSection';
import {
  AccountInfoSection, DeleteIconButton, FloatField, FloatSelect, PageShell, PrimaryButton, ResultCard, Section,
  SecondaryButton, SimpleTable, resetIcon,
} from './DutyAccountUI';
import { ACCOUNT_HOLDER_TYPES, HOLDER_LOOKUP, holderLabel, newRequestNo, type Account, type AccountUser } from './dutyAccountData';

const DOC_TYPES = [
  { label: 'Trade License Copy of Account Owner', required: true, nature: 'Copy' },
  { label: 'Trade License Copy of Related Party', required: true, nature: 'Copy' },
  { label: 'Additional Document 1', nature: 'Any' },
  { label: 'Additional Document 2', nature: 'Any' },
];

/** Resolves an account holder code to its registered name (any code resolves in this prototype). */
function lookupName(code: string): string {
  const c = code.trim();
  return c ? (HOLDER_LOOKUP[c] ?? `TRADER ${c}`) : '';
}

export default function ManageAccountUsersPage({ account, onBack, onHome, onSubmitted, onViewRequests }: {
  account: Account;
  onBack: () => void;
  onHome: () => void;
  onSubmitted: (requestNo: string, users: AccountUser[]) => void;
  onViewRequests: () => void;
}) {
  const [holderType, setHolderType] = useState('');
  const [holderCode, setHolderCode] = useState('');
  const [added, setAdded] = useState<AccountUser[]>([]);
  const [requestNo, setRequestNo] = useState<string | null>(null);

  const name = lookupName(holderCode);
  const users = [...account.users, ...added];

  // Prototype: no blocking validation — blanks fall back to a sample account user.
  const addUser = () => {
    const sampleCode = Object.keys(HOLDER_LOOKUP).find(c => !users.some(u => u.code === c)) ?? String(50000 + users.length);
    const code = holderCode.trim() || sampleCode;
    setAdded(a => [...a, { type: holderType || 'Importer', code, name: lookupName(code), userType: '' }]);
    setHolderType('');
    setHolderCode('');
  };

  const submit = () => {
    const no = newRequestNo();
    setRequestNo(no);
    onSubmitted(no, added);
  };

  if (requestNo) {
    return (
      <PageShell
        title="Manage Account User"
        badge={`Account ${account.accountNo}`}
        crumbs={[{ label: 'Duty Account', onClick: onBack }, { label: 'Request Submitted' }]}
        onHome={onHome}
        resultPage
      >
        <ResultCard
          heading="Account User Request Submitted Successfully"
          message="Your account user request has been submitted successfully and is currently under processing. The account users will be linked to this account once Dubai Customs approves the request."
          note={<>All email messages related to this request will be sent to <strong>{account.contact.email}</strong> for <strong>{account.businessCode}</strong>.</>}
          details={[
            ['Request No.', requestNo],
            ['Account Type', account.accountType],
            ['Account No.', account.accountNo],
            ['Account Holder', holderLabel(account)],
          ]}
          actions={(
            <>
              <SecondaryButton onClick={onBack}>Back to Listing</SecondaryButton>
              <PrimaryButton onClick={onViewRequests}>View All Requests</PrimaryButton>
            </>
          )}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Manage Account User"
      badge={`Account ${account.accountNo}`}
      crumbs={[{ label: 'Duty Account', onClick: onBack }, { label: 'Manage Account User' }]}
      onHome={onHome}
      onBackToListing={onBack}
      rightContent={(
        <div className="flex items-center gap-[12px]">
          <PrimaryButton onClick={submit}>Submit</PrimaryButton>
        </div>
      )}
    >
      <AccountInfoSection account={account} />

      <Section title="Account Users" info="Enter the account holder type and code, then click Add to list the user below. Added users are linked once the request is approved.">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-[24px] gap-y-[24px] items-center">
          <FloatSelect label="Account Holder Type" required value={holderType} options={ACCOUNT_HOLDER_TYPES} onChange={setHolderType} />
          <FloatField label="Account Holder Code" required value={holderCode} onChange={setHolderCode} />
          <FloatField label="Name" value={name} readOnly />
          <div className="flex items-center gap-[12px]">
            <PrimaryButton onClick={addUser}><span style={{ fontSize: 20, lineHeight: 1 }}>+</span> Add</PrimaryButton>
            <SecondaryButton onClick={() => { setHolderType(''); setHolderCode(''); }}>{resetIcon} Reset</SecondaryButton>
          </div>
        </div>
        <div className="mt-[24px]">
          <SimpleTable
            columns={[{ label: 'Type' }, { label: 'Code' }, { label: 'Name' }, { label: 'User Type' }, { label: 'Action', align: 'center', width: 100 }]}
            rows={users.map(u => {
              const addedIndex = added.indexOf(u);
              return [
                u.type, u.code, u.name, u.userType || 'Account User',
                addedIndex >= 0
                  ? <DeleteIconButton label={`Remove ${u.name}`} message="This account user will be removed from the request." onClick={() => setAdded(a => a.filter((_, i) => i !== addedIndex))} />
                  : '',
              ];
            })}
          />
        </div>
      </Section>

      <DocumentUploadSection hideAuthority docTypes={DOC_TYPES} />
    </PageShell>
  );
}
