import BudgetCreationStepper from "@/features/budget/creation/BudgetCreationStepper";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/create-budget")({
  component: CreateBudget,
});

function CreateBudget() {
  return <BudgetCreationStepper />;
}
