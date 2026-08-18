import { useQuery } from "@tanstack/react-query";
import { studentsApi, type StudentListItem } from "../api/studentsApi";

export const STUDENT_KEYS = {
  all: ["students"] as const,
  lists: (branchId?: string) => [...STUDENT_KEYS.all, "list", branchId] as const,
};

export function useStudents(branchId?: string, enabled: boolean = true) {
  return useQuery<StudentListItem[]>({
    queryKey: STUDENT_KEYS.lists(branchId),
    queryFn: () => studentsApi.list(branchId),
    enabled: enabled,
  });
}
