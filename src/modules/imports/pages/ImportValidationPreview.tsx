import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Pencil,
  Save,
  ArrowRight,
  X,
  FileCheck,
} from "lucide-react";
import { importsApi, PreviewResponse, ImportRowResult } from "../api/importsApi";
import { useAuth } from "../../authentication/providers/AuthProvider";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function getSummaryNumber(summary: Record<string, unknown>, key: string): number {
  const value = summary[key];
  return typeof value === "number" ? value : 0;
}

function getDisplayValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "—";
}

function getEditableValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

const studentPreviewColumns = [
  "Admission No",
  "Student Name",
  "Gender",
  "Date Of Birth",
  "Student Mobile",
  "Student Email",
  "Academic Year",
  "Programme / Stream",
  "Section",
  "Roll No",
  "Joining Date",
  "Ending Date",
  "Guardian Name",
  "Relationship",
  "Guardian Phone",
  "Guardian Email",
  "Student Created",
] as const;

const feePreviewColumns = [
  "Admission No",
  "Student Name",
  "Academic Year",
  "Programme / Stream",
  "Section",
  "Assigned Fee",
  "Government Scholarship",
  "Concession",
  "Payment Schedule Type",
  "Notes",
] as const;

type ImportValidationPreviewProps = {
  importType?: "students" | "fees";
};

