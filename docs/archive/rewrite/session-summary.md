# Nova Stack Rewrite — Session Summary

## What We Accomplished Today

### 1. PocketBase Schema Creation Fix

**Problem:** Migrations created empty collections — only the system `id` field existed. Custom fields were missing entirely.

**Root Cause:** PocketBase v0.38.0 JS migrations require:
- `fields` array (not `schema`)
- Flattened field properties directly on the field object (not nested inside `options`)

**Before (broken):**
```javascript
migrate((app) => {
  const collection = new Collection({
    id: 'contacts_collection',
    name: 'contacts',
    type: 'base',
    system: false,
    schema: [                           // ❌ Wrong key
      {
        id: 'name_field',              // ❌ No id needed
        name: 'name',
        type: 'text',
        system: false,
        options: { min: null, max: null, pattern: '' },  // ❌ Options not used this way
      }
    ],
    listRule: '',                       // ❌ '' = deny all
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  });
  return app.save(collection);
});
```

**After (fixed):**
```javascript
migrate((app) => {
  const collection = new Collection({
    id: 'contacts_collection',
    name: 'contacts',
    type: 'base',
    system: false,
    fields: [                           // ✅ Correct key
      {
        name: 'name',
        type: 'text',
      },
      {
        name: 'email',
        type: 'email',
      },
      {
        name: 'stage',
        type: 'select',
        maxSelect: 1,                   // ✅ Flattened property
        values: ['lead', 'contacted', 'quoted', 'won', 'lost'],
      },
      {
        name: 'userId',
        type: 'relation',
        collectionId: '_pb_users_auth_',
        cascadeDelete: false,
        minSelect: 0,
        maxSelect: 1,
      },
    ],
    listRule: null,                     // ✅ null = public access
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
  });
  return app.save(collection);
});
```

### 2. Collection Access Rules Fix

**Problem:** API calls returned `400`/`403` errors even though collections had fields.

**Root Cause:** Empty string `''` for `listRule`/`viewRule` means **deny all access** in PocketBase. The frontend couldn't read any data.

**Fix:** Changed all rules from `''` to `null` (public access) across all 5 collections:
- `contacts`
- `deals`
- `tasks`
- `invoices`
- `intake_submissions`

### 3. Data Seeding

Created `pocketbase/seed.mjs` to populate the database with realistic demo data:

| Resource            | Count |
|---------------------|-------|
| Demo users          | 3     |
| Contacts            | 15    |
| Deals               | 12    |
| Tasks               | 20    |
| Invoices            | 10    |
| Intake submissions  | 8     |

**Login credentials:** `user1@demo.com` / `password123`

### 4. Frontend Fixes

#### ProtectedRoute Redirect Loop
**Problem:** `checkAuth()` was called during component render. If `isAuthenticated` was `false` on first render, it immediately redirected to `/login` with `window.location.href`, causing an infinite loop or blank page.

**Fix:** Wrapped auth check in `useEffect` with a loading state:
```tsx
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkAuth } = useAuth()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkAuth()
    setChecking(false)
  }, [checkAuth])

  if (checking) return <div>Loading...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}
```

#### Sort Field Error
**Problem:** Default sort was `-created`, but collections created via `new Collection()` don't have automatic `created`/`updated` system fields. API returned `400 Bad Request`.

**Fix:** Changed default sort from `-created` to `-id` in `usePaginatedQuery` hook.

### 5. Files Modified

| File | Change |
|------|--------|
| `pocketbase/pb_migrations/002_create_contacts.js` | Rewrote with `fields` + flattened props + `null` rules |
| `pocketbase/pb_migrations/003_create_deals.js` | Same as above |
| `pocketbase/pb_migrations/004_create_tasks.js` | Same as above |
| `pocketbase/pb_migrations/005_create_invoices.js` | Same as above |
| `pocketbase/pb_migrations/006_create_intake_submissions.js` | Same as above |
| `pocketbase/seed.mjs` | Created — seeds all demo data |
| `web/src/components/ProtectedRoute.tsx` | Fixed redirect loop with `useEffect` |
| `web/src/hooks/usePaginatedQuery.ts` | Changed default sort from `-created` to `-id` |

### Current Status

- **PocketBase Admin:** `http://localhost:8090/_/` — `admin@novastack.local` / `novastack123`
- **Web App:** `http://localhost:5173`
- **CRM page** loads contacts correctly with seeded data
- **Tasks, Invoices, Intake** pages show empty — rule propagation pending verification after restart
