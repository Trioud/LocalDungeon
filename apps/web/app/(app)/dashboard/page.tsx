'use client';

import { useAuthStore } from '@/lib/stores/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="text-center py-20">
      <h1 className="text-3xl font-bold text-yellow-400 mb-4">
        Welcome, {user?.username ?? 'Adventurer'}! Your adventures await.
      </h1>
      <p className="text-gray-400">
        Your journey begins here. Choose your path wisely.
      </p>
    </div>
  );
}
