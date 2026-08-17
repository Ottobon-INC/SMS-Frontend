import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  File,
  X,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { useImportsApi } from "../hooks/useImportsApi";
import { importsApi } from "../api/importsApi";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes("403") || msg.includes("Unauthorized") || msg.includes("authorized")) {
      return "You do not have access to import students into this branch.";
    }
    if (msg.includes("Invalid file") || msg.includes("xlsx")) {
      return "The uploaded file is not a valid Excel file. Please use the provided template.";
    }
    return msg;
  }
  return fallback;
}

const STEPS = [
  { n: 1, label: "Download Template" },
  { n: 2, label: "Fill Student Data" },
  { n: 3, label: "Upload & Validate" },
];

export function TemplateUploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const { useBranches } = useImportsApi();
  const { data: branches, isLoading: loadingBranches } = useBranches();

  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Auto-select single branch
  useEffect(() => {
    if (branches && branches.length === 1 && !selectedBranch) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranch]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setError("Only Excel files (.xlsx) are supported. Please use the official template.");
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
    setShowConfirm(false);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);
    try {
      const blob = await importsApi.downloadStudentTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "student_import_template.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to download template. Please try again."));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setShowConfirm(false);
    setIsUploading(true);
    setError(null);
    try {
      // Pass branchId only if one is selected — omit entirely if blank (multi-branch Excel)
      const data = await importsApi.uploadStudentTemplate(
        selectedFile,
        selectedBranch || undefined
      );
      navigate(`/imports/preview/${data.batch_id}`);
    } catch (err) {
      setError(getErrorMessage(err, "Upload failed. Please check your file and try again."));
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setShowConfirm(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-full bg-slate-50">
      {/* Hero */}
      <div className="bg-slate-900 px-4 md:px-10 pt-6 pb-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate("/imports")}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-medium mb-5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Student Import Center
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <UploadCloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Template Import</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Import multiple students using the approved Excel template.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-5">
        {/* Step Guide */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {s.n}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{s.label}</p>
                  {i === 0 && (
                    <p className="text-xs text-slate-400 mt-0.5">Get the official Excel template</p>
                  )}
                  {i === 1 && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Fill in student, guardian, and placement data
                    </p>
                  )}
                  {i === 2 && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Upload the file — review rows before import
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Download */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 mb-1">Step 1 — Download Template</h2>
              <p className="text-sm text-slate-500">
                Use only the official template. Do not alter column headers.
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Branch Code per row
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Guardian details included
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Student Number is auto-generated
                </span>
              </div>
            </div>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 shadow-sm"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Preparing…
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Template
                </>
              )}
            </button>
          </div>
        </div>

        {/* Upload */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-bold text-slate-800">Step 3 — Upload Completed Template</h2>

          {/* Branch selector */}
          {!loadingBranches && branches && branches.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Branch (Optional)
              </label>
              <p className="text-xs text-slate-400 mb-2">
                Leave empty if your Excel file contains multiple branches via Branch Code column.
              </p>
              <div className="relative max-w-xs">
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 bg-white border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all pr-9 shadow-sm"
                >
                  <option value="">Multi-Branch (use Excel Branch Code)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Drop zone */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="student-file-upload"
            />
            {selectedFile ? (
              <div className="border border-slate-200 rounded-xl p-4 flex items-center gap-4 bg-slate-50">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <File className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB · Excel Spreadsheet
                  </p>
                </div>
                <button
                  onClick={clearFile}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="student-file-upload"
                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-10 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-3">
                  <UploadCloud className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Click to select your file</p>
                <p className="text-xs text-slate-400">Excel files only (.xlsx)</p>
              </label>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">Upload Error</p>
                <p className="text-sm text-red-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              onClick={() => navigate("/imports")}
              disabled={isUploading}
              className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!selectedFile || isUploading}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-40 shadow-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  Upload & Validate
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Inline Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-2">Upload for Validation?</h3>
            <p className="text-sm text-slate-500 mb-1">
              <span className="font-semibold text-slate-800">{selectedFile?.name}</span>
            </p>
            <p className="text-sm text-slate-500 mb-5">
              Your file will be validated. No student records will be created until you review and confirm the import.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all"
              >
                Upload & Validate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
