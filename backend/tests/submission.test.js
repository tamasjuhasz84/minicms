import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../server.js";

describe("POST /submit", () => {
  it("should accept valid submission", async () => {
    // 1. Betöltjük a formát
    const contentRes = await request(app).get("/content");
    const formFields = contentRes.body.form;

    // 2. Dummy adatokat generálunk
    const data = {};
    for (const field of formFields) {
      if (field.required) {
        switch (field.type) {
          case "text":
          case "textarea":
            data[field.name] = "Valami szöveg";
            break;
          case "email":
            data[field.name] = "teszt@example.com";
            break;
          case "number":
            data[field.name] = 42;
            break;
          case "checkbox":
          case "switch":
            data[field.name] = true;
            break;
          case "rating":
            data[field.name] = 5;
            break;
          case "select":
            // select esetén az első opció kellene – csak ha van
            data[field.name] = field.options?.[0]?.value || "option1";
            break;
          default:
            data[field.name] = "teszt";
        }
      }
    }

    // 3. Beküldjük
    const res = await request(app).post("/submit").send(data);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
  });
});
