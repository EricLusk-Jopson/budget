import React, { useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Step configuration
const STEPS = [
  {
    id: 1,
    title: "Budget Basics",
    description: "Name, description, and currency",
  },
  { id: 2, title: "Add Channels", description: "Financial accounts" },
  { id: 3, title: "Add Pools", description: "Spending categories" },
  {
    id: 4,
    title: "Add Allocation Strategy",
    description: "Distribute income across pools",
  },
];

function BudgetCreationStepper() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // State for tracking what's been created
  const [budgetCreated, setBudgetCreated] = useState(false);
  const [channelsCreated, setChannelsCreated] = useState(false);
  const [poolsCreated, setPoolsCreated] = useState(false);

  const handleNext = () => {
    // Mark current step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }

    // Set creation flags based on step
    if (currentStep === 1) setBudgetCreated(true);
    if (currentStep === 2) setChannelsCreated(true);
    if (currentStep === 3) setPoolsCreated(true);

    // Move to next step
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

  const isStepCompleted = (stepId: number) => completedSteps.includes(stepId);
  const isStepCurrent = (stepId: number) => stepId === currentStep;
  const isStepAccessible = (stepId: number) => stepId <= currentStep;

  const canGoBack = currentStep > 1;
  const canGoNext = currentStep < STEPS.length;
  const canSkip = currentStep > 1 && currentStep < STEPS.length;

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
                    <div className="text-xs text-slate-500 max-w-[120px]">
                      {step.description}
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
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>
              {STEPS[currentStep - 1].description}
            </CardDescription>
          </CardHeader>

          <CardContent className="min-h-[400px]">
            {/* Success Alert for Created Steps */}
            {stepCreated && (
              <Alert className="mb-6 border-green-600 bg-green-50">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {currentStep === 1 &&
                    "Budget created successfully! You cannot modify these details once you proceed."}
                  {currentStep === 2 &&
                    "Channels saved! You cannot modify these once you proceed."}
                  {currentStep === 3 &&
                    "Pools saved! You cannot modify these once you proceed."}
                </AlertDescription>
              </Alert>
            )}

            {/* Placeholder for step content */}
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <p className="text-lg font-medium">
                  Step {currentStep} Content
                </p>
                <p className="text-sm mt-2">Form content will be added here</p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t pt-6">
            {/* Back Button */}
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={!canGoBack}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="flex gap-2">
              {/* Skip Button (only show for steps 2-3) */}
              {canSkip && (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip for now
                </Button>
              )}

              {/* Next/Finish Button */}
              {currentStep < STEPS.length ? (
                <Button onClick={handleNext} disabled={!canGoNext}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={handleSkip}>
                    Skip & Finish
                  </Button>
                  <Button
                    disabled={!channelsCreated || !poolsCreated}
                    onClick={handleNext}
                  >
                    Finish Setup
                  </Button>
                </>
              )}
            </div>
          </CardFooter>
        </Card>

        {/* Helper Text */}
        <div className="mt-4 text-center text-sm text-slate-500">
          Step {currentStep} of {STEPS.length}
          {currentStep > 1 &&
            " • You can skip optional steps and add details later"}
        </div>
      </div>
    </div>
  );
}

export default BudgetCreationStepper;
