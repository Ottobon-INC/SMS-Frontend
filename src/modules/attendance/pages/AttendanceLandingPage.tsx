import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AttendanceContextSelector } from "../components/AttendanceContextSelector";
import { PrincipalInbox } from "../components/PrincipalInbox";
import { DeanOverview } from "../components/DeanOverview";
import { OfficeStaffRecentSessions } from "../components/OfficeStaffRecentSessions";
import { useCreateAttendanceSession } from "../hooks/useAttendance";
import { AlertCircle, ClipboardCheck, ShieldCheck, Building2 } from "lucide-react";
import { useAuth } from "../../authentication/providers/AuthProvider";

export const AttendanceLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [selectedProgramme, setSelectedProgramme] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [error, setError] = useState<string | null>(null);

  const auth = useAuth();
  const canMark = auth.hasPermission("attendance.mark");
  const canFinalize = auth.hasPermission("attendance.finalize");

  const isOfficeStaff = canMark;
  const isPrincipal = canFinalize && !canMark;
  const isInstitutionAdmin = !canMark && !canFinalize;

  const createSessionMutation = useCreateAttendanceSession();

  const handleLoadAttendance = () => {
    setError(null);
    createSessionMutation.mutate(
      { sectionId: selectedSection, attendanceDate },
      {
        onSuccess: (session) => {
          navigate(`/attendance/session/${session.id}`);
        },
        onError: (err: unknown) => {
          setError(err instanceof Error ? err.message : "Failed to load or create attendance session.");
        },
      }
    );
  };

  const pageConfig = isOfficeStaff
    ? {
        icon: <ClipboardCheck className="w-6 h-6" />,
        heading: "Take Attendance",
        subtitle: "Select a class to begin marking today's attendance.",
        accent: "from-teal-500 to-emerald-600",
        badge: "Office Staff",
        badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/30",
      }
    : isPrincipal
    ? {
        icon: <ShieldCheck className="w-6 h-6" />,
        heading: "Attendance Review",
        subtitle: "Sessions awaiting your review and finalization.",
        accent: "from-violet-500 to-indigo-600",
        badge: "Principal",
        badgeColor: "bg-violet-500/20 text-violet-300 border-violet-500/30",
      }
    : {
        icon: <Building2 className="w-6 h-6" />,
        heading: "Attendance Overview",
        subtitle: "Institution-wide attendance monitoring dashboard.",
        accent: "from-blue-500 to-cyan-600",
        badge: "Institution Admin",
        badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      };

  return (
    <div className="min-h-full bg-slate-50">
      {/* Hero Header */}
      <div className="bg-slate-900 px-6 py-8 md:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${pageConfig.accent} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                {pageConfig.icon}
              </div>
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <h1 className="text-2xl font-bold text-white tracking-tight">{pageConfig.heading}</h1>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${pageConfig.badgeColor}`}>
                    {pageConfig.badge}
                  </span>
                </div>
                <p className="text-slate-400 text-sm">{pageConfig.subtitle}</p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Today</p>
              <p className="text-white font-semibold text-sm mt-0.5">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {isPrincipal ? (
          <PrincipalInbox />
        ) : isInstitutionAdmin ? (
          <DeanOverview />
        ) : (
          <div className="flex flex-col gap-4">
            <AttendanceContextSelector
              selectedBranch={selectedBranch}
              setSelectedBranch={setSelectedBranch}
              selectedAcademicYear={selectedAcademicYear}
              setSelectedAcademicYear={setSelectedAcademicYear}
              selectedProgramme={selectedProgramme}
              setSelectedProgramme={setSelectedProgramme}
              selectedBatch={selectedBatch}
              setSelectedBatch={setSelectedBatch}
              selectedSection={selectedSection}
              setSelectedSection={setSelectedSection}
              attendanceDate={attendanceDate}
              setAttendanceDate={setAttendanceDate}
              onLoadAttendance={handleLoadAttendance}
              isCreatingOrLoading={createSessionMutation.isPending}
            />
            <OfficeStaffRecentSessions />
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Failed to Load Session</p>
              <p className="text-sm mt-0.5 opacity-80">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
