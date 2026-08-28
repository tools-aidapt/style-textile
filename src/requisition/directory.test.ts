import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  employeeByTaskId,
  initialsOf,
  matchesEmployee,
  matchesPerson,
  parseEmployees,
  parsePeople,
} from "./directory";

const live = (name: string) =>
  JSON.parse(readFileSync(`src/test/fixtures/${name}.live.json`, "utf8"));

/**
 * The two endpoints, as they actually answered on 2026-08-28. The fixtures are
 * anonymised — synthetic names, emails, ids and photo URLs — but every key,
 * type and null is the live one, so a change in either response shape breaks a
 * test here rather than a picker in production.
 */
describe("the live response shapes", () => {
  it("reads the employee register: string ids, designation, profile_picture", () => {
    const people = parsePeople(live("employees"));

    expect(people).toHaveLength(31);
    // clickup_user_id arrives as a string; the wire contract needs an integer
    expect(people.every((p) => Number.isInteger(p.clickupUserId))).toBe(true);
    expect(people.every((p) => p.email)).toBe(true);
    expect(people.filter((p) => p.avatarUrl)).toHaveLength(25);
    // `designation` is a band rather than a job title
    expect(new Set(people.map((p) => p.jobTitle))).toEqual(
      new Set(["Line Manager", "C-Suite", "HR"]),
    );
    expect(people.map((p) => p.name)).toEqual([...people.map((p) => p.name)].sort());
  });

  it("reads the user list: numeric ids, username, 93 people", () => {
    const people = parsePeople(live("users"));

    expect(people).toHaveLength(93);
    expect(people.every((p) => Number.isInteger(p.clickupUserId))).toBe(true);
    // The user list carries no designation at all
    expect(people.every((p) => p.jobTitle === null)).toBe(true);
    expect(people.filter((p) => p.avatarUrl)).toHaveLength(72);
  });

  it("reads the employee register a second way, by task id", () => {
    const records = parseEmployees(live("employees"));

    expect(records).toHaveLength(31);
    expect(records.every((r) => r.clickupTaskId.length <= 20)).toBe(true);
    expect(records.every((r) => r.company)).toBe(true);
    // Every employee is also a workspace user, which is what lets one endpoint
    // serve both the manager picker and the replacement picker
    const users = parsePeople(live("users")).map((p) => p.clickupUserId);
    const employees = parsePeople(live("employees")).map((p) => p.clickupUserId);
    expect(employees.every((id) => users.includes(id))).toBe(true);
  });

  it("finds a record by task id", () => {
    const records = parseEmployees(live("employees"));
    const first = records[0];
    expect(employeeByTaskId(records, first.clickupTaskId)).toBe(first);
    expect(employeeByTaskId(records, "nope")).toBeUndefined();
    expect(employeeByTaskId(records, "")).toBeUndefined();
  });

  it("prefers ClickUp's own initials over ones it works out", () => {
    const [record] = parseEmployees(live("employees"));
    expect(record.initials).toBeTruthy();
    expect(initialsOf(record)).toBe(record.initials);
  });
});

/**
 * The aliases below stay because the two endpoints already disagree with each
 * other. These pin the tolerance rather than a guess.
 */
