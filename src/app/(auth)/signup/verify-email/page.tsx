import { MailCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResendConfirmationForm } from "@/features/auth/ResendConfirmationForm";

export default function VerifyEmailPage() {
  return (
    <Card>
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-info/10 text-info">
          <MailCheck className="size-7" />
        </div>
        <CardTitle className="text-xl">Emailingizni tasdiqlang</CardTitle>
      </CardHeader>
      <CardContent className="text-center text-sm text-muted-foreground">
        <p>
          Sizga tasdiqlash havolasi yuborildi. Emailingizni tekshiring va
          havolani bosib, hisobingizni faollashtiring.
        </p>
        <ResendConfirmationForm />
      </CardContent>
    </Card>
  );
}
