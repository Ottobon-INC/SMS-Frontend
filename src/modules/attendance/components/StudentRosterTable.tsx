import React from "react";
import type { AttendanceStudentResponse, AttendanceStatus } from "../types/attendance.types";

interface StudentRosterTableProps {
  students: AttendanceStudentResponse[];
  localState: Record<string, AttendanceStatus>;
  onMarkStudent: (enrollmentId: string, status: AttendanceStatus) => void;
  editable?: boolean;
  searchQuery: string;
}

export const StudentRosterTable: React.FC<StudentRosterTableProps> = ({
  students,
  localState,
  onMarkStudent,
  editable = false,
  searchQuery,
}) => {
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.studentName.toLowerCase().includes(q) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
      (s.admissionNumber && s.admissionNumber.toLowerCase().includes(q))
    );
  });

  if (filteredStudents.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-sm">
        No students match your search.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[56px_1fr_120px_160px] bg-slate-50 border-b border-slate-200 px-4 py-3">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">#</span>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Student</span>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Adm. No</span>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Attendance</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100">
        {filteredStudents.map((s, idx) => {
          const currentStatus = localState[s.enrollmentId] || s.attendanceStatus;
          const rowBg =
            !editable
              ? currentStatus === "PRESENT"
                ? "bg-emerald-50/40"
                : currentStatus === "ABSENT"
                ? "bg-red-50/40"
                : currentStatus === "LEAVE"
                ? "bg-amber-50/40"
                : ""
              : "";

          return (
            <div
              key={s.enrollmentId}
              className={`grid grid-cols-[56px_1fr_120px_160px] items-center px-4 py-3.5 transition-colors hover:bg-slate-50/70 ${rowBg}`}
            >
              {/* Roll number */}
              <div className="text-center">
                <span className="text-xs font-mono font-bold text-slate-400">
                  {s.rollNumber || String(idx + 1).padStart(2, "0")}
                </span>
              </div>

              {/* Name */}
              <div>
                <p className="font-semibold text-sm text-slate-900">{s.studentName}</p>
              </div>

              {/* Admission No */}
              <div>
                <span className="text-xs font-mono text-slate-400">{s.admissionNumber || "—"}</span>
              </div>

              {/* Attendance control */}
              <div>
                {editable ? (
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl w-fit">
                    <MarkButton
                      label="P"
                      title="Present"
                      active={currentStatus === "PRESENT"}
                      onClick={() => onMarkStudent(s.enrollmentId, "PRESENT")}
                      activeClass="bg-emerald-500 text-white shadow-sm"
                    />
                    <MarkButton
                      label="A"
                      title="Absent"
                      active={currentStatus === "ABSENT"}
                      onClick={() => onMarkStudent(s.enrollmentId, "ABSENT")}
                      activeClass="bg-red-500 text-white shadow-sm"
                    />
                    <MarkButton
                      label="L"
                      title="Leave"
                      active={currentStatus === "LEAVE"}
                      onClick={() => onMarkStudent(s.enrollmentId, "LEAVE")}
                      activeClass="bg-amber-500 text-white shadow-sm"
                    />
                  </div>
                ) : (
                  <StatusBadge status={currentStatus} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MarkButton: React.FC<{
  label: string;
  title: string;
  active: boolean;
  onClick: () => void;
  activeClass: string;
}> = ({ label, title, active, onClick, activeClass }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`w-9 h-9 rounded-lg font-bold text-sm transition-all active:scale-95 ${
      active ? activeClass : "text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm"
    }`}
  >
    {label}
  </button>
);

const StatusBadge: React.FC<{ status: AttendanceStatus | null | undefined }> = ({ status }) => {
  const map = {
    PRESENT: "bg-emerald-100 text-emerald-700 border-emerald-200",
    ABSENT: "bg-red-100 text-red-700 border-red-200",
    LEAVE: "bg-amber-100 text-amber-700 border-amber-200",
    UNMARKED: "bg-slate-100 text-slate-500 border-slate-200",
  };
  const label = status
    ? status.charAt(0) + status.slice(1).toLowerCase()
    : "Unmarked";
  const cls = map[(status as keyof typeof map) ?? "UNMARKED"] ?? map.UNMARKED;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${cls}`}>
      {label}
    </span>
  );
};
