import { createClient } from '@/lib/supabase/server';

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{user?.email}</span>
        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
          <span className="text-sm font-medium text-indigo-700">
            {user?.email?.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
}
