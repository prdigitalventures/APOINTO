import { CustomerBottomNav } from '@/components/AppBottomNav';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CustomerBottomNav />
    </>
  );
}
