"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if company is not in database
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const compHandleCheck = await db.query(
      `SELECT handle
            FROM companies
            WHERE handle = $1`,
      [companyHandle]
    );

    if (!compHandleCheck.rows[0])
      throw new BadRequestError(`Company '${companyHandle}' does not exist`);

    const result = await db.query(
      `INSERT INTO jobs
                (title, salary, equity, company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    );
    const job = result.rows[0];

    return job;
  }

  /**
   * Retrieves a list of jobs from the database based on optional filter criteria.
   *
   * @param {Object} filterBy - An object containing optional filters for the query.
   * @param {string} filterBy.titleLike - A string to filter job titles based on partial match.
   * @param {number} filterBy.minSalary - The minimum salary for filtering jobs.
   * @param {boolean} filterBy.hasEquity - A boolean indicating if the job should have equity.
   * @returns {Promise<Array>} An array of Job objects matching the filter criteria.
   * @throws {NotFoundError} If no jobs match the specified filter criteria.
   */

  static async findAll(filterBy = {}) {
    let whereClause = "";
    let values = [];

    if (Object.keys(filterBy).length > 0) {
      whereClause = "WHERE ";
      const filters = [];
      for (const [key, value] of Object.entries(filterBy)) {
        switch (key) {
          case "titleLike":
            filters.push(`title ILIKE $${filters.length + 1}`);
            values.push(`%${value}%`);
            break;
          case "minSalary":
            filters.push(`salary >= $${filters.length + 1}`);
            values.push(value);
            break;
          case "hasEquity":
            filters.push(`equity > 0`);
            break;
        }
      }
      whereClause += filters.join(" AND ");
    }

    const query = `
      SELECT id,
             title,
             salary,
             equity,
             company_handle AS "companyHandle"
      FROM jobs
      ${whereClause}
      ORDER BY company_handle
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      throw new NotFoundError("No jobs match the parameters");
    }

    return result.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { title, salary, equity, companHandle }
   *
   * Throws NotFoundError if not found.
   * */

  static async get(id) {
    const jobRes = await db.query(
      `SELECT id,
            title,
            salary,
            equity,
            company_handle AS "companyHandle"
            FROM jobs
            WHERE id = $1`,
      [id]
    );

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job has the id: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      companyHandle: "company_handle",
    });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs
                        SET ${setCols}
                        WHERE id = ${handleVarIdx}
                        RETURNING id,
                                  title,
                                  salary,
                                  equity,
                                  company_handle AS "companyHandle"`;

    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job has the id: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
             FROM jobs
             WHERE id = $1
             RETURNING id`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);
  }
}

module.exports = Job;
