"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */

router.post("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobNewSchema);

    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});

/**
 * Retrieve a list of jobs with optional filtering.
 *
 * GET /
 *   Response:
 *     - jobs: Array of job objects { title, salary, equity, companyHandle }
 *
 * Can filter on provided search filters:
 * - titleLike: A case-insensitive, partial match for job titles.
 * - minSalary: Minimum salary for jobs.
 * - hasEquity: Indicates if jobs should have equity.
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    const filterBy = req.query;

    if (Object.keys(filterBy).length === 0) {
      const jobs = await Job.findAll();
      return res.json({ jobs });
    }

    const supportedFilters = ["titleLike", "minSalary", "hasEquity"];
    for (let key in filterBy) {
      if (!supportedFilters.includes(key)) {
        throw new BadRequestError(
          `Cannot filter results by parameter '${key}'`
        );
      } else if (
        ["titleLike", "minSalary"].includes(key) &&
        filterBy[key] === ""
      ) {
        throw new BadRequestError(`Missing value for parameter '${key}'`);
      }
    }

    const filteredJobs = await Job.findAll(filterBy);

    return res.json({ jobs: filteredJobs });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id]  =>  { job }
 *
 *  Job is { title, salary, equity, companyHandle }
 *
 * Authorization required: none
 * */

router.get("/:id", async function (req, res, next) {
  try {
    const job = await Job.get(req.params.id);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 * */

router.patch(
  "/:id",
  ensureLoggedIn,
  ensureAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }

      const job = await Job.update(req.params.id, req.body);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  }
);

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: admin
 */

router.delete(
  "/:id",
  ensureLoggedIn,
  ensureAdmin,
  async function (req, res, next) {
    try {
      await Job.remove(req.params.id);
      return res.json({ deleted: "Job: " + req.params.id });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
