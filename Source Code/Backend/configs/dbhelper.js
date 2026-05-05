// This file is no longer needed with MongoDB/Mongoose
// All database operations are now handled through Mongoose models
// Keeping this file for backward compatibility, but it's deprecated

module.exports = {
  query: () => {
    throw new Error('SQL queries are deprecated. Use Mongoose models instead.');
  }
};
