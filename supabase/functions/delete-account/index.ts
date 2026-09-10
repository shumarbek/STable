// Supabase Edge Function: delete-account
//
// Removes the caller's auth.users identity (and all its sessions)
// after `delete_own_account_data` RPC has already removed the
// `public` schema rows. This must run with the service-role key
// because only the Auth Admin API can delete an auth.users row, and
// that key must never be exposed to the browser.
//
// Deploy: supabase functions deploy delete-account
// Invoke (from the app): supabase.functions.invoke("delete-account")
//   — the user's own JWT is forwarded automatically by supabase-js,
//   which this function uses to identify *who* to delete (never a
//   client-supplied user id, so a user can only ever delete their own
//   account).

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Client scoped to the caller's own JWT — used only to identify who
  // is calling, never to perform the privileged delete itself.
  const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await callerClient.auth.getUser();

  if (userError || !userData?.user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = userData.user.id;

  // Admin client (service role) — the only client allowed to delete
  // an auth.users row. Scoped to exactly the authenticated caller's
  // own id; a user can never pass another user's id to this function.
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

  if (deleteError) {
    return new Response(
      JSON.stringify({ error: `Failed to delete account: ${deleteError.message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
