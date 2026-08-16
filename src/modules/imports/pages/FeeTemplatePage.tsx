import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Download, File, IndianRupee, Loader2, UploadCloud } from "lucide-react";
import { importsApi } from "../api/importsApi";
import { useImportsApi } from "../hooks/useImportsApi";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function FeeTemplatePage() {
  const navigate = useNavigate();
  const { useBranches } = useImportsApi();
  const { data: branches, isLoading: loadingBranches } = useBranches();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (branches && branches.length === 1 && !selectedBranch) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranch]);

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    setError(null);
    try {
      const blob = await importsApi.downloadFeeTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "fee_import_template.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to download fee template"));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setError("Please select a valid Excel file (.xlsx or .xls).");
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const confirmed = window.confirm(
      "Upload this fee Excel file for validation? This will not create fee accounts yet. You will review and correct rows before final import."
    );
    if (!confirmed) return;

    setIsUploading(true);
    setError(null);
    try {
      const data = await importsApi.uploadFeeTemplate(selectedFile, selectedBranch || undefined);
      navigate(`/imports/fees/preview/${data.batch_id}`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Fee upload failed"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Bulk Fee Setup</p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold text-gray-900">
            <IndianRupee className="h-6 w-6 text-teal-600" />
            Fee Data Import
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Download the approved fee template for active student enrollments, fill fee rows, then upload it for validation before final posting.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadTemplate}
          disabled={isDownloading}
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {isDownloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparing...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download Fee Template
            </>
          )}
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 grid gap-3 rounded-xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-950">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
            <p>
              The template includes the operational fee columns needed for MVP setup: assigned fee, government scholarship,
              concession, payment schedule type, and notes.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
            <p>
              Use the <strong>Eligible Enrollments</strong> sheet to copy admission numbers and academic-year values exactly.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
            <p>Payment receipts are not part of this template. Receipts will be posted from the Fees module after fee accounts exist.</p>
          </div>
        </div>

        <div className="mb-6 space-y-2">
          <label className="text-sm font-medium text-gray-700">Target Branch (Optional)</label>
          <p className="mb-1 text-xs text-gray-500">
            Select a branch when admission numbers may repeat across branches. Branch-scoped users are locked to their assigned branch.
          </p>
          <select
            value={selectedBranch}
            onChange={(event) => setSelectedBranch(event.target.value)}
            className="w-full max-w-md rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:opacity-75"
            disabled={loadingBranches || branches?.length === 1}
          >
            <option value="">Current context / detect from enrollment</option>
            {branches?.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        <div
          className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-10 text-center transition hover:bg-gray-100"
          onClick={() => document.getElementById("fee-file-upload")?.click()}
        >
          <input
            type="file"
            id="fee-file-upload"
            className="hidden"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
          />
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
            {selectedFile ? <File className="h-8 w-8 text-emerald-500" /> : <UploadCloud className="h-8 w-8 text-indigo-500" />}
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedFile ? selectedFile.name : "Click to select a fee template file"}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
            {selectedFile ? `${(selectedFile.size / 1024).toFixed(2)} KB` : "Excel files only (.xlsx, .xls)"}
          </p>
          <button className="mt-4 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            {selectedFile ? "Change File" : "Select File"}
          </button>
        </div>

        {error && (
          <div className="mt-6 flex items-center rounded-lg bg-red-50 p-4 text-red-800">
            <AlertCircle className="mr-3 h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3 border-t pt-6">
          <button
            className="rounded-md border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => navigate("/imports")}
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            className="inline-flex h-10 items-center justify-center rounded-md bg-indigo-600 px-6 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload and Validate"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
