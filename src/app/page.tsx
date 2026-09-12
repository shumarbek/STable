import Link from "next/link";
import { redirect } from "next/navigation";
import { Wallet, ShieldCheck, LineChart, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2 font-heading text-lg font-semibold">
          <Wallet className="size-6 text-primary" />
          STable
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" render={<Link href="/login">Kirish</Link>} />
          <Button render={<Link href="/signup">Ro&apos;yxatdan o&apos;tish</Link>} />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center md:px-12">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Shaxsiy moliyangizni to&apos;liq nazorat qiling
        </h1>
        <p className="mt-4 max-w-xl text-balance text-muted-foreground md:text-lg">
          Kirim va chiqimlaringizni aniq kategoriyalarga ajratib qayd qiling,
          haftalik hisobotlar oling va pulingiz qayerga ketayotganini bir
          qarashda ko&apos;ring.
        </p>
        <div className="mt-8 flex gap-3">
          <Button
            size="lg"
            className="h-12 px-6"
            render={<Link href="/signup">Bepul boshlash</Link>}
          />
          <Button
            variant="outline"
            size="lg"
            className="h-12 px-6"
            render={<Link href="/login">Hisobim bor</Link>}
          />
        </div>

        <div className="mt-16 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={<LineChart className="size-5" />}
            title="Aniq statistika"
            description="Kunlik, haftalik va oylik chiqim hamda kirim tahlili"
          />
          <FeatureCard
            icon={<CalendarCheck className="size-5" />}
            title="Haftalik hisobot"
            description="Har hafta avtomatik tayyorlanadigan moliyaviy hisobot"
          />
          <FeatureCard
            icon={<ShieldCheck className="size-5" />}
            title="Xavfsiz"
            description="Faqat siz o'z ma'lumotlaringizni ko'rasiz"
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border bg-card p-5 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