export function ImportValidationPreview({ importType = "students" }: ImportValidationPreviewProps) {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const auth = useAuth();

  const [data, setData] = useState<PreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  
  // Row Editing
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editedRow, setEditedRow] = useState<Record<string, unknown>>({});
  const [isSavingRow, setIsSavingRow] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);

  // Commit Modal
  const [showCommitModal, setShowCommitModal] = useState(false);

  useEffect(() => {
    if (batchId) {
      loadPreview(batchId);
    }
  }, [batchId]);

  const loadPreview = async (id: string) => {
    try {
      setIsLoading(true);
      const res =
        importType === "fees" ? await importsApi.getFeePreview(id) : await importsApi.getPreview(id);
      setData(res);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load preview data"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!batchId) return;
    setActionError(null);
    setIsCommitting(true);
    setShowCommitModal(false);
    try {
      if (importType === "fees") {
        await importsApi.commitFeeBatch(batchId);
        navigate(`/imports/fees/summary/${batchId}`, { state: { batchId } });
      } else {
        await importsApi.commitBatch(batchId);
        navigate(`/imports/summary/${batchId}`, { state: { batchId } });
      }
    } catch (err: unknown) {
      setActionError(getErrorMessage(err, "Failed to commit import. Please try again."));
      setIsCommitting(false);
    }
  };

  const startEditingRow = (row: ImportRowResult) => {
    setError(null);
    setEditingRowId(row.id);
    setEditedRow({ ...row.raw_data });
  };

  const cancelEditingRow = () => {
    setEditingRowId(null);
    setEditedRow({});
    setShowEditConfirm(false);
  };

  const updateEditedCell = (column: string, value: string) => {
    setEditedRow((current) => ({ ...current, [column]: value }));
  };

  const saveEditedRow = async () => {
    if (!batchId || !editingRowId) return;
    setShowEditConfirm(false);
    setIsSavingRow(true);
    try {
      const correctedPreview =
        importType === "fees"
          ? await importsApi.correctFeePreviewRow(batchId, editingRowId, editedRow)
          : await importsApi.correctPreviewRow(batchId, editingRowId, editedRow);
      setData(correctedPreview);
      setEditingRowId(null);
      setEditedRow({});
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save row correction."));
    } finally {
      setIsSavingRow(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-full bg-slate-50 flex items-center justify-center p-10">
        <div className="flex flex-col items-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-slate-900" />
          <p className="text-sm font-semibold">Loading validation preview…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-full bg-slate-50 p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
            <XCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-red-900">Preview Error</h2>
              <p className="text-sm text-red-700 mt-1">{error || "Preview data not available"}</p>
              <button
                onClick={() => navigate("/imports")}
                className="mt-4 px-4 py-2 bg-white border border-red-200 text-red-700 text-sm font-semibold rounded-xl hover:bg-red-50 transition-all"
              >
                Back to Student Import
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { batch, rows } = data;
  const summary = batch.summary || {};
  const totalRows = getSummaryNumber(summary, "total_rows");
  const validRows = getSummaryNumber(summary, "valid_rows");
  const warningRows = getSummaryNumber(summary, "warning_rows");
  const rejectedRows = getSummaryNumber(summary, "rejected_rows");

  const hasRejected = rejectedRows > 0;
  const hasCommitPermission = auth.hasPermission("import.commit");
  const previewColumns = importType === "fees" ? feePreviewColumns : studentPreviewColumns;
  const importSubject = importType === "fees" ? "fee accounts" : "student records";

  return (
    <div className="min-h-full bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-slate-900 px-6 py-6 md:px-10 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Validation Preview</h1>
            <p className="text-slate-400 text-sm mt-1">
              Review extracted rows before final import. Correct rejected rows to proceed.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/imports")}
              disabled={isCommitting}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-sm font-semibold transition-all"
            >
              Cancel Import
            </button>
            <button
              onClick={() => setShowCommitModal(true)}
              disabled={hasRejected || isCommitting || !hasCommitPermission}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:hover:bg-emerald-600 shadow-sm"
              title={!hasCommitPermission ? "You do not have import.commit permission." : undefined}
            >
              {isCommitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Committing…
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  Import Validated Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Permission / Action Errors */}
        {!hasCommitPermission && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">Permission Required</h4>
              <p className="text-sm text-amber-800 mt-0.5">
                Your role can validate imports but does not have the <span className="font-semibold">import.commit</span> permission required to finalize {importSubject}.
              </p>
            </div>
          </div>
        )}

        {actionError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-red-900">Failed to Finalize</h4>
              <p className="text-sm text-red-700 mt-0.5">{actionError}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Rows"
            value={totalRows}
            icon={<div className="w-2.5 h-2.5 rounded-full bg-slate-400" />}
          />
          <StatCard
            label="Valid"
            value={validRows}
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            highlight="emerald"
          />
          <StatCard
            label="Warnings"
            value={warningRows}
            icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
            highlight={warningRows > 0 ? "amber" : undefined}
          />
          <StatCard
            label="Rejected"
            value={rejectedRows}
            icon={<XCircle className="w-4 h-4 text-red-500" />}
            highlight={rejectedRows > 0 ? "red" : undefined}
          />
        </div>

        {hasRejected && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-red-900">Action Required: Fix Rejected Rows</h4>
              <p className="text-sm text-red-700 mt-0.5">
                The import cannot be finalized because {rejectedRows} row(s) contain critical errors.
                Edit the affected rows below to correct the data, or upload a new file.
              </p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="sticky top-0 z-10 bg-slate-50/80 px-5 py-4 font-semibold">Actions</th>
                  <th className="px-5 py-4 font-semibold">Row</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  {previewColumns.map((col) => (
                    <th key={col} className="sticky top-0 z-10 bg-slate-50/80 px-5 py-4 font-semibold">
                      {col}
                    </th>
                  ))}
                  <th className="px-5 py-4 font-semibold">Validation Messages</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row: ImportRowResult) => {
                  const isRejected = row.validation_status === "REJECTED";
                  const isWarning = row.validation_status === "WARNING";
                  const isValid = row.validation_status === "VALID";
                  const isEditing = editingRowId === row.id;

                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors ${isRejected ? "bg-red-50/30" : "hover:bg-slate-50/50"}`}
                    >
                      <td className="px-5 py-3 align-top">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setShowEditConfirm(true)}
                              disabled={isSavingRow}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm"
                            >
                              {isSavingRow ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Save className="w-3.5 h-3.5" />
                              )}
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditingRow}
                              disabled={isSavingRow}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditingRow(row)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                          >
                            <Pencil className="w-3.5 h-3.5 text-slate-400" />
                            Edit Row
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-500 font-medium">{row.row_number}</td>
                      <td className="px-5 py-3">
                        {isValid && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100/50 border border-emerald-200 text-emerald-700">
                            Valid
                          </span>
                        )}
                        {isWarning && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100/50 border border-amber-200 text-amber-700">
                            Warning
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100/50 border border-red-200 text-red-700">
                            Rejected
                          </span>
                        )}
                      </td>
                      {previewColumns.map((col) => {
                        const colError = row.errors?.find((err) => err.field === col);
                        const hasError = !!colError;

                        return (
                          <td key={col} className={`px-5 py-3 text-slate-600 align-top transition-colors ${hasError && !isEditing ? "bg-red-50/60" : ""}`}>
                            {isEditing ? (
                              <input
                                value={getEditableValue(editedRow[col])}
                                onChange={(e) => updateEditedCell(col, e.target.value)}
                                disabled={col === "Student Created" || isSavingRow}
                                title={colError?.message}
                                className={`w-48 rounded-md border px-2.5 py-1.5 text-xs outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 transition-all ${
                                  hasError 
                                    ? "bg-red-50/80 border-red-300 text-red-900 focus:border-red-500 focus:ring-red-200"
                                    : "bg-white border-transparent hover:border-slate-300 focus:border-slate-900 focus:ring-slate-200 text-slate-900 shadow-[0_0_0_1px_rgba(0,0,0,0.05)]"
                                }`}
                              />
                            ) : (
                              <span
                                title={colError?.message}
                                className={`inline-block ${
                                  col === "Student Name" ? "font-bold text-slate-900" : ""
                                } ${hasError ? "text-red-700 font-medium" : ""}`}
                              >
                                {getDisplayValue(row.raw_data[col])}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-5 py-3 text-slate-600 min-w-[320px] whitespace-normal">
                        {row.errors && row.errors.length > 0 ? (
                          <ul className="flex flex-col gap-1.5">
                            {row.errors.map((err, i) => (
                              <li
                                key={i}
                                className={`text-xs flex items-start gap-1.5 ${
                                  isRejected ? "text-red-700" : "text-amber-700"
                                }`}
                              >
                                <span className="mt-0.5">•</span>
                                <span>
                                  <span className="font-bold">{err.field}:</span> {err.message}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-slate-400 italic text-xs font-medium">No issues found</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Commit Confirm Modal */}
      {showCommitModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Confirm Student Import</h3>
              <button onClick={() => setShowCommitModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 bg-slate-50/50">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-semibold">Valid rows</span>
                  <span className="font-bold text-emerald-600">{validRows}</span>
                </div>
                {warningRows > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-semibold">Warnings</span>
                    <span className="font-bold text-amber-600">{warningRows}</span>
                  </div>
                )}
                {rejectedRows > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-semibold">Rejected</span>
                    <span className="font-bold text-red-600">{rejectedRows}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-600 mb-6 font-medium">
                Continue with the validated import? Valid and warning rows will be processed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCommitModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCommit}
                  className="flex-1 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-all"
                >
                  Import Students
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Row Edit Confirm Modal */}
      {showEditConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-2">Save Row Correction?</h3>
            <p className="text-sm text-slate-500 mb-6">
              The preview will be revalidated against your corrected data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEditConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveEditedRow}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
              >
                Save & Validate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  highlight?: "emerald" | "amber" | "red";
}) {
  const bgColors = {
    emerald: "bg-emerald-50/50 border-emerald-100 text-emerald-900",
    amber: "bg-amber-50/50 border-amber-100 text-amber-900",
    red: "bg-red-50/50 border-red-100 text-red-900",
    default: "bg-white border-slate-200 text-slate-900",
  };
  const bgClass = highlight ? bgColors[highlight] : bgColors.default;

  return (
    <div className={`p-5 rounded-2xl border ${bgClass} shadow-sm flex flex-col justify-between`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
