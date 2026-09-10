import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/project/$key")({
  component: ProjectLayout,
});

function ProjectLayout() {
  return (
    <div className="relative h-full">
      <Outlet />
    </div>
  );
}
