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
import { SignUpForm } from "@/features/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Ro&apos;yxatdan o&apos;tish</CardTitle>
        <CardDescription>
          Bir necha soniyada hisob yarating va moliyaviy nazoratni boshlang.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <GoogleButton />
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">yoki</span>
          <Separator className="flex-1" />
        </div>
        <SignUpForm />
        <p className="text-center text-sm text-muted-foreground">
          Hisobingiz bormi?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Kirish
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
