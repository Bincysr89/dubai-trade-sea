import { Amount, InfoGrid, PageShell, Section, SimpleTable, StatusChip } from './DutyAccountUI';
import type { Account } from './dutyAccountData';

/** "View Account Details" — full account record opened from the Accounts row menu. */
export default function AccountDetailsPage({ account, onBack, onHome }: { account: Account; onBack: () => void; onHome: () => void }) {
  const c = account.contact;
  return (
    <PageShell
      title="Account Details"
      badge={`Account ${account.accountNo}`}
      crumbs={[{ label: 'Duty Account', onClick: onBack }, { label: 'Account Details' }]}
      onHome={onHome}
      onBackToListing={onBack}
    >
      <Section title="Account Details">
        <InfoGrid items={[
          ['Account Type', account.accountType],
          ['Account', `${account.accountNo} - ${account.accountName}`],
          ['Account Category', account.accountCategory],
          ['Account Status', <StatusChip status={account.status} />],
          ['Business Code', account.businessCode],
          ['Consignee Code', `I - ${account.holderCode}`],
          ['Consignee Name', account.accountName],
          ['Contact Person', c.person],
          ['Mobile', c.mobile],
          ['Email', c.email],
          ['Phone', c.phone],
          ['Email 2', c.email2],
          ['Phone 2', c.phone2],
          ['Email 3', c.email3],
          ['Phone 3', c.phone3],
          ['Remarks', account.remarks],
        ]} />
      </Section>

      <Section title="Balance Summary">
        <InfoGrid cols={3} items={[
          ['Total Guarantee Amount', <Amount value={account.totalGuarantee} />],
          ['Used Guarantee Amount', <Amount value={account.usedGuarantee} />],
          ['Available Balance', <Amount value={account.availableBalance} strong />],
        ]} />
      </Section>

      <Section title="Guarantee Details">
        <SimpleTable
          columns={[{ label: 'Guarantee Type' }, { label: 'Guarantee Ref. No.' }, { label: 'Amount', align: 'right' }, { label: 'Bank' }, { label: 'Guarantee Status' }]}
          rows={account.guarantees.map(g => [g.type, g.refNo, <Amount value={g.amount} />, g.bank ?? '—', <StatusChip status={g.status} />])}
          empty="No guarantees on this account"
        />
      </Section>

      <Section title="Virtual Account Details">
        <SimpleTable
          columns={[{ label: 'Bank' }, { label: 'Virtual Account No.' }, { label: 'IBAN' }]}
          rows={[[account.virtualAccount.bank, account.virtualAccount.accountNo, account.virtualAccount.iban]]}
        />
      </Section>

      <Section title="Account Users">
        <SimpleTable
          columns={[{ label: 'Consignee Type' }, { label: 'Consignee Code' }, { label: 'Consignee Name' }, { label: 'User Type' }]}
          rows={account.users.map(u => [u.type, u.code, u.name, u.userType || '—'])}
        />
      </Section>
    </PageShell>
  );
}
