import { ModulePlaceholder } from "../../components/ModulePlaceholder";
import { ManualAddStudentPage } from "./pages/ManualAddStudentPage";

export const routes = [
  { path: "imports", element: <ModulePlaceholder moduleName="imports" /> },
  { path: "imports/manual-add", element: <ManualAddStudentPage /> }
];
