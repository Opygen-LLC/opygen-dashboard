import AdminAccountsView from '@/components/accounts/AdminAccountsView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accounts Overview | Opygen Dashboard',
  description: 'View and manage all linked user accounts.',
};

export default function AdminAccountsPage() {
  return <AdminAccountsView />;
}
