import { FeeTemplatePage } from "./pages/FeeTemplatePage";
import { ImportResultSummary } from "./pages/ImportResultSummary";
import { ImportValidationPreview } from "./pages/ImportValidationPreview";
import { ManualAddStudentPage } from "./pages/ManualAddStudentPage";
import { StudentImportCenter } from "./pages/StudentImportCenter";
import { TemplateUploadPage } from "./pages/TemplateUploadPage";

export const routes = [
  { path: "imports", element: <StudentImportCenter /> },
  { path: "imports/manual", element: <ManualAddStudentPage /> },
  { path: "imports/template", element: <TemplateUploadPage /> },
  { path: "imports/fees", element: <FeeTemplatePage /> },
  { path: "imports/preview/:batchId", element: <ImportValidationPreview /> },
  { path: "imports/fees/preview/:batchId", element: <ImportValidationPreview importType="fees" /> },
  { path: "imports/summary/:batchId", element: <ImportResultSummary /> },
  { path: "imports/fees/summary/:batchId", element: <ImportResultSummary importType="fees" /> }
];
