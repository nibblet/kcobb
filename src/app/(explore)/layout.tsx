import { ExploreSubnav } from "@/components/layout/ExploreSubnav";

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ExploreSubnav />
      {children}
    </>
  );
}
