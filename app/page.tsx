"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);

        // 🔥 redirect to matches page
        router.push("/matches");
      }
    });

    const { data: listener } =
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser(session.user);

          // 🔥 redirect after login
          router.push("/matches");
        }
      });

    return () => listener.subscription.unsubscribe();
  }, [router]);

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <button
          onClick={signIn}
          className="px-4 py-2 border rounded"
        >
          Sign in with Google
        </button>
      </main>
    );
  }

  return null;
}