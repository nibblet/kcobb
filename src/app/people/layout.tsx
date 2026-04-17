import { ExploreHubTabs } from "@/components/layout/ExploreHubTabs";

export default function PeopleLayout({
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
