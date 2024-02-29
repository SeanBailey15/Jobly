"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");

const router = new express.Router();

/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: admin
 */

router.post("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    // Extracts query parameters from the request URL
    const filterBy = req.query;

    // If no query params are provided, get all companies unfiltered
    if (Object.keys(filterBy).length === 0) {
      const companies = await Company.findAll();
      return res.json({ companies });
    }

    // Declare variables to contain min/max employees if applicable
    let minEmployees;
    let maxEmployees;

    // Iterate through query parameters to validate and process them
    for (let key in filterBy) {
      // Checks that provided params match what is expected, throws error if not
      if (key != "nameLike" && key != "minEmployees" && key != "maxEmployees") {
        throw new BadRequestError(
          `Cannot filter results by parameter '${key}'`
        );
      }
      // Checks for missing parameter values and throws error if so
      else if (filterBy[key] === "") {
        throw new BadRequestError(`Missing value for parameter '${key}'`);
      }
      // Process minEmployees and maxEmployees parameters
      else if (key === "minEmployees") {
        minEmployees = +filterBy[key];
      } else if (key === "maxEmployees") {
        maxEmployees = +filterBy[key];
      }

      // If min value provided is greater than max value provided, throws an error
      if (
        minEmployees !== undefined &&
        maxEmployees !== undefined &&
        minEmployees > maxEmployees
      ) {
        throw new BadRequestError(
          "Minimum employees cannot be greater than maximum"
        );
      }
    }

    // Get all companies by passing the filterBy object to the Company.findAll method
    const filteredCompanies = await Company.findAll(filterBy);

    return res.json({
      companies: filteredCompanies,
    });
  } catch (err) {
    return next(err);
  }
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  try {
    const company = await Company.get(req.params.handle);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: admin
 */

router.patch(
  "/:handle",
  ensureLoggedIn,
  ensureAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, companyUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }

      const company = await Company.update(req.params.handle, req.body);
      return res.json({ company });
    } catch (err) {
      return next(err);
    }
  }
);

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: admin
 */

router.delete(
  "/:handle",
  ensureLoggedIn,
  ensureAdmin,
  async function (req, res, next) {
    try {
      await Company.remove(req.params.handle);
      return res.json({ deleted: req.params.handle });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
