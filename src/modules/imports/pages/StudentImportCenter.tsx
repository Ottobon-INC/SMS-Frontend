import { useNavigate } from "react-router-dom";
import { ArrowRight, IndianRupee, UploadCloud, UserPlus, Lightbulb, CheckCircle2 } from "lucide-react";

export function StudentImportCenter() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-slate-50 pb-20">
      {/* Hero */}
      <div className="bg-slate-900 px-6 py-8 md:px-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Student Onboarding</h1>
          <p className="text-slate-400 text-sm">
            Add individual students or onboard multiple students using structured imports.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-10">
        
        {/* Action Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              Import Fees
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </section>

        {/* Quick Start & Guidance Section */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-slate-200">
          
          <div className="md:col-span-8">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Quick Start Guide</h3>
            <div className="space-y-3">
              <div className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4 shadow-sm">
                <span className="text-3xl font-black text-slate-200 mt-1">01</span>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">Add one student manually</h4>
                  <p className="text-sm text-slate-500">
                    Best for adding a single transfer student mid-year. This form immediately creates the student and enrollment records.
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4 shadow-sm">
                <span className="text-3xl font-black text-slate-200 mt-1">02</span>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">Use Excel for bulk onboarding</h4>
                  <p className="text-sm text-slate-500">
                    Download the structured template to prepare data offline. Ideal for the start of a new academic year.
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4 shadow-sm">
                <span className="text-3xl font-black text-slate-200 mt-1">03</span>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">Review validation before committing</h4>
                  <p className="text-sm text-slate-500">
                    The system safely validates all rows before saving. You can edit and correct rejected rows directly in the browser preview.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-4 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Before You Import
            </h3>
            
            <ul className="space-y-3">
              {[
                "Keep admission numbers unique",
                "Use the correct Branch Code",
                "Confirm Academic Year matches",
                "Do not modify template headers",
              ].map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-600 font-medium leading-tight">{tip}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-800 font-medium leading-relaxed">
                Need more help formatting your import data? Check the guidelines included on the second sheet of your downloaded template.
              </p>
            </div>
          </div>

        </section>

      </div>
    </div>
  );
}
