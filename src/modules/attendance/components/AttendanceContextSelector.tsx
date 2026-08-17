import React, { useEffect } from "react";
import {
  useAttendanceBranches,
  useAttendanceAcademicYears,
  useAttendanceProgrammes,
  useAttendanceBatches,
  useAttendanceSections,
} from "../hooks/useAttendance";
import { Loader2, ChevronDown, ArrowRight } from "lucide-react";

interface AttendanceContextSelectorProps {
  selectedBranch: string;
  setSelectedBranch: (val: string) => void;
  selectedAcademicYear: string;
  setSelectedAcademicYear: (val: string) => void;
  selectedProgramme: string;
  setSelectedProgramme: (val: string) => void;
  selectedBatch: string;
  setSelectedBatch: (val: string) => void;
  selectedSection: string;
  setSelectedSection: (val: string) => void;
  attendanceDate: string;
  setAttendanceDate: (val: string) => void;
  onLoadAttendance: () => void;
  isCreatingOrLoading: boolean;
  disabled?: boolean;
}

const SelectField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder: string;
  children: React.ReactNode;
  step?: number;
}> = ({ label, value, onChange, disabled, loading, placeholder, children, step }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center gap-2">
      {step !== undefined && (
        <span className="w-5 h-5 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
          {step}
        </span>
      )}
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      {loading && <Loader2 className="w-3 h-3 animate-spin text-slate-400 ml-auto" />}
    </div>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className="w-full appearance-none px-3.5 py-2.5 bg-white border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300 pr-9 shadow-sm"
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

export const AttendanceContextSelector: React.FC<AttendanceContextSelectorProps> = ({
  selectedBranch,
  setSelectedBranch,
  selectedAcademicYear,
  setSelectedAcademicYear,
  selectedProgramme,
  setSelectedProgramme,
  selectedBatch,
  setSelectedBatch,
  selectedSection,
  setSelectedSection,
  attendanceDate,
  setAttendanceDate,
  onLoadAttendance,
  isCreatingOrLoading,
  disabled,
}) => {
  const { data: branches, isLoading: isLoadingBranches } = useAttendanceBranches();
  const { data: academicYears, isLoading: isLoadingAcademicYears } = useAttendanceAcademicYears();
  const { data: programmes, isLoading: isLoadingProgrammes } = useAttendanceProgrammes();
  const { data: batches, isLoading: isLoadingBatches } = useAttendanceBatches(
    selectedBranch,
    selectedAcademicYear,
    selectedProgramme
  );
  const { data: sections, isLoading: isLoadingSections } = useAttendanceSections(selectedBatch);

  // Auto-select branch if only one available
  useEffect(() => {
    if (branches?.length === 1 && !selectedBranch) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranch, setSelectedBranch]);

  // Reset cascade
  useEffect(() => {
    setSelectedBatch("");
    setSelectedSection("");
  }, [selectedBranch, selectedAcademicYear, selectedProgramme, setSelectedBatch, setSelectedSection]);

  useEffect(() => {
    setSelectedSection("");
  }, [selectedBatch, setSelectedSection]);

  const isFormValid =
    selectedBranch &&
    selectedAcademicYear &&
    selectedProgramme &&
    selectedBatch &&
    selectedSection &&
    attendanceDate;

  // Progress indicators
  const steps = [
    !!selectedBranch,
    !!selectedAcademicYear,
    !!selectedProgramme,
    !!selectedBatch,
    !!selectedSection,
    !!attendanceDate,
  ];
  const completedSteps = steps.filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-700">Setup Progress</p>
          <span className="text-sm font-bold text-teal-600">{completedSteps} / 6</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${(completedSteps / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Selector Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-800 mb-5">Select Class & Date</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <SelectField
            label="Branch"
            value={selectedBranch}
            onChange={setSelectedBranch}
            disabled={disabled}
            loading={isLoadingBranches}
            placeholder="Select Branch"
            step={1}
          >
            {branches?.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </SelectField>

          <SelectField
            label="Academic Year"
            value={selectedAcademicYear}
            onChange={setSelectedAcademicYear}
            disabled={disabled}
            loading={isLoadingAcademicYears}
            placeholder="Select Year"
            step={2}
          >
            {academicYears?.map((ay) => (
              <option key={ay.id} value={ay.id}>{ay.name}</option>
            ))}
          </SelectField>

          <SelectField
            label="Programme"
            value={selectedProgramme}
            onChange={setSelectedProgramme}
            disabled={disabled}
            loading={isLoadingProgrammes}
            placeholder="Select Programme"
            step={3}
          >
            {programmes?.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </SelectField>

          <SelectField
            label="Batch"
            value={selectedBatch}
            onChange={setSelectedBatch}
            disabled={disabled || !selectedBranch || !selectedAcademicYear || !selectedProgramme}
            loading={isLoadingBatches}
            placeholder="Select Batch"
            step={4}
          >
            {batches?.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </SelectField>

          <SelectField
            label="Section"
            value={selectedSection}
            onChange={setSelectedSection}
            disabled={disabled || !selectedBatch}
            loading={isLoadingSections}
            placeholder="Select Section"
            step={5}
          >
            {sections?.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </SelectField>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                6
              </span>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</label>
            </div>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              disabled={disabled}
              max={new Date().toISOString().split("T")[0]}
              className="px-3.5 py-2.5 bg-white border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all disabled:opacity-50 hover:border-slate-300 shadow-sm"
            />
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100 flex justify-end">
          <button
            onClick={onLoadAttendance}
            disabled={!isFormValid || isCreatingOrLoading || disabled}
            className="flex items-center gap-2.5 px-7 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            {isCreatingOrLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading Session…
              </>
            ) : (
              <>
                Load Attendance
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
