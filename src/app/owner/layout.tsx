import { OwnerBottomNav } from '@/components/AppBottomNav';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <OwnerBottomNav />
    </>
  );
}
