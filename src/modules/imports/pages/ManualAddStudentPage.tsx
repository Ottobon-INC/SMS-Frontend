import { ManualAddStudentForm } from "../components/ManualAddStudentForm";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus } from "lucide-react";

export function ManualAddStudentPage() {
  const navigate = useNavigate();

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
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Manual Add Student</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Complete the form below to enroll a single student.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <ManualAddStudentForm />
      </div>
    </div>
  );
}
