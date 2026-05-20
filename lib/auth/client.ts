"use client";

import { magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Better Auth React client. baseURL inferred from window.location in the browser.
 * Use the named exports below in client components; never import this file from
 * server components — use `auth` from `./server` instead.
 */
export const authClient = createAuthClient({
	plugins: [magicLinkClient()],
});

export const { signIn, signOut, useSession, getSession } = authClient;
