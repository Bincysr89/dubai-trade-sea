import { useState } from 'react';
import DutyAccountListingPage, { type AccountAction, type ListingTab, type RequestAction } from './DutyAccountListingPage';
import AccountDetailsPage from './AccountDetailsPage';
import NewAccountPage from './NewAccountPage';
import ManageContactDetailsPage from './ManageContactDetailsPage';
import ManageAccountUsersPage from './ManageAccountUsersPage';
import ManageGuaranteeFlow from './ManageGuaranteeFlow';
import { PaymentFlow, ReceiptModal, RequestAuditHistoryPage, RequestDetailsModal, WithdrawRequestPage } from './RequestScreens';
import { MessageDialog } from './DutyAccountUI';
import {
  ACCOUNTS, INITIAL_REQUESTS, findAccount, newReceipt, nowLabel, todayLabel,
  type Account, type AccountRequest, type Receipt, type RequestGuarantee, type RequestStatus,
} from './dutyAccountData';

type View =
  | { kind: 'listing' }
  | { kind: 'create' }
  | { kind: 'view'; account: Account }
  | { kind: 'contact'; account: Account }
  | { kind: 'users'; account: Account }
  | { kind: 'manageGuarantee'; account: Account }
  | { kind: 'withdrawRequest'; requestNo: string }
  | { kind: 'audit'; requestNo: string };

type NewRequest = { requestNo: string; requestType: string; status?: RequestStatus; guarantee?: RequestGuarantee };

const USER = 'aeouat1';

