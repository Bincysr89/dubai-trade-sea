import { useState } from 'react';
import {
  FieldGrid, FloatField, FloatSelect, InfoGrid, PageShell, PrimaryButton, ResultCard, Section, SecondaryButton,
  ClientProfileInfo, resetIcon,
} from './DutyAccountUI';
import { ACCOUNTS, ACCOUNT_CATEGORIES, ACCOUNT_HOLDER_TYPES, ACCOUNT_TYPES, newRequestNo } from './dutyAccountData';

type Form = {
  accountType: string; accountCategory: string; holderType: string; holderCode: string; remarks: string;
  phone2: string; phone3: string; email2: string; email3: string; person: string; designation: string;
};

// The logged-in trader's own profile supplies the primary contact and holder name.
const PROFILE = ACCOUNTS[0];
const EMPTY: Form = {
  accountType: '', accountCategory: '', holderType: '', holderCode: '', remarks: '',
  phone2: '', phone3: '', email2: '', email3: '', person: PROFILE.contact.person, designation: PROFILE.contact.designation,
};

/** "Create New Account" — request a new duty account (Standing Guarantee, Credit (CDR) or Debit). */
export default function NewAccountPage({ onBack, onHome, onSubmitted, onViewRequests }: {
  onBack: () => void;
  onHome: () => void;
  onSubmitted: (requestNo: string, accountType: string) => void;
  onViewRequests: () => void;
}) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [requestNo, setRequestNo] = useState<string | null>(null);
  const set = (k: keyof Form) => (v: string) => setForm(f => ({ ...f, [k]: v }));
  const c = PROFILE.contact;

  // Prototype: no blocking validation — blanks fall back to sensible defaults.
  const submit = () => {
    const no = newRequestNo();
    const type = form.accountType || 'Credit Account (CDR)';
    setForm(f => ({ ...f, accountType: type, accountCategory: f.accountCategory || 'Standard', holderType: f.holderType || PROFILE.holderType }));
    setRequestNo(no);
    onSubmitted(no, type);
  };

  if (requestNo) {
    return (
      <PageShell
        title="Create New Account"
        crumbs={[{ label: 'Duty Account', onClick: onBack }, { label: 'Request Submitted' }]}
        onHome={onHome}
        resultPage
      >
        <ResultCard
          heading="New Account Request Submitted Successfully"
          message="Your new account request has been submitted successfully and is currently under processing. The account number will be issued once Dubai Customs approves the request."
          note={<>All email messages related to this request will be sent to <strong>{c.email}</strong> for <strong>{PROFILE.businessCode}</strong>.</>}
          details={[
            ['Request No.', requestNo],
            ['Account Type', form.accountType],
            ['Account Category', form.accountCategory],
            ['Account Holder', `${form.holderType} ${form.holderCode || PROFILE.holderCode} ${PROFILE.accountName}`],
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
      title="Create New Account"
      crumbs={[{ label: 'Duty Account', onClick: onBack }, { label: 'Create New Account' }]}
      onHome={onHome}
      onBackToListing={onBack}
      rightContent={(
        <div className="flex items-center gap-[12px]">
          <SecondaryButton onClick={() => setForm(EMPTY)}>{resetIcon} Reset</SecondaryButton>
          <PrimaryButton onClick={submit}>Submit</PrimaryButton>
        </div>
      )}
    >
      <Section title="Account Information">
        <FieldGrid>
          <FloatSelect label="Account Type" required value={form.accountType} options={ACCOUNT_TYPES} onChange={set('accountType')} />
          <FloatSelect label="Account Category" required value={form.accountCategory} options={ACCOUNT_CATEGORIES} onChange={set('accountCategory')} />
          <FloatSelect label="Account Holder Type" required value={form.holderType} options={ACCOUNT_HOLDER_TYPES} onChange={set('holderType')} />
          <FloatField label="Account Holder Code" required value={form.holderCode} onChange={set('holderCode')} />
          <FloatField label="Account Holder Name" value={PROFILE.accountName} readOnly />
          <div className="md:col-span-2">
            <FloatField label="Remarks" value={form.remarks} onChange={set('remarks')} placeholder="Any additional information for Dubai Customs" />
          </div>
        </FieldGrid>
      </Section>

      <Section
        title="Primary Contact"
        info={<ClientProfileInfo />}
      >
        <InfoGrid items={[
          ['Country', c.country],
          ['State/Emirate', c.emirate],
          ['P.O. Box No.', c.poBox],
          ['Mobile No.', c.mobile],
          ['Address', c.address],
          ['Telephone 1', c.phone],
          ['Email Address 1', c.email],
        ]} />
      </Section>

      <Section title="Secondary Contact">
        <FieldGrid>
          <FloatField label="Telephone 2" required value={form.phone2} onChange={set('phone2')} />
          <FloatField label="Telephone 3" value={form.phone3} onChange={set('phone3')} />
          <FloatField label="Email Address 2" required value={form.email2} onChange={set('email2')} />
          <FloatField label="Email Address 3" value={form.email3} onChange={set('email3')} />
          <FloatField label="Contact Person" required value={form.person} onChange={set('person')} />
          <FloatField label="Contact Designation" required value={form.designation} onChange={set('designation')} />
        </FieldGrid>
      </Section>
    </PageShell>
  );
}
