import { ImportResultSummary } from "./pages/ImportResultSummary";
import { ImportValidationPreview } from "./pages/ImportValidationPreview";
import { ManualAddStudentPage } from "./pages/ManualAddStudentPage";
import { StudentImportCenter } from "./pages/StudentImportCenter";
import { TemplateUploadPage } from "./pages/TemplateUploadPage";

export const routes = [
  { path: "imports", element: <StudentImportCenter /> },
  { path: "imports/manual", element: <ManualAddStudentPage /> },
  { path: "imports/template", element: <TemplateUploadPage /> },
  { path: "imports/preview/:batchId", element: <ImportValidationPreview /> },
  { path: "imports/summary/:batchId", element: <ImportResultSummary /> }
];
