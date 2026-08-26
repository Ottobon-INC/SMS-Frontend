import React, { useEffect } from "react";
import {
  useAttendanceBranches,
  useAttendanceAcademicYears,
  useAttendanceProgrammes,
  useAttendanceBatches,
  useAttendanceSectionsStatus,
} from "../hooks/useAttendance";
import { Loader2, ChevronDown, Calendar, AlertCircle, FileCheck, CheckCircle2 } from "lucide-react";
import type { SectionAttendanceStatus } from "../types/attendance.types";

interface AttendanceClassGridProps {
  selectedBranch: string;
  setSelectedBranch: (val: string) => void;
  selectedAcademicYear: string;
  setSelectedAcademicYear: (val: string) => void;
  selectedProgramme: string;
  setSelectedProgramme: (val: string) => void;
  selectedBatch: string;
  setSelectedBatch: (val: string) => void;
  attendanceDate: string;
  setAttendanceDate: (val: string) => void;
  onSelectSection: (sectionId: string) => void;
  isCreatingOrLoading: boolean;
}

const SelectField: React.FC<{
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder: string;
  children: React.ReactNode;
}> = ({ value, onChange, disabled, loading, placeholder, children }) => (
  <div className="relative flex-1 min-w-[140px]">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || loading}
      className="w-full appearance-none px-3.5 py-2.5 bg-white border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300 pr-9 shadow-sm"
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
    {loading ? (
      <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin pointer-events-none" />
    ) : (
      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    )}
  </div>
);

export const AttendanceClassGrid: React.FC<AttendanceClassGridProps> = ({
  selectedBranch,
  setSelectedBranch,
  selectedAcademicYear,
  setSelectedAcademicYear,
  selectedProgramme,
  setSelectedProgramme,
  selectedBatch,
  setSelectedBatch,
  attendanceDate,
  setAttendanceDate,
  onSelectSection,
  isCreatingOrLoading,
}) => {
  const { data: branches, isLoading: isLoadingBranches } = useAttendanceBranches();
  const { data: academicYears, isLoading: isLoadingAcademicYears } = useAttendanceAcademicYears();
  const { data: programmes, isLoading: isLoadingProgrammes } = useAttendanceProgrammes();
  const { data: batches, isLoading: isLoadingBatches } = useAttendanceBatches(
    selectedBranch,
    selectedAcademicYear,
    selectedProgramme
  );

  // Auto-select branch if only one available
  useEffect(() => {
    if (branches?.length === 1 && !selectedBranch) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranch, setSelectedBranch]);

  // Reset cascade
  useEffect(() => {
    setSelectedBatch("");
  }, [selectedBranch, selectedAcademicYear, selectedProgramme, setSelectedBatch]);

  // Fetch sections status only when batch and date are selected
  const { data: sectionsStatus, isLoading: isLoadingSections } = useAttendanceSectionsStatus(
    attendanceDate,
    selectedBatch
  );

  const getStatusConfig = (status: SectionAttendanceStatus["status"]) => {
    switch (status) {
      case "UNMARKED":
        return {
          bg: "bg-rose-50 border-rose-200 hover:border-rose-300 hover:shadow-rose-100",
          text: "text-rose-700",
          icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
          label: "Pending",
        };
      case "DRAFT":
        return {
          bg: "bg-amber-50 border-amber-200 hover:border-amber-300 hover:shadow-amber-100",
          text: "text-amber-700",
          icon: <FileCheck className="w-5 h-5 text-amber-500" />,
          label: "Draft Saved",
        };
      case "SUBMITTED":
      case "FINALIZED":
        return {
          bg: "bg-emerald-50 border-emerald-200 hover:border-emerald-300 hover:shadow-emerald-100",
          text: "text-emerald-700",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
          label: status === "FINALIZED" ? "Finalized" : "Submitted",
        };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SelectField
            value={selectedBranch}
            onChange={setSelectedBranch}
            loading={isLoadingBranches}
            placeholder="Select Branch"
          >
            {branches?.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </SelectField>

          <SelectField
            value={selectedAcademicYear}
            onChange={setSelectedAcademicYear}
            loading={isLoadingAcademicYears}
            placeholder="Academic Year"
          >
            {academicYears?.map((ay) => (
              <option key={ay.id} value={ay.id}>{ay.name}</option>
            ))}
          </SelectField>

          <SelectField
            value={selectedProgramme}
            onChange={setSelectedProgramme}
            loading={isLoadingProgrammes}
            placeholder="Programme"
          >
            {programmes?.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </SelectField>

          <SelectField
            value={selectedBatch}
            onChange={setSelectedBatch}
            disabled={!selectedBranch || !selectedAcademicYear || !selectedProgramme}
            loading={isLoadingBatches}
            placeholder="Student Year Level"
          >
            {batches?.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </SelectField>

          <div className="relative flex-1 min-w-[140px]">
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all hover:border-slate-300 shadow-sm"
            />
            <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 min-h-[400px]">
        {!selectedBatch ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20">
            <Calendar className="w-12 h-12 text-slate-200 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">Select a Year Level</h3>
            <p className="text-sm">Choose filters above to see available classes for attendance.</p>
          </div>
        ) : isLoadingSections ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-4" />
            <p className="text-sm font-medium">Loading classes...</p>
          </div>
        ) : sectionsStatus && sectionsStatus.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sectionsStatus.map((section) => {
              const cfg = getStatusConfig(section.status);
              return (
                <button
                  key={section.sectionId}
                  onClick={() => onSelectSection(section.sectionId)}
                  disabled={isCreatingOrLoading}
                  className={`text-left p-5 rounded-2xl border transition-all shadow-sm hover:shadow-md active:scale-[0.98] ${cfg.bg} ${isCreatingOrLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-xl font-bold text-slate-800">{section.sectionName}</h4>
                    {cfg.icon}
                  </div>
                  <div className="flex items-center gap-1.5 mt-auto">
                    <span className={`text-xs font-bold uppercase tracking-wider ${cfg.text}`}>
                      {cfg.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20">
            <AlertCircle className="w-12 h-12 text-slate-200 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">No Classes Found</h3>
            <p className="text-sm">No classes are available for the selected year level.</p>
          </div>
        )}
      </div>
    </div>
  );
};
