import { createBrowserClient } from '@supabase/ssr';

// ponytail: untyped like supabase-server.ts — hand-written Database types don't
// satisfy supabase-js insert/update inference (yields `never`). Re-add <Database>
// only if we switch to CLI-generated types.
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
