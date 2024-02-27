"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError, ExpressError } = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
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
 * Authorization required: login
 */

router.post("/", ensureLoggedIn, async function (req, res, next) {
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
    // Declare variable to contain request query object
    const filterBy = req.query;

    // Declare variables to contain min/max employees if applicable
    let minEmployees;
    let maxEmployees;

    // Loop through provided query params and verify they are relevant to the data available
    for (let key in filterBy) {
      // Checks that provided params match what is expected, throws error if not
      if (key != "nameLike" && key != "minEmployees" && key != "maxEmployees") {
        throw new ExpressError(`Cannot filter results by ${key}`, 400);
      }
      // Checks for missing values and throws error if so
      else if (filterBy[key] === "") {
        throw new ExpressError(`Missing value for parameter ${key}`, 400);
      }
      // Sets minEmployees variable if exists, converts the string to a number
      else if (key === "minEmployees") {
        minEmployees = +filterBy[key];
      }
      // Sets maxEmployees variable if exists, converts the string to a number
      else if (key === "maxEmployees") {
        maxEmployees = +filterBy[key];
      }

      // If min value provided is greater than max value provided, throws an error
      if (minEmployees > maxEmployees) {
        throw new ExpressError(
          "Minimum employees cannot be greater than maximum",
          400
        );
      }
    }

    // If no query params are passed, get all companies unfiltered
    if (Object.keys(filterBy).length === 0) {
      const companies = await Company.findAll();
      return res.json({ companies });
    }

    // Get all companies by passing the filterBy object to the Company.findAll method
    const filteredCompanies = await Company.findAll(filterBy);

    return res.json({
      companies: { filteredCompanies },
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
 * Authorization required: login
 */

router.patch("/:handle", ensureLoggedIn, async function (req, res, next) {
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
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login
 */

router.delete("/:handle", ensureLoggedIn, async function (req, res, next) {
  try {
    await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
