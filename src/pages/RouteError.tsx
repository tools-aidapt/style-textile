import { useEffect } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageNotice, PageShell, SectionLabel } from "@/components/AppShell";

/**
 * The last line of defence: anything a route throws while rendering lands
 * here, so a failure is a page that explains itself rather than a blank
 * document.
 *
 * The actions leave through the browser rather than the router — whatever
 * broke is still mounted in the router's memory, and a client-side navigation
 * would carry it along.
 */
const RouteError = () => {
  const error = useRouteError();

  useEffect(() => {
    console.error("Unhandled route error", error);
  }, [error]);

  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : undefined;

  return (
    <PageShell
      crumbs={[{ label: "Something went wrong" }]}
      trail={<SectionLabel>Careers</SectionLabel>}
      mainClassName="py-16 lg:py-24"
    >
      <PageNotice
        icon={AlertTriangle}
        tone="fire"
        title="Something went wrong"
        body="This page failed to load. Reloading usually clears it; if it does not, please come back shortly."
        detail={detail}
        actions={
          <>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Reload the page
            </Button>
            <Button variant="ghost" onClick={() => window.location.assign("/")}>
              See all open roles
            </Button>
          </>
        }
      />
    </PageShell>
  );
};

export default RouteError;
