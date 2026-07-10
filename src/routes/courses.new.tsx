import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CourseEditor } from "@/components/course-editor";

export const Route = createFileRoute("/courses/new")({
  component: NewCourse,
});

function NewCourse() {
  const navigate = useNavigate();
  return (
    <CourseEditor
      onSaved={(c) => navigate({ to: "/courses/$id", params: { id: c.id } })}
      onCancel={() => navigate({ to: "/courses" })}
    />
  );
}
