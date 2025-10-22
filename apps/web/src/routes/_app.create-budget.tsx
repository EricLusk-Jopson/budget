import BudgetCreationStepper from "@/features/budget/components/stepper/BudgetCreationStepper";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/create-budget")({
  component: CreateBudget,
});

function CreateBudget() {
  return <BudgetCreationStepper />;
}
