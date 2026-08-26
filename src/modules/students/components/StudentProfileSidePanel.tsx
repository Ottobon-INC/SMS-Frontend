import React from "react";
import { X, User, Phone, Mail, MapPin, Calendar, HeartPulse, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import type { StudentListItem } from "../api/studentsApi";

interface StudentProfileSidePanelProps {
  student: StudentListItem | null;
  onClose: () => void;
}

const formatCellValue = (val: unknown) => (val === null || val === undefined || val === "" ? "-" : String(val));
const formatDate = (val: unknown) => {
  if (!val) return "-";
  const str = String(val).slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (!match) return str;
  return `${match[3]}/${match[2]}/${match[1]}`;
};

export const StudentProfileSidePanel: React.FC<StudentProfileSidePanelProps> = ({ student, onClose }) => {
  if (!student) return null;

  const displayName = student.displayName ?? student.legalName ?? student.name;
  const programmeDisplay = student.programmeDisplay ?? (student.programmeCode && student.programmeName ? `${student.programmeCode} - ${student.programmeName}` : (student.programmeName ?? student.stream));
  const sectionDisplay = student.sectionDisplay ?? student.sectionName ?? student.section;
  const rollNo = student.rollNumber ?? student.rollNo;
  const guardianName = student.guardianName ?? student.father_name;
  const guardianPhone = student.guardianPhone ?? student.guardian_phone;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold shadow-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">{displayName}</h2>
              <p className="text-xs font-semibold text-slate-500 font-mono mt-0.5">{student.admissionNumber}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active Enrolled
            </div>
          </div>

          {/* Academic Info */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4" /> Academic Details
            </h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
              <Detail label="Programme" value={formatCellValue(programmeDisplay)} />
              <Detail label="Section" value={formatCellValue(sectionDisplay)} />
              <Detail label="Roll Number" value={formatCellValue(rollNo)} />
              <Detail label="Academic Year" value={formatCellValue(student.academicYearName)} />
              <Detail label="Joining Date" value={formatDate(student.joiningDate)} />
              <Detail label="Ending Date" value={formatDate(student.endingDate)} />
            </div>
          </section>

          {/* Personal Info */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <User className="w-4 h-4" /> Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
              <Detail label="Gender" value={formatCellValue(student.gender)} />
              <Detail label="Date of Birth" value={formatDate(student.dateOfBirth ?? student.dob)} />
              <Detail label="Created At" value={formatDate(student.studentCreatedAt)} />
            </div>
          </section>

          {/* Contact Info */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Phone className="w-4 h-4" /> Contact & Guardian
            </h3>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <Detail label="Student Mobile" value={formatCellValue(student.studentMobile)} />
                <Detail label="Student Email" value={formatCellValue(student.studentEmail)} />
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Detail label="Guardian Name" value={formatCellValue(guardianName)} />
                  <Detail label="Relationship" value={formatCellValue(student.guardianRelationship ?? student.guardian_relationship)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Detail label="Guardian Phone" value={formatCellValue(guardianPhone)} />
                  <Detail label="Guardian Email" value={formatCellValue(student.guardianEmail)} />
                </div>
              </div>
            </div>
          </section>

        </div>

      </div>
    </>
  );
};

const Detail: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-slate-500 mb-0.5">{label}</p>
    <p className="font-semibold text-slate-900">{value}</p>
  </div>
);
