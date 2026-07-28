import TasksSidebar from "@/components/TasksSidebar";

/**
 * Common layout for all /tasks pages: a left sidebar + the page content
 * (フェーズ2 Step 10). Each page still renders its own ForestBackground and
 * <main>; here we just place the sidebar beside it. children fills the rest
 * via its own `flex-1`.
 */
export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1">
      <TasksSidebar />
      {children}
    </div>
  );
}
