import React, { useState, useEffect, useMemo } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Undo2 } from "lucide-react";
import type { AttendanceStudentResponse, AttendanceStatus } from "../types/attendance.types";

type FilterType = "ALL" | "PRESENT" | "ABSENT" | "LEAVE" | "UNMARKED";

const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarGradient = (name: string) => {
  const gradients = [
    "from-teal-400 to-emerald-500",
    "from-violet-400 to-indigo-500",
    "from-blue-400 to-cyan-500",
    "from-rose-400 to-orange-500",
    "from-amber-400 to-red-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

interface StudentRosterTableProps {
  students: AttendanceStudentResponse[];
  localState: Record<string, AttendanceStatus>;
  onMarkStudent: (enrollmentId: string, status: AttendanceStatus) => void;
  editable?: boolean;
  searchQuery: string;
  showUnmarkedWarning?: boolean;
}

export const StudentRosterTable: React.FC<StudentRosterTableProps> = ({
  students,
  localState,
  onMarkStudent,
  editable = false,
  searchQuery,
  showUnmarkedWarning = false,
}) => {
  const [parent] = useAutoAnimate<HTMLDivElement>();
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [filterType, setFilterType] = useState<FilterType>("ALL");

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        s.studentName.toLowerCase().includes(q) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
        (s.admissionNumber && s.admissionNumber.toLowerCase().includes(q));

      const currentStatus = localState[s.enrollmentId] || s.attendanceStatus;

      if (filterType === "ALL") return matchesSearch;
      return matchesSearch && currentStatus === filterType;
    });
  }, [students, searchQuery, filterType, localState]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchQuery, filterType]);

  useEffect(() => {
    if (!editable) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere if focus is in an input
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlightedIndex(0);
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }

      if (filteredStudents.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < filteredStudents.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter" && highlightedIndex >= 0 && highlightedIndex < filteredStudents.length) {
        e.preventDefault();
        const student = filteredStudents[highlightedIndex];
        const current = localState[student.enrollmentId] || student.attendanceStatus;
        let next: AttendanceStatus = "PRESENT";
        if (current === "PRESENT") next = "ABSENT";
        else if (current === "ABSENT") next = "LEAVE";
        else if (current === "LEAVE") next = "PRESENT";
        onMarkStudent(student.enrollmentId, next);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editable, filteredStudents, highlightedIndex, localState, onMarkStudent]);

  if (students.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-sm">
        No students found in this class.
      </div>
    );
  }

  const counts = {
    ALL: students.length,
    PRESENT: students.filter((s) => (localState[s.enrollmentId] || s.attendanceStatus) === "PRESENT").length,
    ABSENT: students.filter((s) => (localState[s.enrollmentId] || s.attendanceStatus) === "ABSENT").length,
    LEAVE: students.filter((s) => (localState[s.enrollmentId] || s.attendanceStatus) === "LEAVE").length,
    UNMARKED: students.filter((s) => (localState[s.enrollmentId] || s.attendanceStatus) === "UNMARKED").length,
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <FilterTab label="All" count={counts.ALL} active={filterType === "ALL"} onClick={() => setFilterType("ALL")} />
        <FilterTab label="Present" count={counts.PRESENT} active={filterType === "PRESENT"} onClick={() => setFilterType("PRESENT")} activeClass="bg-emerald-100 text-emerald-800 border-emerald-200" />
        <FilterTab label="Absent" count={counts.ABSENT} active={filterType === "ABSENT"} onClick={() => setFilterType("ABSENT")} activeClass="bg-red-100 text-red-800 border-red-200" />
        <FilterTab label="Leave" count={counts.LEAVE} active={filterType === "LEAVE"} onClick={() => setFilterType("LEAVE")} activeClass="bg-amber-100 text-amber-800 border-amber-200" />
        <FilterTab label="Unmarked" count={counts.UNMARKED} active={filterType === "UNMARKED"} onClick={() => setFilterType("UNMARKED")} activeClass="bg-rose-100 text-rose-800 border-rose-200" />
      </div>

    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[56px_1fr_120px_160px] bg-slate-50 border-b border-slate-200 px-4 py-3">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">#</span>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Student</span>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Adm. No</span>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Attendance</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100" ref={parent}>
        {filteredStudents.map((s, idx) => {
          const currentStatus = localState[s.enrollmentId] || s.attendanceStatus;
          const isHighlighted = idx === highlightedIndex;

          let rowBg = "";
          if (editable && isHighlighted) {
            rowBg = "bg-teal-50 ring-2 ring-inset ring-teal-400 z-10 relative shadow-sm";
          } else if (!editable) {
            rowBg = currentStatus === "PRESENT"
              ? "bg-emerald-50/40"
              : currentStatus === "ABSENT"
              ? "bg-red-50/40"
              : currentStatus === "LEAVE"
              ? "bg-amber-50/40"
              : "";
          }

          if (showUnmarkedWarning && currentStatus === "UNMARKED") {
            rowBg = "bg-rose-50 ring-2 ring-inset ring-rose-400 z-10 relative shadow-sm unmarked-row";
          }

          return (
            <div
              key={s.enrollmentId}
              id={`student-row-${s.enrollmentId}`}
              className={`grid grid-cols-[56px_1fr_120px_160px] items-center px-4 py-3.5 transition-all duration-200 hover:bg-slate-50/70 ${rowBg}`}
            >
              {/* Roll number */}
              <div className="text-center">
                <span className="text-xs font-mono font-bold text-slate-400">
                  {s.rollNumber || String(idx + 1).padStart(2, "0")}
                </span>
              </div>

              {/* Name and Avatar */}
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarGradient(s.studentName)} flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0`}>
                  {getInitials(s.studentName)}
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900">{s.studentName}</p>
                  {editable && isHighlighted && (
                    <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider mt-0.5">Press Enter to mark</p>
                  )}
                </div>
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
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    <button
                      type="button"
                      title="Clear"
                      onClick={() => onMarkStudent(s.enrollmentId, "UNMARKED")}
                      className={`w-9 h-9 rounded-lg font-bold text-sm flex items-center justify-center transition-all active:scale-95 text-slate-400 hover:text-slate-700 hover:bg-slate-200 ${
                        currentStatus === "UNMARKED" ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      disabled={currentStatus === "UNMARKED"}
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <StatusBadge status={currentStatus} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredStudents.length === 0 && (
        <div className="py-12 text-center text-slate-400 bg-white text-sm">
          No students match your current filters.
        </div>
      )}
    </div>
    </div>
  );
};

const FilterTab: React.FC<{
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  activeClass?: string;
}> = ({ label, count, active, onClick, activeClass = "bg-slate-800 text-white border-slate-800 shadow-md" }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all whitespace-nowrap ${
      active
        ? activeClass
        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
    }`}
  >
    {label}
    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>
      {count}
    </span>
  </button>
);

const MarkButton: React.FC<{
  label: React.ReactNode;
  title: string;
  active: boolean;
  onClick: () => void;
  activeClass: string;
}> = ({ label, title, active, onClick, activeClass }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`w-9 h-9 rounded-lg font-bold text-sm flex items-center justify-center transition-all active:scale-95 ${
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
