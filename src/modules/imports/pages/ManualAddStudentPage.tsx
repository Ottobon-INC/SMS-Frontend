import { ManualAddStudentForm } from "../components/ManualAddStudentForm";

export function ManualAddStudentPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Manual Add Student</h1>
        <p className="mt-2 text-sm text-gray-600">
          Onboard a new student by filling out their details and establishing their guardian link.
        </p>
      </div>

      <ManualAddStudentForm />
    </div>
  );
}
