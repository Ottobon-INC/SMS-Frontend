import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "../utils/zodResolver";
import { manualAddSchema, ManualAddStudentFormData } from "../schemas/manualAddSchema";
import { useImportsApi } from "../hooks/useImportsApi";
import { Loader2, AlertCircle } from "lucide-react";
import { PortalActivationCard } from "./PortalActivationCard";

export function ManualAddStudentForm() {
  const { useBranches, useAcademicYears, useProgrammes, useBatches, useSections, useManualAddStudent } = useImportsApi();
  
  const [successData, setSuccessData] = useState<{ studentId: string; guardianId?: string; studentNumber: string } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ManualAddStudentFormData>({
    resolver: zodResolver(manualAddSchema),
    defaultValues: {
      student_name: "",
      date_of_birth: "",
      gender: "MALE",
      admission_number: "",
      roll_number: "",
      branch_id: "",
      academic_year_id: "",
      programme_id: "",
      batch_id: "",
      section_id: "",
      guardian_name: "",
      guardian_mobile: "",
      guardian_email: "",
      relationship_type: "FATHER",
      year_level: "FIRST_YEAR"
    }
  });

  const branchId = watch("branch_id");
  const academicYearId = watch("academic_year_id");
  const programmeId = watch("programme_id");
  const batchId = watch("batch_id");

  const { data: branches, isLoading: loadingBranches } = useBranches();
  const { data: academicYears, isLoading: loadingYears } = useAcademicYears();
  const { data: programmes, isLoading: loadingProgrammes } = useProgrammes();
  const { data: batches, isLoading: loadingBatches } = useBatches(branchId, academicYearId, programmeId);
  const { data: sections, isLoading: loadingSections } = useSections(batchId);

  // Auto-select branch if only one is available
  useEffect(() => {
    if (branches && branches.length === 1 && !branchId) {
      reset({ ...watch(), branch_id: branches[0].id });
    }
  }, [branches, branchId, reset, watch]);

  // Dependent dropdown resets
  useEffect(() => {
    if (branchId) {
      setValue("batch_id", "");
      setValue("section_id", "");
    }
  }, [branchId, setValue]);

  useEffect(() => {
    if (academicYearId) {
      setValue("batch_id", "");
      setValue("section_id", "");
    }
  }, [academicYearId, setValue]);

  useEffect(() => {
    if (programmeId) {
      setValue("batch_id", "");
      setValue("section_id", "");
    }
  }, [programmeId, setValue]);

  useEffect(() => {
    if (batchId) {
      setValue("section_id", "");
    }
  }, [batchId, setValue]);

  const manualAddMutation = useManualAddStudent();
  const [submitError, setSubmitError] = useState("");

  const onSubmit = (data: ManualAddStudentFormData) => {
    setSubmitError("");
    manualAddMutation.mutate(data, {
      onSuccess: (response) => {
        setSuccessData({
          studentId: response.student_id,
          guardianId: response.guardian_id || undefined,
          studentNumber: response.student_number
        });
      },
      onError: (error: any) => {
        setSubmitError(error.message || "Failed to add student. Please try again.");
      }
    });
  };

  if (successData) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-2">Student Added Successfully</h2>
          <p className="text-green-700">
            Student Number: <span className="font-semibold">{successData.studentNumber}</span>
          </p>
          <button
            onClick={() => {
              setSuccessData(null);
              reset();
            }}
            className="mt-4 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-700 h-9 px-4 py-2"
          >
            Add Another Student
          </button>
        </div>
        
        {successData.guardianId && (
          <PortalActivationCard guardianId={successData.guardianId} />
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto pb-12">
      {submitError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="text-sm text-red-800">{submitError}</div>
        </div>
      )}

      {/* Academic Placement */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Academic Placement</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Branch <span className="text-red-500">*</span></label>
            <select
              {...register("branch_id")}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:opacity-75"
              disabled={loadingBranches || (branches?.length === 1)}
            >
              <option value="">Select Branch</option>
              {branches?.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {errors.branch_id && <p className="text-sm text-red-500">{errors.branch_id.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Academic Year <span className="text-red-500">*</span></label>
            <select
              {...register("academic_year_id")}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
              disabled={loadingYears}
            >
              <option value="">Select Academic Year</option>
              {academicYears?.map(y => (
                <option key={y.id} value={y.id}>{y.name}</option>
              ))}
            </select>
            {errors.academic_year_id && <p className="text-sm text-red-500">{errors.academic_year_id.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Programme <span className="text-red-500">*</span></label>
            <select
              {...register("programme_id")}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
              disabled={loadingProgrammes}
            >
              <option value="">Select Programme</option>
              {programmes?.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.programme_id && <p className="text-sm text-red-500">{errors.programme_id.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Batch <span className="text-red-500">*</span></label>
            <select
              {...register("batch_id")}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
              disabled={loadingBatches || !academicYearId || !programmeId}
            >
              <option value="">Select Batch</option>
              {batches?.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {errors.batch_id && <p className="text-sm text-red-500">{errors.batch_id.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Section <span className="text-red-500">*</span></label>
            <select
              {...register("section_id")}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
              disabled={loadingSections || !batchId}
            >
              <option value="">Select Section</option>
              {sections?.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.section_id && <p className="text-sm text-red-500">{errors.section_id.message}</p>}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Year Level <span className="text-red-500">*</span></label>
            <select
              {...register("year_level")}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
            >
              <option value="FIRST_YEAR">First Year</option>
              <option value="SECOND_YEAR">Second Year</option>
            </select>
            {errors.year_level && <p className="text-sm text-red-500">{errors.year_level.message}</p>}
          </div>
          
        </div>
      </div>

      {/* Student Details */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Student Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Legal Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              {...register("student_name")}
              placeholder="e.g. John Doe"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {errors.student_name && <p className="text-sm text-red-500">{errors.student_name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Date of Birth <span className="text-red-500">*</span></label>
            <input
              type="date"
              {...register("date_of_birth")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {errors.date_of_birth && <p className="text-sm text-red-500">{errors.date_of_birth.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Gender <span className="text-red-500">*</span></label>
            <select
              {...register("gender")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
            {errors.gender && <p className="text-sm text-red-500">{errors.gender.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Admission Number <span className="text-red-500">*</span></label>
            <input
              type="text"
              {...register("admission_number")}
              placeholder="e.g. ADM-2026-001"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {errors.admission_number && <p className="text-sm text-red-500">{errors.admission_number.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Roll Number</label>
            <input
              type="text"
              {...register("roll_number")}
              placeholder="Optional"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {errors.roll_number && <p className="text-sm text-red-500">{errors.roll_number.message}</p>}
          </div>
          
        </div>
      </div>

      {/* Guardian Details */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Guardian Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Guardian Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              {...register("guardian_name")}
              placeholder="e.g. Jane Doe"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {errors.guardian_name && <p className="text-sm text-red-500">{errors.guardian_name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Mobile Number <span className="text-red-500">*</span></label>
            <input
              type="text"
              {...register("guardian_mobile")}
              placeholder="+1234567890"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {errors.guardian_mobile && <p className="text-sm text-red-500">{errors.guardian_mobile.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              {...register("guardian_email")}
              placeholder="jane@example.com (Optional)"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {errors.guardian_email && <p className="text-sm text-red-500">{errors.guardian_email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Relationship <span className="text-red-500">*</span></label>
            <select
              {...register("relationship_type")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="FATHER">Father</option>
              <option value="MOTHER">Mother</option>
              <option value="LEGAL_GUARDIAN">Legal Guardian</option>
              <option value="RELATIVE">Relative</option>
              <option value="SPONSOR">Sponsor</option>
              <option value="OTHER">Other</option>
            </select>
            {errors.relationship_type && <p className="text-sm text-red-500">{errors.relationship_type.message}</p>}
          </div>
          
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-6 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Complete Student Registration"
          )}
        </button>
      </div>

    </form>
  );
}
