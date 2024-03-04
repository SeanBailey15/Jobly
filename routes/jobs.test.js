"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "j5",
    salary: 500,
    equity: 0.05,
    companyHandle: "c1",
  };

  test("works: ok for Admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: 5,
        title: "j5",
        salary: 500,
        equity: 0.05,
        companyHandle: "c1",
      },
    });
  });

  test("unauth for non-Admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).post("/jobs").send(newJob);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "j5",
        salary: 500,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "j6",
        salary: "600",
        equity: "1",
        companyHandle: "c1",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: 1,
          title: "j1",
          salary: 100,
          equity: 0.01,
          companyHandle: "c1",
        },
        {
          id: 4,
          title: "j no equity",
          salary: null,
          equity: null,
          companyHandle: "c1",
        },
        {
          id: 2,
          title: "j2",
          salary: 200,
          equity: 0.02,
          companyHandle: "c2",
        },
        {
          id: 3,
          title: "j3",
          salary: 300,
          equity: 0.03,
          companyHandle: "c2",
        },
      ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs?filter */

describe("GET /jobs?filterParams", function () {
  test("works: filter by valid params - titleLike, minSalary, and hasEquity", async function () {
    const resp = await request(app).get(
      "/jobs?titleLike=j&minSalary=200&hasEquity"
    );
    expect(resp.body).toEqual({
      jobs: [
        {
          id: 2,
          title: "j2",
          salary: 200,
          equity: 0.02,
          companyHandle: "c2",
        },
        {
          id: 3,
          title: "j3",
          salary: 300,
          equity: 0.03,
          companyHandle: "c2",
        },
      ],
    });
  });

  test("bad request for invalid parameter in query string", async function () {
    const resp = await request(app).get("/jobs?title=j");
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request for missing value in query string", async function () {
    const resp = await request(app).get("/jobs?titleLike=");
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request for missing value in query string", async function () {
    const resp = await request(app).get("/jobs?minSalary=");
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/1`);
    expect(resp.body).toEqual({
      job: {
        id: 1,
        title: "j1",
        salary: 100,
        equity: 0.01,
        companyHandle: "c1",
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/99`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for Admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        title: "j1 New",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        id: 1,
        title: "j1 New",
        salary: 100,
        equity: 0.01,
        companyHandle: "c1",
      },
    });
  });

  test("unauth for non-Admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        title: "j1 New",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).patch(`/jobs/1`).send({
      title: "j1 New",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/99`)
      .send({
        title: "j4 New",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        companyHandle: "c1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        salary: "1000",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for Admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "Job: 1" });
  });

  test("unauth for non-Admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/1`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).delete(`/jobs/1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
      .delete(`/jobs/99`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
