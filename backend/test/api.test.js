const test = require("node:test");
const assert = require("node:assert/strict");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";
process.env.LOGIN_ONLY_USER = process.env.LOGIN_ONLY_USER || "admin";
process.env.LOGIN_ONLY_EMAIL = process.env.LOGIN_ONLY_EMAIL || "admin@example.com";
process.env.LOGIN_ONLY_PASSWORD = process.env.LOGIN_ONLY_PASSWORD || "password123";

const { createApp } = require("../src/app");

async function startTestServer() {
  const app = createApp();
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const address = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
      });
    });
    server.on("error", reject);
  });
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

test("health endpoint responds ok", async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const res = await fetch(`${baseUrl}/api/health`);
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.ok, true);
  } finally {
    server.close();
  }
});

test("login validation fails when required fields missing", async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const { res, data } = await postJson(`${baseUrl}/api/auth/login`, { email: "admin@example.com" });
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(String(data.message || ""), /required/i);
  } finally {
    server.close();
  }
});

test("login validation fails for invalid email", async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const { res, data } = await postJson(`${baseUrl}/api/auth/login`, {
      name: "admin",
      email: "invalid-email",
      password: "password123",
    });
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(String(data.message || ""), /valid email/i);
  } finally {
    server.close();
  }
});

test("inventory categories endpoint requires auth", async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const res = await fetch(`${baseUrl}/api/inventory/categories`);
    const data = await res.json().catch(() => ({}));
    assert.equal(res.status, 401);
    assert.equal(data.success, false);
  } finally {
    server.close();
  }
});
