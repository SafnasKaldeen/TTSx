import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sinhala-tts",
  description:
    "This is a Sinhala text-to-speech system that uses voice cloning to create natural-sounding speech. This system is designed to convert Sinhala text into speech, making it easier for users to listen to written content in the Sinhala language. Many people can benefit from this system, including those with visual impairments, language learners, and anyone who prefers listening to text rather than reading it. This is made by the team at Voice makers, students of the University of Moratuwa Computer Science and Engineering department.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
