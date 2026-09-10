import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import RouteError from "./pages/RouteError";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A careers board changes on the order of days; refetching because a
      // candidate tabbed away and back is noise
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * A data router, not <BrowserRouter>: role pages need useBlocker to guard a
 * part-written application, and every route needs an error element so a render
 * failure is a page rather than a blank document.
 *
 * Routes load lazily. The board is what almost everyone lands on, and it does
 * not need the form's validation stack — zod, react-hook-form and the
 * resolvers — in its critical path.
 */
const router = createBrowserRouter([
  {
    path: "/",
    lazy: async () => ({ Component: (await import("./pages/CareersBoardPage")).default }),
    errorElement: <RouteError />,
  },
  {
    path: "/roles/:positionId",
    lazy: async () => ({ Component: (await import("./pages/RolePage")).default }),
    errorElement: <RouteError />,
  },
  {
    // Internal. A requesting manager raises a role; not linked from the board.
    path: "/requisitions/new",
    lazy: async () => ({ Component: (await import("./pages/NewRequisitionPage")).default }),
    errorElement: <RouteError />,
  },
  {
    /**
     * Employee onboarding. The path segment is the new hire's ClickUp Employee
     * task id — there is no login in front of it. `?id=` is honoured too, for
     * email clients that mangle a path segment.
     */
    path: "/onboarding/:employeeId?",
    lazy: async () => ({ Component: (await import("./pages/OnboardingPage")).default }),
    errorElement: <RouteError />,
  },
  {
    /**
     * F1 / F2 — the candidate recruitment review, external and internal.
     *
     * One route for both. The signed token is `?t=` rather than a path
     * segment: it is long, and the form it opens is chosen by what the
     * context endpoint says the token is for, not by the address.
     */
    path: "/feedback/candidate-review",
    lazy: async () => ({ Component: (await import("./pages/CandidateReviewPage")).default }),
    errorElement: <RouteError />,
  },
  {
    /**
     * F3 — the manager recruitment review, once per position on the day it
     * closes as filled.
     *
     * A separate route from the candidate review rather than one address
     * switching on the token, because these are different instruments with
     * different question sets: a wrong `formType` on a shared route would
     * render the wrong form rather than refuse.
     */
    path: "/feedback/manager-recruitment-review",
    lazy: async () => ({
      Component: (await import("./pages/ManagerRecruitmentReviewPage")).default,
    }),
    errorElement: <RouteError />,
  },
  {
    /**
     * F4 — the line manager's review of a new hire, at Month 1 and Month 3.
     * Which of the two is the token's business, not the address's.
     */
    path: "/feedback/new-hire-readiness",
    lazy: async () => ({ Component: (await import("./pages/NewHireReadinessPage")).default }),
    errorElement: <RouteError />,
  },
  {
    /**
     * F5 — the new hire's own check-in, six times through probation. Which
     * one is the token's `rp` claim, not the address's.
     *
     * The route exists ahead of its ClickUp fields, so it currently renders
     * "not finished being set up". A route that 404s and a route that says
     * it is not ready are different messages, and the second is the true one.
     */
    path: "/feedback/employee-check-in",
    lazy: async () => ({ Component: (await import("./pages/EmployeeCheckInPage")).default }),
    errorElement: <RouteError />,
  },
  {
    path: "*",
    lazy: async () => ({ Component: (await import("./pages/NotFound")).default }),
    errorElement: <RouteError />,
  },
]);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      {/* The router resolves each route's chunk before rendering it, so this
          only shows on a cold, slow first load */}
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <RouterProvider router={router} />
      </Suspense>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
