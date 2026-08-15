import { useState, useEffect } from "react";
import { UploadCloud, File, AlertCircle, Loader2 } from "lucide-react";
import { useImportsApi } from "../hooks/useImportsApi";
import { env } from "../../../app/config/env";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

type UploadResponse = {
  batch_id: string;
};

type ErrorResponse = {
  detail?: string;
};

export function TemplateUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const { useBranches } = useImportsApi();
  const { data: branches, isLoading: loadingBranches } = useBranches();
  
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (branches && branches.length === 1 && !selectedBranch) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranch]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        setError("Please select a valid Excel file (.xlsx or .xls)");
        setSelectedFile(null);
        return;
      }
      setError(null);
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    try {
      const token = localStorage.getItem("auth_token");
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("branch_id", selectedBranch);

      const response = await fetch(`${env.apiBaseUrl}/imports/students/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errData = (await response.json()) as ErrorResponse;
        throw new Error(errData.detail || "Upload failed");
      }

      const data = (await response.json()) as UploadResponse;
      // Redirect to preview page using window.location for simplicity, or we could use react-router navigate
      window.location.href = `/imports/preview/${data.batch_id}`;

    } catch (err: unknown) {
      setError(getErrorMessage(err, "Upload failed"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Upload Student Template</h1>
        <p className="mt-2 text-sm text-gray-600">
          Upload your completed Excel template. The system will validate the data before finalizing the import.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        
        <div className="mb-6 space-y-2">
          <label className="text-sm font-medium text-gray-700">Target Branch (Optional)</label>
          <p className="text-xs text-gray-500 mb-1">If left empty, branch codes from the Excel file will be used.</p>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full max-w-md rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:opacity-75"
            disabled={loadingBranches || (branches?.length === 1)}
          >
            <option value="">Multi-Branch / Excel Provided</option>
            {branches?.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div 
          className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            accept=".xlsx,.xls"
            onChange={handleFileChange}
          />
          
          <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-sm mb-4">
            {selectedFile ? (
              <File className="h-8 w-8 text-emerald-500" />
            ) : (
              <UploadCloud className="h-8 w-8 text-indigo-500" />
            )}
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {selectedFile ? selectedFile.name : "Click to select a file"}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {selectedFile ? `${(selectedFile.size / 1024).toFixed(2)} KB` : "Excel files only (.xlsx, .xls)"}
          </p>
          
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            {selectedFile ? "Change File" : "Select File"}
          </button>
        </div>

        {error && (
          <div className="mt-6 flex items-center p-4 text-red-800 bg-red-50 rounded-lg">
            <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3 border-t pt-6">
          <button 
            className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => window.history.back()}
            disabled={isUploading}
          >
            Cancel
          </button>
          <button 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-6 disabled:opacity-50"
            onClick={handleUpload}
            disabled={!selectedFile || !selectedBranch || isUploading}
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
