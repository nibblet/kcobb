import type { Metadata } from "next";
import { Playfair_Display, Lora, Inter } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/layout/Nav";
import { Header } from "@/components/layout/Header";
import { AgeModeProvider } from "@/hooks/useAgeMode";
import { ThemeModeProvider } from "@/hooks/useThemeMode";
import { BodyModeSync } from "@/components/layout/BodyModeSync";
import { PageContextProvider } from "@/components/layout/PageContextProvider";
import { AskOverlayProvider } from "@/components/ask/AskOverlayProvider";
import { AskBar } from "@/components/ask/AskBar";
import { TellOverlayProvider } from "@/components/tell/TellOverlayProvider";
import { ageModeFromAge } from "@/lib/utils/age-mode";
import type { AgeMode, ThemeMode } from "@/types";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Keith Cobb Storybook",
  description:
    "Stories and lessons from Keith Cobb's life — a family archive.",
};

async function getInitialDisplayModes(): Promise<{
  ageMode: AgeMode;
  themeMode: ThemeMode;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("sb_profiles")
        .select("age, age_mode, theme_mode")
        .eq("id", user.id)
        .single();

      const ageMode = profile?.age_mode
        ? profile.age_mode
        : profile?.age
          ? ageModeFromAge(profile.age)
          : "adult";
      const themeMode = profile?.theme_mode ?? "auto";
      return { ageMode, themeMode };
    }
  } catch {
    // Not logged in or profiles table doesn't exist yet
  }
  return { ageMode: "adult", themeMode: "auto" };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { ageMode: initialAgeMode, themeMode: initialThemeMode } =
    await getInitialDisplayModes();
  const fontVars = `${playfair.variable} ${lora.variable} ${inter.variable}`;

  return (
    <html lang="en" className={`h-full ${fontVars}`}>
      <body className="antialiased">
        <ThemeModeProvider initialMode={initialThemeMode}>
          <AgeModeProvider initialMode={initialAgeMode}>
            <BodyModeSync />
            <div className="flex min-h-full flex-col">
              <a href="#main-content" className="skip-link">
                Skip to main content
              </a>
              <PageContextProvider>
                <AskOverlayProvider>
                  <TellOverlayProvider>
                    <Nav />
                    <Header />
                    <AskBar />
                    <main id="main-content" className="flex-1 pb-16 md:pb-0">
                      {children}
                    </main>
                  </TellOverlayProvider>
                </AskOverlayProvider>
              </PageContextProvider>
            </div>
          </AgeModeProvider>
        </ThemeModeProvider>
      </body>
    </html>
  );
}
