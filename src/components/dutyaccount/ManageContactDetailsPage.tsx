import { useState } from 'react';
import {
  AccountInfoSection, FieldGrid, FloatField, InfoGrid, Modal, PageShell, PrimaryButton, ResultCard, Section, SecondaryButton,
  SubHeading, menuIcons,
  ClientProfileInfo, resetIcon,
} from './DutyAccountUI';
import { holderLabel, newRequestNo, type Account } from './dutyAccountData';

type Secondary = { phone2: string; phone3: string; email2: string; email3: string; person: string; designation: string };


export default function ManageContactDetailsPage({ account, onBack, onHome, onSubmitted, onViewRequests }: {
  account: Account;
  onBack: () => void;
  onHome: () => void;
  onSubmitted: (requestNo: string) => void;
  onViewRequests: () => void;
}) {
  const c = account.contact;
  const initial: Secondary = {
    phone2: c.phone2, phone3: c.phone3, email2: c.email2, email3: c.email3, person: c.person, designation: c.designation,
  };
  const [form, setForm] = useState<Secondary>(initial);
  const [requestNo, setRequestNo] = useState<string | null>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const set = (k: keyof Secondary) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  // Prototype: no blocking validation — submit always moves forward.
  const submit = () => {
    const no = newRequestNo();
    setRequestNo(no);
    onSubmitted(no);
  };

  if (requestNo) {
    return (
      <PageShell
        title="Manage Contact Details"
        badge={`Account ${account.accountNo}`}
        crumbs={[{ label: 'Duty Account', onClick: onBack }, { label: 'Request Submitted' }]}
        onHome={onHome}
        resultPage
      >
        <ResultCard
          heading="Modify Account Contact Request Submitted Successfully"
          message="Your Modify Account Contact request has been submitted successfully and is currently under processing. The updated contact details take effect once Dubai Customs approves the request."
          note={<>All email messages related to this request will be sent to <strong>{c.email}</strong> for <strong>{account.businessCode}</strong>.</>}
          details={[
            ['Request No.', requestNo],
            ['Account Type', account.accountType],
            ['Account No.', account.accountNo],
            ['Account Holder', holderLabel(account)],
          ]}
          actions={(
            <>
              <SecondaryButton onClick={onBack}>Back to Listing</SecondaryButton>
              <SecondaryButton onClick={onViewRequests}>View All Requests</SecondaryButton>
              <PrimaryButton onClick={() => setPrintOpen(true)}>{menuIcons.print} View &amp; Print</PrimaryButton>
            </>
          )}
        />

        {printOpen && (
          <Modal
            title="Account Detail"
            onClose={() => setPrintOpen(false)}
            footer={(
              <>
                <SecondaryButton onClick={() => setPrintOpen(false)}>Close</SecondaryButton>
                <PrimaryButton onClick={() => window.print()}>{menuIcons.print} Print</PrimaryButton>
              </>
            )}
          >
            <SubHeading>Account Information</SubHeading>
            <InfoGrid cols={3} items={[
              ['Account Type', account.accountType],
              ['Account Category', account.accountCategory],
              ['Account Holder Type', account.holderType],
              ['Account Holder', `${account.holderCode} - ${account.accountName}`],
              ['Account No.', account.accountNo],
              ['Request No.', requestNo],
            ]} />
            <hr style={{ border: 'none', borderTop: '1px solid #e8edf2' }} />
            <SubHeading>Contact Information</SubHeading>
            <InfoGrid cols={3} items={[
              ['Country', c.country],
              ['State/Emirate', c.emirate],
              ['P.O. Box No.', c.poBox],
              ['Mobile', c.mobile],
              ['Address', c.address],
              ['Telephone 1', c.phone],
              ['Telephone 2', form.phone2],
              ['Telephone 3', form.phone3],
              ['Email Address 1', c.email],
              ['Email Address 2', form.email2],
              ['Email Address 3', form.email3],
              ['Contact Person', form.person],
              ['Contact Designation', form.designation],
            ]} />
          </Modal>
        )}
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Manage Contact Details"
      badge={`Account ${account.accountNo}`}
      crumbs={[{ label: 'Duty Account', onClick: onBack }, { label: 'Manage Contact Details' }]}
      onHome={onHome}
      onBackToListing={onBack}
      rightContent={(
        <div className="flex items-center gap-[12px]">
          <SecondaryButton onClick={() => setForm(initial)}>{resetIcon} Reset</SecondaryButton>
          <PrimaryButton onClick={submit}>Submit</PrimaryButton>
        </div>
      )}
    >
      <AccountInfoSection account={account} />

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
