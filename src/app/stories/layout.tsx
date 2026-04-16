import { StoriesHubTabs } from "@/components/layout/StoriesHubTabs";

export default function StoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StoriesHubTabs />
      {children}
    </>
  );
}
