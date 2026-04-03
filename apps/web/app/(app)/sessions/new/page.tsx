'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateSession } from '../../../../lib/hooks/useSession.js';

const schema = z.object({
  name: z.string().min(2).max(80),
  maxPlayers: z.number().int().min(2).max(8),
});

type FormData = z.infer<typeof schema>;

export default function CreateSessionPage() {
  const router = useRouter();
  const createSession = useCreateSession();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', maxPlayers: 6 },
  });

  async function onSubmit(data: FormData) {
    const session = await createSession.mutateAsync(data);
    router.push(`/sessions/${session.id}`);
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Create Session</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Session Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('name')}
            type="text"
            placeholder="e.g. The Lost Mine"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Players</label>
          <select
            {...register('maxPlayers', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          {errors.maxPlayers && <p className="mt-1 text-xs text-red-500">{errors.maxPlayers.message}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || createSession.isPending}
            className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting || createSession.isPending ? 'Creating...' : 'Create Session'}
          </button>
          <Link
            href="/sessions"
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-center text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
