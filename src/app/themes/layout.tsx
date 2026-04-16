import { ExploreHubTabs } from "@/components/layout/ExploreHubTabs";
import { ThemesYoungReaderRedirect } from "@/components/layout/ThemesYoungReaderRedirect";

export default function ThemesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ExploreHubTabs />
      <ThemesYoungReaderRedirect>{children}</ThemesYoungReaderRedirect>
    </>
  );
}
