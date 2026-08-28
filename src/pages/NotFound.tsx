import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageNotice, PageShell, SectionLabel } from "@/components/AppShell";
import { useDocumentMeta } from "@/lib/seo";

const NotFound = () => {
  const location = useLocation();

  useDocumentMeta({ title: "Page not found", path: location.pathname });

  useEffect(() => {
    console.error("404: no route matches", location.pathname);
  }, [location.pathname]);

  return (
    <PageShell
      crumbs={[{ label: "Page not found" }]}
      trail={<SectionLabel>Careers</SectionLabel>}
      mainClassName="py-16 lg:py-24"
    >
      <PageNotice
        icon={Compass}
        tone="neutral"
        title="Page not found"
        body="That page does not exist. Our open roles are all on the careers board."
        actions={
          <Button asChild variant="secondary">
            <Link to="/">See all open roles</Link>
          </Button>
        }
      />
    </PageShell>
  );
};

export default NotFound;
