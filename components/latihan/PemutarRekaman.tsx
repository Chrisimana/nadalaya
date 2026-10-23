"use client";

import { Headphones, Pause } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

export function PemutarRekaman({ blob }: { blob: Blob }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [memutar, setMemutar] = useState(false);

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    const url = URL.createObjectURL(blob);
    el.src = url;
    return () => {
      el.pause();
      el.removeAttribute("src");
      el.load();
      URL.revokeObjectURL(url);
    };
  }, [blob]);

  async function alih() {
    const el = audio.current;
    if (!el) return;
    if (memutar) {
      el.pause();
      return;
    }
    el.currentTime = 0;
    try {
      await el.play();
    } catch {
      setMemutar(false);
    }
  }

  return (
    <>
      <audio
        ref={audio}
        preload="auto"
        onPlay={() => setMemutar(true)}
        onPause={() => setMemutar(false)}
        onEnded={() => setMemutar(false)}
      />
      <Button
        varian="garis"
        onClick={alih}
        ikon={
          memutar ? (
            <Pause className="size-4" aria-hidden="true" />
          ) : (
            <Headphones className="size-4" aria-hidden="true" />
          )
        }
      >
        {memutar ? "Jeda" : "Dengarkan Ulang"}
      </Button>
    </>
  );
}
