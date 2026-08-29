/**
 * Response Helpers
 * Path: utils/respond.js
 * Envelope chuẩn: { success: true, data } | { success: false, error }
 */

function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

function created(res, data) {
  return ok(res, data, 201);
}

/** Convert NUMERIC strings from pg to JS numbers on known money/number fields */
const NUMBER_FIELDS = new Set([
  'salary', 'budget', 'spent', 'amount', 'baseSalary', 'allowances',
  'deductions', 'advanceDeduction', 'netSalary', 'monthlyDeduction',
  'remainingBalance', 'balance', 'days', 'totalProjects', 'totalExpenses',
  'totalEmployees', 'pendingTasks', 'monthlyIncome', 'monthlyExpenses',
  'thu', 'chi', 'rentAmount', 'deposit', 'amountDue', 'amountPaid',
  'payAmount', 'totalDue', 'totalPaid',
  'ownerRent', 'ownerDeposit', 'buildingFee', 'companyFee', 'grossMargin',
  'ownerTotalDue', 'ownerTotalPaid', 'area',
]);

function numerify(row) {
  if (row === null || row === undefined) return row;
  if (Array.isArray(row)) return row.map(numerify);
  if (typeof row !== 'object') return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = NUMBER_FIELDS.has(k) && v !== null ? Number(v) : v;
  }
  return out;
}

module.exports = { ok, created, numerify };
