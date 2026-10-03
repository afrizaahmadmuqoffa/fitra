"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/actions/auth";
import { jalankanAction } from "@/lib/action-helpers";
import { toast } from "sonner";

export function SignOutItem() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  return (
    <DropdownMenuItem
      variant="destructive"
      disabled={pending}
      onSelect={async () => {
        setPending(true);
        const result = await jalankanAction(() => signOutAction());
        setPending(false);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success("Anda telah keluar", {
          description: "Sesi guru ditutup di perangkat ini.",
        });
        router.replace("/masuk");
        router.refresh();
      }}
    >
      Keluar
    </DropdownMenuItem>
  );
}