/** Request Duty Account — Accounts / All Requests listing and every account and request sub-flow. */
export default function DutyAccountFlow({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<View>({ kind: 'listing' });
  const [tab, setTab] = useState<ListingTab>('accounts');
  const [requests, setRequests] = useState<AccountRequest[]>(INITIAL_REQUESTS);
  // Popups opened from the All Requests row menu.
  const [detailsReq, setDetailsReq] = useState<AccountRequest | null>(null);
  const [receiptReq, setReceiptReq] = useState<AccountRequest | null>(null);
  const [payReq, setPayReq] = useState<AccountRequest | null>(null);
  const [withdrawConfirm, setWithdrawConfirm] = useState<AccountRequest | null>(null);

  const toListing = () => setView({ kind: 'listing' });
  const toRequests = () => { setTab('requests'); setView({ kind: 'listing' }); };
  const byNo = (no: string) => requests.find(r => r.requestNo === no);

  // Newest requests first, so a just-submitted request is at the top of All Requests.
  const addRequests = (account: Account, items: NewRequest[]) => {
    const date = todayLabel();
    setRequests(r => [
      ...items.map((i): AccountRequest => {
        const status = i.status ?? 'Under Processing';
        return {
          requestNo: i.requestNo, requestType: i.requestType, accountNo: account.accountNo, accountName: account.accountName,
          accountType: account.accountType, status, statusRemarks: '', requestDate: date, requestedBy: USER, guarantee: i.guarantee,
          history: [{ date: nowLabel(), action: 'Request Created', status, by: USER, remarks: '—' }],
        };
      }).reverse(),
      ...r,
    ]);
  };

  const updateRequest = (requestNo: string, patch: (r: AccountRequest) => Partial<AccountRequest>) => {
    setRequests(list => list.map(r => (r.requestNo === requestNo ? { ...r, ...patch(r) } : r)));
  };

  const markPaid = (requestNo: string, receipt: Receipt) => updateRequest(requestNo, r => ({
    status: 'Completed',
    statusRemarks: 'Payment Completed.',
    receipt,
    guarantee: r.guarantee && { ...r.guarantee, refNo: receipt.receiptNo.replace('-', '') },
    history: [...r.history, { date: nowLabel(), action: 'Payment Completed', status: 'Completed', by: USER, remarks: `Receipt ${receipt.receiptNo}` }],
  }));

  const onAccountAction = (action: AccountAction, account: Account) => {
    setView({ kind: action, account });
  };

  const onRequestAction = (action: RequestAction, r: AccountRequest) => {
    if (action === 'details') setDetailsReq(r);
    else if (action === 'receipt') setReceiptReq(r);
    else if (action === 'pay') setPayReq(r);
    else if (action === 'withdraw') setWithdrawConfirm(r);
    else setView({ kind: 'audit', requestNo: r.requestNo });
  };

  switch (view.kind) {
    case 'create':
      return (
        <NewAccountPage onBack={toListing} onHome={onClose} onViewRequests={toRequests}
          onSubmitted={(no, accountType) => addRequests(
            // The account number is issued on approval, so the request carries a placeholder account.
            { ...ACCOUNTS[0], accountNo: 'Pending', accountType },
            [{ requestNo: no, requestType: 'New Account', status: 'Submitted' }],
          )} />
      );
    case 'view':
      return <AccountDetailsPage account={view.account} onBack={toListing} onHome={onClose} />;
    case 'contact':
      return (
        <ManageContactDetailsPage account={view.account} onBack={toListing} onHome={onClose}
          onSubmitted={no => addRequests(view.account, [{ requestNo: no, requestType: 'Modify Account Contact' }])} onViewRequests={toRequests} />
      );
    case 'users':
      return (
        <ManageAccountUsersPage account={view.account} onBack={toListing} onHome={onClose}
          onSubmitted={no => addRequests(view.account, [{ requestNo: no, requestType: 'Manage Account User' }])} onViewRequests={toRequests} />
      );
    case 'manageGuarantee':
      return (
        <ManageGuaranteeFlow account={view.account} onBackToListing={toListing} onHome={onClose}
          onSubmitted={items => addRequests(view.account, items)} onPaid={markPaid} onViewRequests={toRequests} />
      );
    case 'withdrawRequest': {
      const r = byNo(view.requestNo);
      if (!r) break;
      return (
        <WithdrawRequestPage
          request={r}
          onBack={() => { setTab('requests'); toListing(); }}
          onHome={onClose}
          onWithdrawn={remarks => updateRequest(r.requestNo, cur => ({
            status: 'Withdrawn',
            statusRemarks: remarks,
            history: [...cur.history, { date: nowLabel(), action: 'Request Withdrawn', status: 'Withdrawn', by: USER, remarks }],
          }))}
        />
      );
    }
    case 'audit': {
      const r = byNo(view.requestNo);
      if (!r) break;
      return <RequestAuditHistoryPage request={r} onBack={() => { setTab('requests'); toListing(); }} onHome={onClose} />;
    }
  }

  const receiptAccount = receiptReq && findAccount(receiptReq.accountNo);
  const payAccount = payReq && findAccount(payReq.accountNo);

  return (
    <>
      <DutyAccountListingPage
        accounts={ACCOUNTS}
        requests={requests}
        tab={tab}
        onTabChange={setTab}
        onBack={onClose}
        onCreate={() => setView({ kind: 'create' })}
        onAccountAction={onAccountAction}
        onRequestAction={onRequestAction}
      />
      {detailsReq && <RequestDetailsModal request={byNo(detailsReq.requestNo) ?? detailsReq} onClose={() => setDetailsReq(null)} />}
      {receiptReq?.receipt && receiptAccount && (
        <ReceiptModal account={receiptAccount} receipt={receiptReq.receipt} onClose={() => setReceiptReq(null)} />
      )}
      {payReq && payAccount && (
        <PaymentFlow
          amount={payReq.guarantee?.proposed ?? '0.00'}
          onCancel={() => setPayReq(null)}
          onPaid={() => {
            const receipt = newReceipt(payAccount, payReq.guarantee?.proposed ?? '0.00');
            markPaid(payReq.requestNo, receipt);
            setPayReq(null);
            setReceiptReq({ ...payReq, receipt });
          }}
        />
      )}
      {withdrawConfirm && (
        <MessageDialog
          tone="confirm"
          title="Confirmation"
          message="Are you sure to withdraw the Request?"
          okLabel="OK"
          cancelLabel="Cancel"
          onCancel={() => setWithdrawConfirm(null)}
          onOk={() => { setView({ kind: 'withdrawRequest', requestNo: withdrawConfirm.requestNo }); setWithdrawConfirm(null); }}
        />
      )}
    </>
  );
}
