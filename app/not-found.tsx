import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-4xl font-extrabold mb-4">404 - Page Not Found</h2>
      <p className="text-muted-foreground mb-8">The requested page or resource could not be found.</p>
      <Link href="/dashboard">
        <Button>Return to Dashboard</Button>
      </Link>
    </div>
  );
}
