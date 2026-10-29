import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SDGs 노래 만들기",
  description: "지속가능발전목표(SDGs) 17개 중 하나를 골라 나만의 노래를 만들어 보세요.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
