/**
 * PostgreSQL connection wrapper that exposes a mysql-compatible .query() API.
 *
 * Key translations from MySQL → PostgreSQL:
 * - Replaces ? placeholders with $1, $2, ... (pg-native style)
 * - Strips backtick quoting (MySQL identifier quoting)
 * - Translates DATE(NOW()) → CURRENT_DATE
 * - Translates CREATE OR REPLACE VIEW to work with PostgreSQL
 * - Returns results in the same shape as the mysql driver
 */

const { Client } = require("pg");

/**
 * Detect if a query is a DDL statement (CREATE, ALTER, DROP, etc.)
 * DDL statements cannot use parameterized queries in PostgreSQL.
 */
function isDDL(sql) {
  return /^\s*(create|alter|drop)\s/i.test(sql);
}

function translateQuery(sql, params) {
  let translated = sql;

  // Strip backtick quoting (MySQL uses backticks, PG uses double quotes or none)
  translated = translated.replace(/`/g, "");

  // MySQL uses double quotes as string delimiters in some contexts (e.g. LIKE "%foo%")
  // PostgreSQL uses double quotes for identifier quoting. Convert to single quotes.
  // Match patterns like: like "%" or like "%foo%"
  translated = translated.replace(/like\s+"(%[^"]*%?)"/gi, (match, pattern) => {
    return `like '${pattern}'`;
  });
  translated = translated.replace(/like\s+"([^"]*%[^"]*)"/gi, (match, pattern) => {
    return `like '${pattern}'`;
  });

  // DATE(NOW()) → CURRENT_DATE
  translated = translated.replace(/DATE\(NOW\(\)\)/gi, "CURRENT_DATE");

  // IFNULL → COALESCE
  translated = translated.replace(/IFNULL\s*\(/gi, "COALESCE(");

  if (isDDL(translated) && params && params.length > 0) {
    // For DDL, inline the parameters directly (escape to prevent injection)
    let paramIndex = 0;
    translated = translated.replace(/\?/g, () => {
      const val = params[paramIndex++];
      if (typeof val === "number") return String(val);
      return "'" + String(val).replace(/'/g, "''") + "'";
    });
    return { sql: translated, params: [] };
  }

  // Replace ? placeholders with $1, $2, ...
  let paramIndex = 0;
  translated = translated.replace(/\?/g, () => {
    paramIndex++;
    return `$${paramIndex}`;
  });

  return { sql: translated, params: params || [] };
}

function createConnection() {
  const client = new Client({
    host: process.env.DB_HOST || "127.0.0.1",
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "rootpass",
    database: process.env.DB_NAME || "nodelogin",
  });

  client.connect().catch((err) => {
    console.error("PG connection error:", err.message);
  });

  // Wrap the pg client to expose a mysql-compatible .query() interface
  const wrapper = {
    query: function (sql, paramsOrCallback, maybeCallback) {
      let params = [];
      let callback;

      if (typeof paramsOrCallback === "function") {
        callback = paramsOrCallback;
      } else {
        params = paramsOrCallback || [];
        callback = maybeCallback;
      }

      const translated = translateQuery(sql, params);

      client
        .query(translated.sql, translated.params)
        .then((result) => {
          // mysql driver returns (err, rows), pg returns { rows, rowCount, ... }
          if (callback) callback(null, result.rows);
        })
        .catch((err) => {
          console.error("PG query error:", err.message);
          console.error("  Original SQL:", sql);
          console.error("  Translated SQL:", translated.sql);
          console.error("  Params:", translated.params);
          if (callback) callback(err, null);
        });
    },
    connect: function (cb) {
      // Already connected above; just invoke callback
      if (cb) cb(null);
    },
    end: function () {
      client.end();
    },
  };

  return wrapper;
}

module.exports = createConnection;
