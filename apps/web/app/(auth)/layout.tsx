export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-400">⚔️ LocalDungeon</h1>
          <p className="text-gray-400 mt-2">Your adventure awaits</p>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}
