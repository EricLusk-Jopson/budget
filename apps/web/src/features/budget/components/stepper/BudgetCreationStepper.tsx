import React, { useCallback, useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import BudgetBasicsForm from "./BudgetBasicsForm";
import type { CreateBudget } from "@budget/core";
import { useAuth } from "@/contexts/auth/useAuth";
import { budgetOperations } from "@budget/api";

// Step configuration
const STEPS = [
  {
    id: 1,
    title: "Budget Basics",
  },
  { id: 2, title: "Add Channels" },
  { id: 3, title: "Add Pools" },
  {
    id: 4,
    title: "Add Allocation Strategy",
  },
];

interface ChannelsData {
  // TODO: Define channels structure in future steps
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  channels: any[];
}

interface PoolsData {
  // TODO: Define pools structure in future steps
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pools: any[];
}

interface AllocationStrategyData {
  // TODO: Define allocation strategy structure in future steps
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allocations: any[];
}

interface StepData {
  step1: CreateBudget;
  step2: ChannelsData;
  step3: PoolsData;
  step4: AllocationStrategyData;
}

interface StepValidity {
  step1: boolean;
  step2: boolean;
  step3: boolean;
  step4: boolean;
}

const BudgetCreationStepper = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const uid = user?.uid;
  // Centralized state for all form data across all steps
  const [stepData, setStepData] = useState<StepData>({
    step1: {
      name: "",
      description: "",
      currency: "CAD",
      ownerId: uid ?? "",
    },
    step2: {
      channels: [],
    },
    step3: {
      pools: [],
    },
    step4: {
      allocations: [],
    },
  });

  useEffect(() => {
    if (user?.uid && !stepData.step1.ownerId) {
      setStepData((prev) => ({
        ...prev,
        step1: { ...prev.step1, ownerId: user.uid },
      }));
    }
  }, [user?.uid, stepData.step1.ownerId]);

  // Track validity of each step
  const [stepValidity, setStepValidity] = useState<StepValidity>({
    step1: false,
    step2: false,
    step3: false,
    step4: false,
  });

  // State for tracking what's been created (for success alerts)
  const [budgetCreated, setBudgetCreated] = useState(false);
  const [budgetId, setBudgetId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [channelsCreated, setChannelsCreated] = useState(false);
  const [poolsCreated, setPoolsCreated] = useState(false);

  // Handler to update step data
  const updateStepData = <K extends keyof StepData>(
    step: K,
    data: Partial<StepData[K]>
  ) => {
    setStepData((prev) => ({
      ...prev,
      [step]: {
        ...prev[step],
        ...data,
      },
    }));
  };

  // Handler to update step validity
  const updateStepValidity = useCallback(
    <K extends keyof StepData>(step: K, isValid: boolean) => {
      setStepValidity((prev) => ({
        ...prev,
        [step]: isValid,
      }));
    },
    []
  );

  const handleNext = async () => {
    // ✅ Special handling for Step 1 - create the budget
    if (currentStep === 1 && !budgetCreated) {
      if (!user?.uid) {
        setSubmitError("User not authenticated");
        return;
      }

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        // Create budget in Firebase
        const createdBudget = await budgetOperations.createBudget(
          user.uid,
          stepData.step1
        );

        // Store the budget ID for future steps
        setBudgetId(createdBudget.id);
        setBudgetCreated(true);

        // Mark step as complete and move to next
        setCompletedSteps([...completedSteps, 1]);
        setCurrentStep(2);
      } catch (error) {
        console.error("Failed to create budget:", error);
        setSubmitError("Failed to create budget. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ✅ For other steps, just navigate
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }

    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    // Skip to next step without marking current as completed
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  console.log(user?.uid);

  const handleFinish = async () => {
    console.log("Final budget data:", stepData);
    // TODO: Implement Firebase save in Step 5
    // await BudgetService.createBudget(stepData)
  };

  const isStepCompleted = (stepId: number) => completedSteps.includes(stepId);
  const isStepCurrent = (stepId: number) => stepId === currentStep;
  const isStepAccessible = (stepId: number) => stepId <= currentStep;

  const canGoBack = currentStep > 1;
  const canGoNext = currentStep < STEPS.length;
  const canSkip = currentStep > 1 && currentStep < STEPS.length;

  const isCurrentStepValid =
    stepValidity[`step${currentStep}` as keyof StepValidity];

  // Get the creation status for the current step
  const getStepCreationStatus = () => {
    switch (currentStep) {
      case 1:
        return budgetCreated;
      case 2:
        return channelsCreated;
      case 3:
        return poolsCreated;
      default:
        return false;
    }
  };

  const stepCreated = getStepCreationStatus();

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Stepper Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Create Your Budget
          </h1>
          <p className="text-slate-600">
            Set up your values-based budget in a few simple steps
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  {/* Step Circle */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      isStepCompleted(step.id)
                        ? "bg-green-600 text-white"
                        : isStepCurrent(step.id)
                          ? "bg-blue-600 text-white"
                          : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {isStepCompleted(step.id) ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.id
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="mt-2 text-center">
                    <div
                      className={`text-sm font-medium ${
                        isStepAccessible(step.id)
                          ? "text-slate-900"
                          : "text-slate-400"
                      }`}
                    >
                      {step.title}
                    </div>
                  </div>
                </div>

                {/* Connector Line */}
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 rounded transition-colors ${
                      isStepCompleted(step.id) ? "bg-green-600" : "bg-slate-200"
                    }`}
                    style={{ marginTop: "-40px" }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content Card */}
        <Card className="shadow-lg">
          <CardContent className="min-h-[400px]">
            {/* ✅ Show error if budget creation failed */}
            {submitError && currentStep === 1 && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {budgetCreated && currentStep >= 1 && (
              <Alert className="mb-6 border-green-600 bg-green-50">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Budget created successfully! Budget ID: {budgetId}
                </AlertDescription>
              </Alert>
            )}

            {/* Render current step form */}
            {currentStep === 1 && (
              <BudgetBasicsForm
                values={stepData.step1}
                onChange={(field, value) =>
                  updateStepData("step1", { [field]: value })
                }
                onValidityChange={(isValid) =>
                  updateStepValidity("step1", isValid)
                }
                disabled={budgetCreated} // ✅ Disable after creation
              />
            )}
            {/* ... other steps ... */}
          </CardContent>

          <CardFooter className="flex justify-between border-t pt-6">
            {/* Back Button - disable going back to Step 1 after budget created */}
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={!canGoBack || (currentStep === 2 && budgetCreated)}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="flex gap-2">
              {/* Next Button */}
              {currentStep < STEPS.length ? (
                <Button
                  onClick={handleNext}
                  disabled={!isCurrentStepValid || isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Next"}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button disabled={!isCurrentStepValid} onClick={handleFinish}>
                  Finish Setup
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>

        {/* Helper Text */}
        <div className="mt-4 text-center text-sm text-slate-500">
          Step {currentStep} of {STEPS.length}
          {currentStep > 1 &&
            " • You can go back and edit previous steps anytime"}
        </div>

        {/* Debug Info (remove in production) */}
        <div className="mt-4 p-4 bg-slate-100 rounded text-xs">
          <div className="font-semibold mb-2">Debug Info:</div>
          <div>Current Step Valid: {isCurrentStepValid ? "✅" : "❌"}</div>
          <div>Step 1 Data: {JSON.stringify(stepData.step1, null, 2)}</div>
          <div>Budget ID: {budgetId || "Not created yet"}</div>
          <div>Budget Created: {budgetCreated ? "✅" : "❌"}</div>
        </div>
      </div>
    </div>
  );
};

export default BudgetCreationStepper;
