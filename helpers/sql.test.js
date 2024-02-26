const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", () => {
  test("should generate correct SQL components for partial update", () => {
    const dataToUpdate = { firstName: "Aliya", age: 32 };
    const jsToSql = { firstName: "first_name", age: "age" };

    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(result.setCols).toBe('"first_name"=$1, "age"=$2');
    expect(result.values).toEqual(["Aliya", 32]);
  });

  test("should throw BadRequestError if no data is provided", () => {
    const dataToUpdate = {};
    const jsToSql = {};

    expect(() => {
      sqlForPartialUpdate(dataToUpdate, jsToSql);
    }).toThrow("No data");
  });
});
