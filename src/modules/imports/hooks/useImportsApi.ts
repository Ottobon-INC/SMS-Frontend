import { useQuery, useMutation } from "@tanstack/react-query";
import { importsApi, ManualAddStudentRequest } from "../api/importsApi";

export const useImportsApi = () => {
  return {
    useBranches: () =>
      useQuery({
        queryKey: ["imports", "branches"],
        queryFn: () => importsApi.getBranches()
      }),

    useAcademicYears: () =>
      useQuery({
        queryKey: ["imports", "academicYears"],
        queryFn: () => importsApi.getAcademicYears()
      }),

    useProgrammes: (branchId?: string, academicYearId?: string) =>
      useQuery({
        queryKey: ["imports", "programmes", branchId, academicYearId],
        queryFn: () => importsApi.getProgrammes(branchId, academicYearId),
        enabled: !!branchId
      }),

    useBatches: (branchId?: string, academicYearId?: string, programmeId?: string) =>
      useQuery({
        queryKey: ["imports", "batches", branchId, academicYearId, programmeId],
        queryFn: () => importsApi.getBatches(branchId, academicYearId, programmeId),
        enabled: !!branchId && !!academicYearId && !!programmeId
      }),

    useSections: (batchId?: string) =>
      useQuery({
        queryKey: ["imports", "sections", batchId],
        queryFn: () => importsApi.getSections(batchId!),
        enabled: !!batchId
      }),

    useManualAddStudent: () =>
      useMutation({
        mutationFn: (payload: ManualAddStudentRequest) => importsApi.manualAddStudent(payload)
      }),

    useActivatePortal: () =>
      useMutation({
        mutationFn: (guardianId: string) => importsApi.activatePortal(guardianId)
      })
  };
};
