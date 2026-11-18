import { validateSignup } from "../src/validation/users.js";

// A valid sign up. Each test changes only the field it is about.
const valid = {
  username: "dani",
  fullName: "Dani Composer",
  email: "Dani@Example.com",
  password: "a-good-password",
};

describe("validateSignup", () => {
  test("returns the fields, with the email in lower case", () => {
    expect(validateSignup(valid)).toEqual({
      username: "dani",
      fullName: "Dani Composer",
      email: "dani@example.com",
      password: "a-good-password",
    });
  });

  test("throws when a field is missing, or there is no body", () => {
    expect(() => validateSignup({ ...valid, fullName: " " })).toThrow("ALL_FIELDS_REQUIRED");
    expect(() => validateSignup(undefined)).toThrow("ALL_FIELDS_REQUIRED");
  });

  test("refuses a username with spaces or of 2 letters", () => {
    expect(() => validateSignup({ ...valid, username: "da ni" })).toThrow("INVALID_USERNAME");
    expect(() => validateSignup({ ...valid, username: "da" })).toThrow("INVALID_USERNAME");
  });

  test("refuses an email without @", () => {
    expect(() => validateSignup({ ...valid, email: "dani.example.com" })).toThrow("INVALID_EMAIL");
  });

  test("refuses a password shorter than 8 or longer than 72 characters", () => {
    expect(() => validateSignup({ ...valid, password: "short" })).toThrow("PASSWORD_TOO_SHORT");
    expect(() => validateSignup({ ...valid, password: "a".repeat(73) })).toThrow(
      "PASSWORD_TOO_LONG",
    );
  });
});
