import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Check, AlertCircle, Search, Command, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { getAllCurrencies } from "../../utils/currencyUtils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

type FormStatus = "unsubmitted" | "submitting" | "success" | "error";

interface BudgetBasicsFormProps {
  budgetName: string;
  setBudgetName: (name: string) => void;
  budgetDescription: string;
  setBudgetDescription: (description: string) => void;
  budgetCurrency: string;
  setBudgetCurrency: (currency: string) => void;
  status: FormStatus;
  error?: string;
  disabled?: boolean;
}

function BudgetBasicsForm({
  budgetName,
  setBudgetName,
  budgetDescription,
  setBudgetDescription,
  budgetCurrency,
  setBudgetCurrency,
  status,
  error,
  disabled = false,
}: BudgetBasicsFormProps) {
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const currencies = useMemo(() => getAllCurrencies(), []);

  const isDisabled =
    disabled || status === "submitting" || status === "success";
  const showSuccess = status === "success";
  const showError = status === "error" && error;

  return (
    <div className="space-y-6">
      {/* Success Alert */}
      {showSuccess && (
        <Alert className="border-green-600 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Budget created successfully! You cannot modify these details once
            you proceed.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {showError && (
        <Alert className="border-red-600 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Budget Name */}
      <div className="space-y-2">
        <Label htmlFor="budget-name">
          Budget Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="budget-name"
          placeholder="e.g., Personal Budget, Family Budget"
          value={budgetName}
          onChange={(e) => setBudgetName(e.target.value)}
          disabled={isDisabled}
        />
        <p className="text-sm text-slate-500">
          Choose a descriptive name for this budget
        </p>
      </div>

      {/* Budget Description */}
      <div className="space-y-2">
        <Label htmlFor="budget-description">Description</Label>
        <Textarea
          id="budget-description"
          placeholder="Optional: Add notes about this budget's purpose"
          value={budgetDescription}
          onChange={(e) => setBudgetDescription(e.target.value)}
          disabled={isDisabled}
          rows={4}
        />
        <p className="text-sm text-slate-500">
          Help yourself remember what this budget is for
        </p>
      </div>

      {/* Currency Selection */}
      <div className="space-y-2">
        <Label>
          Currency <span className="text-red-500">*</span>
        </Label>
        <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={currencyOpen}
              className="w-full justify-between"
              disabled={isDisabled}
            >
              {budgetCurrency ? (
                <span>
                  {currencies.find((c) => c.code === budgetCurrency)?.symbol}{" "}
                  {budgetCurrency}
                </span>
              ) : (
                "Select currency..."
              )}
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search currencies..." />
              <CommandEmpty>No currency found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {currencies.map((currency) => (
                  <CommandItem
                    key={currency.code}
                    value={currency.code}
                    onSelect={(currentValue) => {
                      setBudgetCurrency(currentValue.toUpperCase());
                      setCurrencyOpen(false);
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        budgetCurrency === currency.code
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    />
                    <span className="font-mono font-semibold mr-2">
                      {currency.symbol}
                    </span>
                    <span>{currency.code}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        <p className="text-sm text-slate-500">
          All amounts in this budget will use this currency
        </p>
      </div>

      {/* Submitting indicator */}
      {status === "submitting" && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Creating budget...</span>
        </div>
      )}
    </div>
  );
}

export default BudgetBasicsForm;
