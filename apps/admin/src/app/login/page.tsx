import { signIn } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/brand-logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <BrandLogo />
        </div>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Admin Sign In</CardTitle>
            <p className="text-sm text-muted-foreground">Sign in to manage your Urbanix store.</p>
          </CardHeader>
          <CardContent>
            {params.error && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Invalid email or password. Please try again.
              </div>
            )}
            <form action={signIn} className="grid gap-3">
              <Input
                autoComplete="email"
                autoFocus
                name="email"
                placeholder="urbanixstore.official@gmail.com"
                required
                type="email"
              />
              <Input
                autoComplete="current-password"
                name="password"
                placeholder="Password"
                required
                type="password"
              />
              <Button className="w-full" type="submit">
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
