import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, AlertTriangle, XCircle, Loader2, Pencil, Save } from "lucide-react";
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
  return "-";
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
  "Student Created"
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
  "Notes"
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
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editedRow, setEditedRow] = useState<Record<string, unknown>>({});
  const [isSavingRow, setIsSavingRow] = useState(false);

  useEffect(() => {
    if (batchId) {
      loadPreview(batchId);
    }
  }, [batchId]);

  const loadPreview = async (id: string) => {
    try {
      setIsLoading(true);
      const res = importType === "fees" ? await importsApi.getFeePreview(id) : await importsApi.getPreview(id);
      setData(res);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load preview"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!batchId) return;
    setActionError(null);
    setIsCommitting(true);
    try {
      if (importType === "fees") {
        await importsApi.commitFeeBatch(batchId);
        navigate(`/imports/fees/summary/${batchId}`);
      } else {
        await importsApi.commitBatch(batchId);
        navigate(`/imports/summary/${batchId}`);
      }
    } catch (err: unknown) {
      setActionError(getErrorMessage(err, "Failed to commit import"));
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
  };

  const updateEditedCell = (column: string, value: string) => {
    setEditedRow((current) => ({ ...current, [column]: value }));
  };

  const saveEditedRow = async () => {
    if (!batchId || !editingRowId) return;
    const confirmed = window.confirm("Save this row correction and revalidate the import preview?");
    if (!confirmed) return;
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
      setError(getErrorMessage(err, "Failed to save row correction"));
    } finally {
      setIsSavingRow(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center">
          <XCircle className="h-5 w-5 mr-3" />
          {error || "Preview data not available"}
        </div>
        <button onClick={() => navigate("/imports")} className="mt-4 text-indigo-600 hover:underline">Back to Imports</button>
      </div>
    );
  }

  const { batch, rows } = data;
  const summary = batch.summary || {};
  const rejectedRows = getSummaryNumber(summary, "rejected_rows");
  const hasRejected = rejectedRows > 0;
  const hasCommitPermission = auth.hasPermission("import.commit");
  const previewColumns = importType === "fees" ? feePreviewColumns : studentPreviewColumns;
  const importSubject = importType === "fees" ? "fee accounts" : "student records";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Validation Preview</h1>
          <p className="mt-2 text-sm text-gray-600">
            Review extracted rows before final import. Valid rows and warning rows can be finalized; rejected rows must be corrected first.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => navigate("/imports")}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={isCommitting}
          >
            Cancel Import
          </button>
          <button 
            onClick={handleCommit}
            disabled={hasRejected || isCommitting || !hasCommitPermission}
            title={!hasCommitPermission ? "Your current role does not have import.commit permission." : undefined}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-6 disabled:opacity-50"
          >
            {isCommitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {isCommitting ? "Committing..." : "Finalize Import"}
          </button>
        </div>
      </div>

      {!hasCommitPermission && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start">
          <AlertTriangle className="h-5 w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-amber-900">Finalize Permission Required</h4>
            <p className="text-sm text-amber-800 mt-1">
              Your current role can upload and validate imports, but it does not currently have the import.commit permission required to create {importSubject}.
            </p>
          </div>
        </div>
      )}

      {actionError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <XCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-red-800">Finalize Failed</h4>
            <p className="text-sm text-red-700 mt-1">{actionError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center">
          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center mr-4">
            <span className="text-gray-600 font-semibold">{getSummaryNumber(summary, "total_rows")}</span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Rows</p>
            <p className="text-sm font-medium text-gray-900">Processed</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center mr-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Valid</p>
            <p className="text-sm font-medium text-gray-900">{getSummaryNumber(summary, "valid_rows")}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center">
          <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center mr-4">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Warnings</p>
            <p className="text-sm font-medium text-gray-900">{getSummaryNumber(summary, "warning_rows")}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center">
          <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center mr-4">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Rejected</p>
            <p className="text-sm font-medium text-gray-900">{rejectedRows}</p>
          </div>
        </div>
      </div>

      {hasRejected && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-red-800">Import Blocked</h4>
            <p className="text-sm text-red-700 mt-1">
              You cannot finalize this import because some rows contain critical errors.
              Edit the affected rows below and save each correction to revalidate the preview.
              Finalizing this batch will create {importSubject}.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="max-h-[58vh] overflow-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="sticky top-0 z-10 bg-gray-50 px-4 py-3 font-medium">Actions</th>
                <th className="px-4 py-3 font-medium">Row</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {previewColumns.map((column) => (
                  <th key={column} className="sticky top-0 z-10 bg-gray-50 px-4 py-3 font-medium">
                    {column}
                  </th>
                ))}
                <th className="px-4 py-3 font-medium">Validation Messages</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row: ImportRowResult) => {
                const isRejected = row.validation_status === "REJECTED";
                const isWarning = row.validation_status === "WARNING";
                const isValid = row.validation_status === "VALID";
                const isEditing = editingRowId === row.id;
                
                return (
                  <tr key={row.id} className={isRejected ? "bg-red-50/50" : ""}>
                    <td className="px-4 py-3 align-top">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={saveEditedRow}
                            disabled={isSavingRow}
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {isSavingRow ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditingRow}
                            disabled={isSavingRow}
                            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditingRow(row)}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit Row
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{row.row_number}</td>
                    <td className="px-4 py-3">
                      {isValid && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Valid</span>}
                      {isWarning && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Warning</span>}
                      {isRejected && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Rejected</span>}
                    </td>
                    {previewColumns.map((column) => (
                      <td key={column} className="px-4 py-3 text-gray-500 align-top">
                        {isEditing ? (
                          <input
                            value={getEditableValue(editedRow[column])}
                            onChange={(event) => updateEditedCell(column, event.target.value)}
                            disabled={column === "Student Created" || isSavingRow}
                            className="w-44 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
                          />
                        ) : (
                          <span className={column === "Student Name" ? "font-medium text-gray-900" : ""}>
                            {getDisplayValue(row.raw_data[column])}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-gray-500 min-w-[300px] whitespace-normal">
                      {row.errors && row.errors.length > 0 ? (
                        <ul className="list-disc pl-4 space-y-1">
                          {row.errors.map((err, i) => (
                            <li key={i} className={isRejected ? "text-red-600" : "text-amber-600"}>
                              <span className="font-medium">{err.field}:</span> {err.message}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400 italic">No issues</span>
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
  );
}
