@AGENTS.md

# Claude Code Skill: Next.js v16 + Prisma + Neon + Tailwind + MUI

## Purpose

This skill scaffolds and governs a full-stack TypeScript project using:

* **Next.js v16 (App Router)**
* **Prisma ORM**
* **Neon (serverless Postgres)**
* **Tailwind CSS + Material UI (MUI hybrid design system)**

It enforces clean architecture, modularity, and maintainable patterns suitable for production-grade applications.

---

## 1. Project Structure

```
/app
  /(public)
    page.tsx
  /(auth)
    login/page.tsx
  /dashboard
    page.tsx
    layout.tsx

/components
  /ui        # Reusable UI primitives (buttons, inputs)
  /mui       # MUI-wrapped components
  /layouts   # Layout components

/lib
  /db        # Prisma client
  /services  # Business logic
  /utils     # Helpers

/prisma
  schema.prisma
  migrations/

/styles
  globals.css
  theme.ts   # MUI theme config

/hooks
  useAuth.ts
  useFetch.ts

/types
  index.ts

/config
  env.ts

/tests
  unit/
  integration/

/public

/middleware.ts
/next.config.ts
/prisma.config.ts
/tsconfig.json
```

---

## 2. Core Stack Setup

### Next.js

* Use **App Router exclusively**
* Prefer **Server Components** by default
* Use **Client Components only when needed** (interactivity, hooks)

### Prisma + Neon

* Use connection pooling via Neon
* Keep Prisma client singleton:

```ts
// /lib/db/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

## 3. Environment Configuration

```
DATABASE_URL=
DIRECT_URL=  # for migrations
NEXT_PUBLIC_APP_URL=
```

Use a typed env loader:

```ts
// /config/env.ts
import { z } from 'zod';

export const env = z.object({
  DATABASE_URL: z.string().url(),
}).parse(process.env);
```

---

## 4. Database Design (Prisma Best Practices)

* Use **explicit relations**
* Prefer **UUIDs over auto-increment**
* Separate concerns (User, Session, Domain Models)

Example:

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  createdAt DateTime @default(now())
}
```

---

## 5. Service Layer Pattern

Never call Prisma directly inside components.

```ts
// /lib/services/user.service.ts
import { prisma } from '@/lib/db/prisma';

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}
```

---

## 6. API & Server Actions

Prefer **Server Actions** over API routes unless:

* External access is required
* Webhooks are needed

```ts
// app/actions/createUser.ts
'use server';

import { prisma } from '@/lib/db/prisma';

export async function createUser(data: { email: string }) {
  return prisma.user.create({ data });
}
```

---

## 7. UI Strategy (Tailwind + MUI Hybrid)

### Rules:

* Tailwind = layout, spacing, responsiveness
* MUI = complex components (dialogs, tables, inputs)
* Avoid style conflicts by using MUI `sx` minimally

### Example:

```tsx
import { Button } from '@mui/material';

export function CTAButton() {
  return (
    <Button className="mt-4 w-full" variant="contained">
      Continue
    </Button>
  );
}
```

---

## 8. Theming (MUI + Tailwind Sync)

```ts
// /styles/theme.ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#4f46e5',
    },
  },
});
```

* Keep Tailwind config aligned with MUI colors
* Define shared tokens if needed

---

## 9. State Management

* Prefer **React Server State**
* Use:

  * `useState` (local)
  * `useTransition` (UX)
  * `React Query` (if client caching needed)

Avoid global state unless necessary.

---

## 10. Error Handling

* Centralize error types
* Never expose raw DB errors

```ts
export class AppError extends Error {
  constructor(message: string, public code = 500) {
    super(message);
  }
}
```

---

## 11. Validation

Use **Zod everywhere**:

* API inputs
* Server actions
* Forms

```ts
import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.string().email(),
});
```

---

## 12. Clean Code Guidelines

### Naming

* Functions: verbs (`getUser`, `createOrder`)
* Components: PascalCase
* Files: kebab-case

### Rules

* Max 1 responsibility per function
* No business logic in UI
* No DB calls in UI
* Keep files < 200 lines where possible

---

## 13. Testing Strategy

* Unit: services
* Integration: DB + API
* E2E: critical flows

Tools:

* Vitest / Jest
* Playwright

---

## 14. Performance Best Practices

* Use streaming + Suspense
* Optimize images (`next/image`)
* Avoid unnecessary client components
* Use caching:

```ts
export const revalidate = 60;
```

---

## 15. Security

* Validate all inputs
* Use parameterized queries (Prisma default)
* Store secrets in env
* Implement rate limiting (middleware)

---

## 16. Deployment Notes

* Use Neon connection pooling
* Run Prisma migrations in CI/CD
* Enable edge where beneficial

---

## 17. Development Workflow

1. Define schema (Prisma)
2. Generate client
3. Implement service layer
4. Add server actions
5. Build UI
6. Validate + test

---

## 18. Anti-Patterns to Avoid

* ❌ Calling Prisma inside React components
* ❌ Mixing Tailwind + MUI styles chaotically
* ❌ Large monolithic files
* ❌ Business logic in pages
* ❌ Overusing global state

---

## Outcome

This skill ensures:

* Scalable architecture
* Clean separation of concerns
* Strong typing and validation
* Production-ready patterns for modern full-stack apps
