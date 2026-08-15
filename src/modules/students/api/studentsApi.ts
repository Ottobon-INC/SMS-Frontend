import { apiGet, apiPost } from "../../../api/client/apiClient";

export interface StudentListItem {
  id: string;
  admissionNumber: string;
  name: string;
  rollNo: string;
  gender: string;
  stream: string;
  section: string;
  status: string;
  father_name?: string;
  guardian_relationship?: string;
  guardian_phone?: string;
  guardian_data?: {
    father_name?: string;
    mother_name?: string;
    guardian_phone?: string;
    guardian_email?: string;
  };
}

export const studentsApi = {
  list: () => apiGet<StudentListItem[]>("/students"),
  create: (payload: unknown) => apiPost<StudentListItem>("/students", payload)
} as const;
