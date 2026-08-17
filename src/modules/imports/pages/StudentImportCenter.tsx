import { useNavigate } from "react-router-dom";
import { ArrowRight, IndianRupee, UploadCloud, UserPlus } from "lucide-react";

export function StudentImportCenter() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-slate-50">
      {/* Hero */}
      <div className="bg-slate-900 px-6 py-8 md:px-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Student Import Center</h1>
          <p className="text-slate-400 text-sm">
            Add students individually or import multiple students using a structured template.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Manual Add */}
          <button
            onClick={() => navigate("/imports/manual")}
            className="group text-left bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-slate-300 transition-all active:scale-[0.98]"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1.5">Manual Add Student</h2>
            <p className="text-sm text-slate-500 mb-5 leading-relaxed">
              Add and enroll one student with their academic placement and guardian details.
            </p>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 group-hover:gap-2.5 transition-all">
              Add Student
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Template Import */}
          <button
            onClick={() => navigate("/imports/template")}
            className="group text-left bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-slate-300 transition-all active:scale-[0.98]"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1.5">Template Import</h2>
            <p className="text-sm text-slate-500 mb-5 leading-relaxed">
              Import multiple students at once using the approved Excel template.
            </p>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 group-hover:gap-2.5 transition-all">
              Import Students
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Fee Import */}
          <button
            onClick={() => navigate("/imports/fees")}
            className="group text-left bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-slate-300 transition-all active:scale-[0.98]"
          >
            <div className="w-11 h-11 rounded-xl bg-teal-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1.5">Fee Data Import</h2>
            <p className="text-sm text-slate-500 mb-5 leading-relaxed">
              Download and upload the bulk fee setup template for active enrollments.
            </p>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-teal-700 group-hover:gap-2.5 transition-all">
              Fee Template
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
