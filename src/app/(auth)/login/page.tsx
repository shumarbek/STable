import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GoogleButton } from "@/features/auth/GoogleButton";
import { LoginForm } from "@/features/auth/LoginForm";

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Kirish</CardTitle>
        <CardDescription>
          Hisobingizga kirib, moliyaviy nazorat panelingizga o&apos;ting.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <GoogleButton />
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">yoki</span>
          <Separator className="flex-1" />
        </div>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          Hisobingiz yo&apos;qmi?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Ro&apos;yxatdan o&apos;tish
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
