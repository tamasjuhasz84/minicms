import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../server.js";

describe("POST /login", () => {
  it("should fail with wrong credentials", async () => {
    const res = await request(app).post("/login").send({
      username: "wrong",
      password: "wrong",
    });
    expect(res.status).toBe(401);
  });
});
