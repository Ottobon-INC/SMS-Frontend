import { useState } from "react";
import { useImportsApi } from "../hooks/useImportsApi";
import { AlertCircle, CheckCircle2, UserPlus, Loader2 } from "lucide-react";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

type Props = {
  guardianId: string;
};

export function PortalActivationCard({ guardianId }: Props) {
  const { useActivatePortal } = useImportsApi();
  const activatePortalMutation = useActivatePortal();
  
  const [activationStatus, setActivationStatus] = useState<"pending" | "success" | "blocked" | "error">("pending");
  const [errorMessage, setErrorMessage] = useState("");

  const handleActivate = () => {
    activatePortalMutation.mutate(guardianId, {
      onSuccess: (data) => {
        if (data.status === "ALREADY_ACTIVE") {
          setActivationStatus("success");
        } else {
          setActivationStatus("success");
        }
      },
      onError: (error: unknown) => {
        const message = getErrorMessage(error, "Failed to activate portal");
        if (message.includes("External Dependency")) {
          setActivationStatus("blocked");
          setErrorMessage(message);
        } else {
          setActivationStatus("error");
          setErrorMessage(message);
        }
      }
    });
  };

  if (activationStatus === "success") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-green-800">Portal Activated</h4>
          <p className="text-sm text-green-700 mt-1">The parent portal is now active for this guardian.</p>
        </div>
      </div>
    );
  }

  if (activationStatus === "blocked") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-amber-800">Activation Blocked</h4>
          <p className="text-sm text-amber-700 mt-1">{errorMessage}</p>
          <p className="text-sm text-amber-700 mt-2 font-medium">Integration pending Authentication module contract.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Parent Portal</h3>
          <p className="text-sm text-gray-500">Status: Not Activated</p>
        </div>
        <UserPlus className="h-5 w-5 text-gray-400" />
      </div>
      
      <div className="p-4 bg-white">
        {activationStatus === "error" && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
            {errorMessage}
          </div>
        )}
        
        <p className="text-sm text-gray-600 mb-4">
          Enable access for the guardian to view student information, pay fees, and communicate with the institution.
        </p>
        <button
          onClick={handleActivate}
          disabled={activatePortalMutation.isPending}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-700 h-9 px-4 py-2"
        >
          {activatePortalMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Activating...
            </>
          ) : (
            "Activate Portal Access"
          )}
        </button>
      </div>
    </div>
  );
}
