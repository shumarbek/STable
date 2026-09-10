import { getAllAccounts } from "@/features/accounts/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountsList } from "@/features/accounts/AccountsList";
import { CreateAccountDialog } from "@/features/accounts/CreateAccountDialog";

export default async function AccountsSettingsPage() {
  const accounts = await getAllAccounts();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Hisoblarim</h1>
        <CreateAccountDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Barcha hisoblar</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountsList accounts={accounts} />
        </CardContent>
      </Card>
    </div>
  );
}
