import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../server.js";

describe("GET /content", () => {
  it("should return content JSON with header/footer", async () => {
    const res = await request(app).get("/content");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("header");
    expect(res.body).toHaveProperty("footer");
  });
});
