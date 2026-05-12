import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <main className="urbanix-container flex min-h-[70vh] items-center justify-center py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" action="/">
            <Input defaultValue="owner@urbanix.store" name="email" type="email" />
            <Input defaultValue="urbanix-demo" name="password" type="password" />
            <Button type="submit" variant="secondary">Sign In</Button>
            <p className="text-xs text-muted-foreground">Demo login for local admin testing.</p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
