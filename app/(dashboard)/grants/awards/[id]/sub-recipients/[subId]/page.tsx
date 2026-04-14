import { grantsRepo } from '@/lib/core';
import { SubRecipientDetailView } from './_components/SubRecipientDetailView';

interface SubRecipientDetailPageProps {
  params: Promise<{ id: string; subId: string }>;
}

export default async function SubRecipientDetailPage({ params }: SubRecipientDetailPageProps) {
  const { id, subId } = await params;
  const [award, detail] = await Promise.all([
    grantsRepo.getAward(id),
    grantsRepo.getSubRecipientDetail(id, subId),
  ]);

  return <SubRecipientDetailView award={award} detail={detail} />;
}
