import { grantsRepo } from '@/lib/core';
import { AwardsListPage } from './_components/AwardsListPage';

export default async function GrantsAwardsPage() {
  const [awards, lastViewed] = await Promise.all([
    grantsRepo.listAwards(),
    grantsRepo.getLastViewedAwards(),
  ]);

  return <AwardsListPage awards={awards} lastViewed={lastViewed} />;
}
