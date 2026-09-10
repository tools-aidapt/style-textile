import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { routeFetch } from "@/test/fetchRouter";
import { questionDomId } from "@/feedback/schema";
import CandidateReviewPage from "./CandidateReviewPage";
import EmployeeCheckInPage from "./EmployeeCheckInPage";
import ManagerRecruitmentReviewPage from "./ManagerRecruitmentReviewPage";
import NewHireReadinessPage from "./NewHireReadinessPage";

/**
 * Which instrument does each route actually render?
 *
 * **Identified by ClickUp field id, never by a heading or a file name.** The
 * two manager forms are the same shape — a header, a column of scores, two
 * or three prose boxes — so a swapped route, a swapped import or a swapped
 * spec would look entirely correct in a screenshot and in any test that
 * matched on a title. The field ids are the only thing that differ, and they
 * are also the only thing that decides where an answer is stored.
 *
 * A wrong route here is not a cosmetic bug: it files a manager's assessment
 * of a named new hire against a recruitment-process field, or the reverse,
 * and both directions are silent.
 */

/** The ids that identify an instrument beyond argument. */
const MARKERS = {
  MRR: {
    /** Clarity of Job Requirements — the first score on the recruitment review. */
    firstRating: "9504832d-2815-422e-a036-4c66e2eaaece",
    /** Comparison with Previous Hiring Rounds. On no other form. */
    only: "adf71af4-59d2-4b52-837a-b9002a77ca0a",
  },
  MNHR: {
    /** How well does the new hire understand their role and responsibilities? */
    firstRating: "479af8f7-1f42-4c10-9cfd-5901cdb3a656",
    /** Do you believe the new hire is ready to contribute effectively…? */
    only: "62ca0de5-6f17-464f-a19a-9bec86e705b0",
  },
  CRR: {
    /** How would you rate the clarity of our job description? */
    firstRating: "a74b7b20-5e86-4d94-93e2-13e32930b60f",
    /** Would you recommend {{company}} as an employer to others? */
    only: "d27d7a83-c193-4173-a07a-6691b90eea4b",
  },
  EEC: {
    /** How has your experience been so far since joining the company? */
    firstRating: "f8846fd7-f9aa-4323-b203-ce05651c7e9c",
    /** Do you have the tools and resources you need…? */
    only: "39bbd4ec-28fe-4658-8d1a-3c509392a077",
  },
} as const;

const TOKEN = "eyJmdCI6Ik1SUiIsInBpZCI6Ijg2OWV0YzA4NSJ9.dGVzdC1zaWduYXR1cmUtbm90LXJlYWw";

/**
 * The context endpoint's answer, which is what decides the instrument.
 *
 * Every prefill key is supplied for every form so the header cannot be the
 * thing that distinguishes them — only the questions can.
 */
const contextBody = (formType: string) => ({
  ok: true,
  formType,
  alreadySubmitted: false,
  prefill: {
    fullName: "Peter Njoroge",
    email: "peter.njoroge.sample@example.com",
    subjectName: "Grace Wanjiru",
    payroll: "KML-04182",
    positionTitle: "Sales Operations Coordinator",
    hiresMade: "2 of 2",
    jobTitle: "Sales Operations Coordinator",
    company: "Kenafric Manufacturing Limited",
    department: "Sales & Distribution",
    recruitmentType: "External Recruitment",
    reviewPoint: "Month 1",
  },
});

/** The scroll target the renderer puts on every question. */
const onScreen = (fieldId: string) =>
  document.getElementById(`${questionDomId(fieldId)}-field`);

const ROUTES = [
  {
    path: "/feedback/candidate-review",
    element: <CandidateReviewPage />,
    formType: "CRR" as const,
  },
  {
    path: "/feedback/manager-recruitment-review",
    element: <ManagerRecruitmentReviewPage />,
    formType: "MRR" as const,
  },
  {
    path: "/feedback/new-hire-readiness",
    element: <NewHireReadinessPage />,
    formType: "MNHR" as const,
  },
  {
    path: "/feedback/employee-check-in",
    element: <EmployeeCheckInPage />,
    formType: "EEC" as const,
  },
];

const renderRoute = (path: string, element: React.ReactNode) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // `readToken` reads window.location, not the router
  window.history.replaceState({}, "", `${path}?t=${TOKEN}`);
  return render(
    <MemoryRouter initialEntries={[`${path}?t=${TOKEN}`]}>
      <QueryClientProvider client={client}>
        <Routes>
          <Route path={path} element={element} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
};

afterEach(() => window.history.replaceState({}, "", "/"));

describe("each feedback route renders its own instrument", () => {
  ROUTES.forEach(({ path, element, formType }) => {
    it(`${path} renders ${formType}, by field id`, async () => {
      routeFetch([{ match: "kenafric-feedback-context", body: contextBody(formType) }]);
      renderRoute(path, element);

      const mine = MARKERS[formType];
      await waitFor(() => expect(onScreen(mine.firstRating)).not.toBeNull());
      expect(onScreen(mine.only), `${path} is missing its own marker field`).not.toBeNull();

      // And carries no other instrument's marker. This is the half that
      // catches a swap: a wrong form still renders "a form".
      Object.entries(MARKERS)
        .filter(([other]) => other !== formType)
        .forEach(([other, marker]) => {
          expect(
            onScreen(marker.firstRating),
            `${path} rendered ${other}'s first rating question`,
          ).toBeNull();
          expect(onScreen(marker.only), `${path} rendered ${other}'s marker field`).toBeNull();
        });
    });
  });

  it("the two manager forms are not each other", async () => {
    /**
     * Stated on its own because it is the swap that was reported. They are
     * the same shape on screen — a header, a column of 1-5 scores, prose
     * boxes — so nothing but the ids can tell them apart.
     */
    routeFetch([{ match: "kenafric-feedback-context", body: contextBody("MRR") }]);
    const mrr = renderRoute("/feedback/manager-recruitment-review", <ManagerRecruitmentReviewPage />);
    await waitFor(() => expect(onScreen(MARKERS.MRR.firstRating)).not.toBeNull());
    expect(onScreen(MARKERS.MNHR.firstRating)).toBeNull();
    expect(screen.getByText("2 of 2")).toBeInTheDocument(); // hiresMade, MRR only
    mrr.unmount();

    routeFetch([{ match: "kenafric-feedback-context", body: contextBody("MNHR") }]);
    renderRoute("/feedback/new-hire-readiness", <NewHireReadinessPage />);
    await waitFor(() => expect(onScreen(MARKERS.MNHR.firstRating)).not.toBeNull());
    expect(onScreen(MARKERS.MRR.firstRating)).toBeNull();
    // subjectName and reviewPoint, MNHR only
    expect(screen.getByText("Grace Wanjiru")).toBeInTheDocument();
    expect(screen.getByText("Month 1")).toBeInTheDocument();
  });

  it("refuses a token minted for a different instrument", async () => {
    /**
     * The reason a route/spec swap inside this repo could not produce the
     * reported symptom: each page renders its OWN spec and checks the
     * server's `formType` against it. Handed the wrong one it shows a dead
     * end — it never renders the other form's questions.
     */
    routeFetch([{ match: "kenafric-feedback-context", body: contextBody("MNHR") }]);
    renderRoute("/feedback/manager-recruitment-review", <ManagerRecruitmentReviewPage />);

    expect(await screen.findByText(/opens a different form/i)).toBeInTheDocument();
    expect(onScreen(MARKERS.MNHR.firstRating)).toBeNull();
    expect(onScreen(MARKERS.MRR.firstRating)).toBeNull();
  });
});