describe("parsePeople", () => {
  it("reads a bare array in the obvious shape", () => {
    const people = parsePeople([
      {
        clickupUserId: 1001,
        name: "Asha Wanjiru",
        email: "asha@kenafric.test",
        avatarUrl: "https://avatars.test/1.png",
        jobTitle: "Regional Sales Manager",
      },
    ]);

    expect(people).toEqual([
      {
        clickupUserId: 1001,
        name: "Asha Wanjiru",
        email: "asha@kenafric.test",
        avatarUrl: "https://avatars.test/1.png",
        initials: null,
        jobTitle: "Regional Sales Manager",
      },
    ]);
  });

  it("reads ClickUp's own spelling, where the person is nested under `user`", () => {
    const people = parsePeople({
      members: [
        {
          user: {
            id: 1002,
            username: "Brian Otieno",
            email: "brian@kenafric.test",
            profilePicture: "https://avatars.test/2.png",
          },
        },
      ],
    });

    expect(people[0]).toMatchObject({
      clickupUserId: 1002,
      name: "Brian Otieno",
      avatarUrl: "https://avatars.test/2.png",
    });
  });

  it("reads snake_case and a first/last name pair", () => {
    const people = parsePeople({
      data: [
        {
          user_id: 1003,
          first_name: "Catherine",
          last_name: "Njeri",
          email_address: "cat@kenafric.test",
          profile_picture: "https://avatars.test/3.png",
          job_title: "Finance Manager",
        },
      ],
    });

    expect(people[0]).toEqual({
      clickupUserId: 1003,
      name: "Catherine Njeri",
      email: "cat@kenafric.test",
      avatarUrl: "https://avatars.test/3.png",
      initials: null,
      jobTitle: "Finance Manager",
    });
  });

  it("accepts a single object, which is what an n8n webhook returns for one item", () => {
    expect(parsePeople({ id: 1004, name: "Daniel Kiprono" })).toHaveLength(1);
  });

  it("drops anyone with no numeric ClickUp id", () => {
    // A person the wire cannot name is worse than a shorter list
    const people = parsePeople([
      { id: "not-a-number", name: "Nobody" },
      { name: "Also nobody" },
      { id: 1005, name: "Esther Mutiso" },
    ]);
    expect(people.map((p) => p.name)).toEqual(["Esther Mutiso"]);
  });

  it("ignores an avatar that is not an absolute http URL", () => {
    const [person] = parsePeople([{ id: 1, name: "A", avatar: "/relative/path.png" }]);
    expect(person.avatarUrl).toBeNull();
  });

  it("falls back to the email when there is no name at all", () => {
    const [person] = parsePeople([{ id: 1, email: "solo@kenafric.test" }]);
    expect(person.name).toBe("solo@kenafric.test");
  });

  it("deduplicates and sorts by name", () => {
    const people = parsePeople([
      { id: 2, name: "Zawadi" },
      { id: 1, name: "Amos" },
      { id: 1, name: "Amos duplicate" },
    ]);
    expect(people.map((p) => p.name)).toEqual(["Amos", "Zawadi"]);
  });

  it("returns nothing rather than throwing on a shape it does not know", () => {
    expect(parsePeople(null)).toEqual([]);
    expect(parsePeople("nope")).toEqual([]);
    expect(parsePeople({ error: "not registered" })).toEqual([]);
  });
});

describe("people helpers", () => {
  it("builds initials for the avatar fallback", () => {
    expect(initialsOf({ name: "Asha Wanjiru" })).toBe("AW");
    expect(initialsOf({ name: "Prince" })).toBe("P");
    // Only the first two words, so a long name does not overflow the circle
    expect(initialsOf({ name: "Mary Jane Watson Parker" })).toBe("MJ");
    // The endpoint's own initials win where it supplies them
    expect(initialsOf({ name: "Akhil Shah", initials: "A" })).toBe("A");
  });

  it("searches an employee by band and employing entity too", () => {
    const [record] = parseEmployees([
      {
        task_id: "869e00000",
        name: "Asha Wanjiru",
        email: "asha@kenafric.test",
        designation: "Line Manager",
        company: "Kenafric Biscuits Limited",
      },
    ]);
    expect(matchesEmployee(record, "line manager")).toBe(true);
    expect(matchesEmployee(record, "biscuits")).toBe(true);
    expect(matchesEmployee(record, "properties")).toBe(false);
  });

  it("searches name, email and job title together", () => {
    const person = {
      clickupUserId: 1,
      name: "Asha Wanjiru",
      email: "asha@kenafric.test",
      avatarUrl: null,
      initials: null,
      jobTitle: "Regional Sales Manager",
    };
    expect(matchesPerson(person, "wanj")).toBe(true);
    expect(matchesPerson(person, "kenafric.test")).toBe(true);
    expect(matchesPerson(person, "regional")).toBe(true);
    expect(matchesPerson(person, "")).toBe(true);
    expect(matchesPerson(person, "finance")).toBe(false);
  });
});
