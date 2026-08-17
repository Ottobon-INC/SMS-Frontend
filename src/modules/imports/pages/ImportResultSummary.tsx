import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowRight, CheckCircle2, FileCheck, IndianRupee, Users } from "lucide-react";

type ImportResultSummaryProps = {
  importType?: "students" | "fees";
};

export function ImportResultSummary({ importType = "students" }: ImportResultSummaryProps) {
  const navigate = useNavigate();
  const { batchId } = useParams<{ batchId: string }>();
  const location = useLocation();
  const isFeeImport = importType === "fees";

  // Check if we arrived here legitimately via navigation state
  const hasValidState = !!location.state?.batchId;

  if (!hasValidState) {
    return (
      <div className="min-h-full bg-slate-50 p-6 md:p-10">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileCheck className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Import Result Unavailable</h2>
            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
              Import result information is no longer available. Return to Student Import to start another import.
            </p>
            <button
              onClick={() => navigate("/imports")}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
            >
              Back to Student Import
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 p-6 md:p-10">
      <div className="max-w-3xl mx-auto mt-4 md:mt-10">
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-900/5 p-10 md:p-14 flex flex-col items-center text-center overflow-hidden relative">
          
          {/* Background Glow */}
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-emerald-50/80 to-transparent pointer-events-none" />

          {/* Icon */}
          <div className="relative w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6 shadow-inner border border-emerald-200/60">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-3 relative z-10">
            Import Completed Successfully
          </h1>
          
          <p className="text-base text-slate-500 mb-10 max-w-lg leading-relaxed relative z-10 font-medium">
            {isFeeImport
              ? "The fee accounts have been created and initial ledger entries have been posted to the database."
              : "The students have been successfully imported and enrolled. Guardian accounts have been created."}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md mb-10 relative z-10">
            <button 
              onClick={() => navigate(isFeeImport ? "/fees" : "/students")}
              className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-5 py-3.5 border border-slate-200 hover:border-slate-300 text-sm font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98]"
            >
              {isFeeImport ? <IndianRupee className="w-4 h-4 text-slate-400" /> : <Users className="w-4 h-4 text-slate-400" />}
              {isFeeImport ? "View Fees" : "View Roster"}
            </button>
            
            <button 
              onClick={() => navigate("/imports")}
              className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-5 py-3.5 border border-transparent text-sm font-bold rounded-xl text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-md active:scale-[0.98]"
            >
              Import More
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-400 relative z-10">
            Batch Reference: <span className="text-slate-600 select-all">{batchId}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
