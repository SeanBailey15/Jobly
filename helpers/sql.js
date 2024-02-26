const { BadRequestError } = require("../expressError");

/**
 * Generates SQL query components for a partial update based on the provided data.
 * @param {object} dataToUpdate - The data to update, retrieved from the request body. Must pass schema validation.
 * @param {object} jsToSql - A mapping of JavaScript object keys to their corresponding column names in the SQL database.
 * @returns {object} An object containing the SQL `SET` clause and the values for the query.
 * @throws {BadRequestError} If no data is provided for the update.
 *
 * Example:
 * sqlForPartialUpdate({ firstName: 'Aliya', age: 32 }, { firstName: 'first_name', age: 'age' })
 * // Returns { setCols: '"first_name"=$1, "age"=$2', values: ['Aliya', 32] }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // Extract keys from the data to update
  const keys = Object.keys(dataToUpdate);

  // Throw an error if no data is provided
  if (keys.length === 0) throw new BadRequestError("No data");

  // Map each key to a column name and placeholder for the SQL query
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  // Return the setCols string and the values for the query
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
