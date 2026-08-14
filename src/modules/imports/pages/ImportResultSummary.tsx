import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Users, ArrowRight } from "lucide-react";

export function ImportResultSummary() {
  const navigate = useNavigate();
  const { batchId } = useParams<{ batchId: string }>();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 flex flex-col items-center text-center">
        <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Import Successful!</h1>
        <p className="text-lg text-gray-600 mb-8 max-w-lg">
          The students have been successfully imported and enrolled. Guardian accounts have been created but are not yet activated.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md mb-8">
          <button 
            onClick={() => navigate("/students")}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Users className="h-5 w-5 mr-2 text-gray-500" />
            View Students
          </button>
          
          <button 
            onClick={() => navigate("/imports")}
            className="flex items-center justify-center px-4 py-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Import More
            <ArrowRight className="h-5 w-5 ml-2" />
          </button>
        </div>
        
        <div className="text-sm text-gray-500 border-t w-full pt-6">
          Batch ID: {batchId}
        </div>
      </div>
    </div>
  );
}
