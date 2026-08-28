import type { RequisitionSchema } from "@/requisition/schema";
import { REQUIRED_FIELD_KEYS } from "@/requisition/schema";
import {
  parseEmployees,
  parsePeople,
  type DirectoryPerson,
  type EmployeeRecord,
} from "@/requisition/directory";

/**
 * A complete served schema, for tests. Kept small deliberately — the option
 * lists matter only where a rule reads them, and a test that lists all nine
 * Kenafric entities tells you nothing the second one does not.
 */

const OPTIONS: Record<string, string[]> = {
  company: ["Kenafric Manufacturing Limited", "Kenafric Biscuits Limited"],
  department: ["Sales & Distribution", "ICT"],
  costCentre: ["Sales & Distribution", "ICT"],
  location: ["Nairobi, Kenya", "Thika, Kenya"],
  positionType: ["Permanent", "Fixed Term Contract", "Intern"],
  newOrReplacement: ["New", "Replacement"],
  recruitmentType: ["Internal Recruitment", "Recruitment Agency", "External Recruitment"],
  positionRequirements: ["Laptop/Computer/Connectivity", "Pick-up", "N/A"],
  assessmentStagesRequired: ["Telephone", "Stage 1", "Stage 2", "Stage 3"],
};

export const testSchema = (overrides: Partial<RequisitionSchema> = {}): RequisitionSchema => {
  const fields: RequisitionSchema["fields"] = {};
  REQUIRED_FIELD_KEYS.forEach((key) => {
    fields[key] = {
      key,
      clickupName: key,
      type: OPTIONS[key] ? "drop_down" : "text",
      ...(OPTIONS[key] ? { options: OPTIONS[key].map((label) => ({ label })) } : {}),
    };
  });

  return {
    fields,
    missingKeys: [],
    ...overrides,
  };
};

/**
 * The two endpoints' payloads, in the shape they really answer with — string
 * `clickup_user_id`, `designation`, `profile_picture`, and the envelope. The
 * person fixtures below are parsed from these rather than written by hand, so
 * a fixture cannot drift away from what the parser actually does.
 */
export const testEmployeesPayload = () => ({
  workspace_id: "9012912728",
  workspace_name: "Kenafric Group",
  count: 2,
  with_photo: 1,
  without_photo: 1,
  unmatched: [],
  employees: [
    {
      task_id: "869e00000",
      name: "Asha Wanjiru",
      email: "asha@kenafric.test",
      clickup_user_id: "1001",
      company: "Kenafric Manufacturing Limited",
      department: null,
      designation: "Line Manager",
      profile_picture: "https://avatars.test/1001.jpg",
      avatar_initials: "AW",
      avatar_color: "#d60800",
      workspace_username: "Asha",
      in_workspace: true,
      url: "https://app.clickup.com/t/869e00000",
    },
    {
      task_id: "869e00001",
      name: "Brian Otieno",
      email: "brian@kenafric.test",
      clickup_user_id: "1002",
      company: "Kenafric Biscuits Limited",
      department: null,
      designation: "C-Suite",
      profile_picture: null,
      avatar_initials: "BO",
      avatar_color: null,
      workspace_username: "Brian",
      in_workspace: true,
      url: "https://app.clickup.com/t/869e00001",
    },
  ],
});

export const testUsersPayload = () => ({
  workspace_id: "9012912728",
  workspace_name: "Kenafric Group",
  count: 2,
  pending_invites: 0,
  by_role: { member: 2 },
  users: [
    {
      id: 1001,
      username: "Asha Wanjiru",
      email: "asha@kenafric.test",
      role: "member",
      invite_accepted: true,
      profile_picture: "https://avatars.test/1001.jpg",
    },
    {
      id: 1002,
      username: "Brian Otieno",
      email: "brian@kenafric.test",
      role: "member",
      invite_accepted: true,
      profile_picture: null,
    },
  ],
});

export const testPeople = (): DirectoryPerson[] => parsePeople(testUsersPayload());

export const testEmployeeRecords = (): EmployeeRecord[] =>
  parseEmployees(testEmployeesPayload());
