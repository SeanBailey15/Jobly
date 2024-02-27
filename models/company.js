"use strict";

const db = require("../db");
const {
  BadRequestError,
  NotFoundError,
  ExpressError,
} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [handle, name, description, numEmployees, logoUrl]
    );
    const company = result.rows[0];

    return company;
  }

  /**
   * Find all companies.
   *
   * Retrieves a list of all companies from the database, optionally filtered by specific criteria.
   *
   * @param {Object} filterBy - An optional object containing filter criteria.
   * @param {string} [filterBy.nameLike] - A string to filter companies by name (case-insensitive, partial match).
   * @param {number} [filterBy.minEmployees] - The minimum number of employees a company should have.
   * @param {number} [filterBy.maxEmployees] - The maximum number of employees a company should have.
   * @returns {Array<Object>} An array of objects representing companies that match the filter criteria (if provided).
   * Each object has the following properties: handle, name, description, numEmployees, logoUrl.
   * @throws {NotFoundError} If no companies match the filter criteria or if no companies exist in the database.
   */

  static async findAll(filterBy = undefined) {
    // If no filter criteria are provided, get all companies
    if (filterBy === undefined) {
      const companiesRes = await db.query(
        `SELECT handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"
             FROM companies
             ORDER BY name`
      );

      // Throw an error if no companies are found
      if (companiesRes.rows.length === 0)
        throw new NotFoundError("No companies exist in database");
      return companiesRes.rows;
    }

    // Construct filter queries based on the provided filter criteria
    let filterQueries = [];
    let values = [];
    let idx = 1;

    for (let key in filterBy) {
      // Check if this is the first filter query
      if (idx === 1) {
        if (key === "nameLike") {
          filterQueries.push(`WHERE name ILIKE $${idx}`);
          values.push(`%${filterBy[key]}%`);
          idx += 1;
        } else if (key === "minEmployees") {
          filterQueries.push(`WHERE num_employees >= $${idx}`);
          values.push(+filterBy[key]);
          idx += 1;
        } else if (key === "maxEmployees") {
          filterQueries.push(`WHERE num_employees <= $${idx}`);
          values.push(+filterBy[key]);
          idx += 1;
        }
      } else {
        if (key === "nameLike") {
          filterQueries.push(`name ILIKE $${idx}`);
          values.push(`%${filterBy[key]}%`);
          idx += 1;
        } else if (key === "minEmployees") {
          filterQueries.push(`num_employees >= $${idx}`);
          values.push(+filterBy[key]);
          idx += 1;
        } else if (key === "maxEmployees") {
          filterQueries.push(`num_employees <= $${idx}`);
          values.push(+filterBy[key]);
          idx += 1;
        }
      }
    }
    // Combine all filter queries using 'AND' to form the final WHERE clause
    const joinedQueries = filterQueries.join(" AND ");

    // Execute a database query with the constructed filter criteria
    const filteredRes = await db.query(
      `SELECT handle,
              name,
              description,
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
        FROM companies
        ${joinedQueries}
        ORDER BY name`,
      values
    );

    // Throw an error if no companies match the filter criteria
    if (filteredRes.rows.length === 0)
      throw new NotFoundError("No companies match the parameters");

    return filteredRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]
    );
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}

module.exports = Company;
