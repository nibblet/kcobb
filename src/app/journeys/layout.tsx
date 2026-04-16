import { ExploreHubTabs } from "@/components/layout/ExploreHubTabs";

export default function JourneysLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ExploreHubTabs />
      {children}
    </>
  );
}
