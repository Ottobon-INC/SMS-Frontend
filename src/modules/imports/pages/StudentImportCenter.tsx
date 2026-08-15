import { useNavigate } from "react-router-dom";
import { UserPlus, UploadCloud, ArrowRight } from "lucide-react";

export function StudentImportCenter() {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Student Import Center</h1>
        <p className="mt-2 text-sm text-gray-600">
          Choose how you would like to onboard students into the system.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* Manual Add Card */}
        <div 
          onClick={() => navigate("/imports/manual")}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col"
        >
          <div className="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
            <UserPlus className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Manual Add Student</h2>
          <p className="text-sm text-gray-600 flex-grow mb-6">
            Add one student at a time using a guided form. Perfect for late enrollments, transfers, or walk-ins.
          </p>
          <div className="flex items-center text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
            Add Student
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        {/* Template Import Card */}
        <div 
          onClick={() => navigate("/imports/template")}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col"
        >
          <div className="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
            <UploadCloud className="h-6 w-6 text-emerald-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Template Import</h2>
          <p className="text-sm text-gray-600 flex-grow mb-6">
            Upload multiple student records using the approved Excel template. Best for bulk onboarding at the start of a year.
          </p>
          <div className="flex items-center text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
            Import Students
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
