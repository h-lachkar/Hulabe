import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "dark" | "light" | "icon";
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
};

export function Logo({ variant = "dark", className, width, height, priority }: LogoProps) {
  if (variant === "icon") {
    return (
      <Image
        src="/icon.svg"
        alt="Hulabe"
        width={width ?? 32}
        height={height ?? 32}
        className={cn("h-8 w-8", className)}
        priority={priority}
      />
    );
  }

  const src = variant === "dark" ? "/logo-dark.svg" : "/logo-light.svg";

  return (
    <Image
      src={src}
      alt="Hulabe"
      width={width ?? 124}
      height={height ?? 32}
      className={cn("h-8 w-auto", className)}
      priority={priority}
    />
  );
}
