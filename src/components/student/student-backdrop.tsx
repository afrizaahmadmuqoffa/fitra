import * as React from "react";

export function StudentBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#f7f6ef]">
      <div className="absolute -left-32 -top-28 size-[24rem] rounded-full bg-[#bfead4]/70 blur-3xl" />
      <div className="absolute right-[-9rem] top-[18%] size-[22rem] rounded-full bg-[#ffd8bf]/70 blur-3xl" />
      <div className="absolute bottom-[-12rem] left-[18%] size-[26rem] rounded-full bg-[#d9d4fb]/60 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(23,53,47,.30) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}
