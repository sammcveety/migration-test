var mysql = require("mysql");

function createConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "rootpass",
    database: process.env.DB_NAME || "nodelogin",
  });
}

module.exports = createConnection;
