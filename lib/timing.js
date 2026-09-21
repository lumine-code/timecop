// Package and startup timings are diagnostic data. A failed or interrupted
// measurement must never make the panel render the JavaScript value `NaN`.
module.exports = function normalizeDuration(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value == null) return 0;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};
