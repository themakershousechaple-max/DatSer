# Supabase Integration (Quick Overview)

This app initializes the Supabase client in `src/lib/supabase.js` using Vite environment variables and falls back to a "Demo Mode" when they're missing. This keeps the site working on GitHub Pages even without credentials.

Client creation:

```js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
```

How it's used:
- `src/context/AppContext.jsx` checks `isSupabaseConfigured = !!supabase`.
- When configured, it loads data via Supabase (RPC/select) and writes via inserts/updates.
- When not configured, it uses safe mock data so the UI still renders.

Deployment secrets:
- GitHub Actions injects `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (repository secrets) at build time.
- Never use the `service_role` key in the frontend.

Data model:
- The app reads the current month table (default `"November_2025"`). Create it in Supabase and add a simple Row Level Security policy allowing `SELECT` (for anon key) to see names.

Local development:
Create `./.env.local` with:
```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```