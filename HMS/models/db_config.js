/**
 * Database connection factory.
 * Set DB_DRIVER=pg to use PostgreSQL, otherwise defaults to MySQL.
 */

var driver = process.env.DB_DRIVER || "mysql";

if (driver === "pg") {
  module.exports = require("./db_config_pg");
} else {
  var mysql = require("mysql");

  module.exports = function createConnection() {
    return mysql.createConnection({
      host: process.env.DB_HOST || "127.0.0.1",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "rootpass",
      database: process.env.DB_NAME || "nodelogin",
    });
  };
}
