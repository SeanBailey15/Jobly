"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "New Job",
    salary: 1,
    equity: 0,
    companyHandle: "c1",
  };

  const badJob = {
    title: "New Job",
    salary: 1,
    equity: 0,
    companyHandle: "c4",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: 5,
      title: "New Job",
      salary: 1,
      equity: 0,
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'New Job'`
    );
    expect(result.rows).toEqual([
      {
        id: 5,
        title: "New Job",
        salary: 1,
        equity: 0,
        company_handle: "c1",
      },
    ]);
  });

  test("bad request with non-existent company", async function () {
    try {
      await Job.create(badJob);
      fali();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
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
        companyHandle: "c3",
      },
    ]);
  });
});

/************************************** findAll?filters */

describe("findAll with filters", function () {
  test("works: filter by titleLike", async function () {
    let filter = { titleLike: "1" };
    let jobs = await Job.findAll(filter);
    expect(jobs).toEqual([
      {
        id: 1,
        title: "j1",
        salary: 100,
        equity: 0.01,
        companyHandle: "c1",
      },
    ]);
  });

  test("works: filter by minSalary", async function () {
    let filter = { minSalary: 200 };
    let jobs = await Job.findAll(filter);
    expect(jobs).toEqual([
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
        companyHandle: "c3",
      },
    ]);
  });

  test("works: filter by hasEquity", async function () {
    let filter = { hasEquity: "" };
    let jobs = await Job.findAll(filter);
    expect(jobs).toEqual([
      {
        id: 1,
        title: "j1",
        salary: 100,
        equity: 0.01,
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
        companyHandle: "c3",
      },
    ]);
  });

  test("works: filter by titleLike and minSalary", async function () {
    let filter = {
      titleLike: "j",
      minSalary: 300,
    };
    let jobs = await Job.findAll(filter);
    expect(jobs).toEqual([
      {
        id: 3,
        title: "j3",
        salary: 300,
        equity: 0.03,
        companyHandle: "c3",
      },
    ]);
  });

  test("works: filter by titleLike and hasEquity", async function () {
    let filter = {
      titleLike: "1",
      hasEquity: "",
    };
    let jobs = await Job.findAll(filter);
    expect(jobs).toEqual([
      {
        id: 1,
        title: "j1",
        salary: 100,
        equity: 0.01,
        companyHandle: "c1",
      },
    ]);
  });

  test("works: filter by titleLike, minSalary, and hasEquity", async function () {
    let filter = {
      titleLike: "j2",
      minSalary: 100,
      hasEquity: "",
    };
    let jobs = await Job.findAll(filter);
    expect(jobs).toEqual([
      {
        id: 2,
        title: "j2",
        salary: 200,
        equity: 0.02,
        companyHandle: "c2",
      },
    ]);
  });

  test("not found if no job matches query params", async function () {
    try {
      let filter = {
        titleLike: "99",
      };
      await Job.findAll(filter);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(1);
    expect(job).toEqual({
      id: 1,
      title: "j1",
      salary: 100,
      equity: 0.01,
      companyHandle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(99);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 1000,
    equity: 1,
  };

  test("works", async function () {
    let job = await Job.update(1, updateData);
    expect(job).toEqual({
      id: 1,
      companyHandle: "c1",
      ...updateData,
    });

    const result = await db.query(
      `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE id = 1`
    );
    expect(result.rows).toEqual([
      {
        title: "New",
        salary: 1000,
        equity: 1,
        company_handle: "c1",
      },
    ]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New",
      salary: null,
      equity: null,
    };

    let job = await Job.update(1, updateDataSetNulls);
    expect(job).toEqual({
      id: 1,
      companyHandle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
      `SELECT title, salary, equity, company_handle
        FROM jobs
        WHERE id = 1`
    );
    expect(result.rows).toEqual([
      {
        title: "New",
        salary: null,
        equity: null,
        company_handle: "c1",
      },
    ]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(99, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(1);
    const res = await db.query("SELECT id FROM jobs WHERE id=1");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(99);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
