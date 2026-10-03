import type { Metadata } from "next";
import { AuthCallbackClient } from "./callback-client";

export const metadata: Metadata = {
  title: "Memproses Masuk",
  robots: { index: false, follow: false },
};

export default function AuthCallbackPage() {
  return <AuthCallbackClient />;
}