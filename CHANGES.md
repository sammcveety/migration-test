# Changes to Original HMS Code

This documents every change made to the [alinadir44/HMS](https://github.com/alinadir44/HMS) source code.

## Bug fixes (pre-existing bugs in the original repo)

1. **`app.js`**: `'view engine '` → `'view engine'` (trailing space)
2. **`appointment.js`**: Removed trailing `=` from JOIN query
3. **`appointment.js`**: `apt_id` → `aptid` (2 occurrences — column name didn't match schema)
4. **`appointment.ejs`**: `doctor_name` → `staff_name` (JOIN returns staff columns)
5. **`appointment.ejs`**: `apt_id` → `aptid` in delete link
6. **`appointment.ejs`**: Removed duplicate `<!--<% } %>-->` causing EJS parse error

## Infrastructure changes (needed for the migration framework)

7. **`db_controller.js`**: `throw err` → `console.error(...)` (don't crash on connection failure)
8. **`db_config.js`**: Rewritten to read from env vars + support `DB_DRIVER=pg` switching
9. **`db_config_pg.js`**: New file — PostgreSQL compatibility wrapper
10. **All 10 controllers**: Replaced hardcoded `mysql.createConnection({...})` with `require('./db_config')()`

## Nothing added that needs cleanup

- No `console.log` debug statements were added
- No TODOs left behind
- The `console.error` in `db_controller.js` line 10 is intentional (graceful error handling replacing a crash)
- The `console.error` calls in `db_config_pg.js` are production-appropriate error logging
