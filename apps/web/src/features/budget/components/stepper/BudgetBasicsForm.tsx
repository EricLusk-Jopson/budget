import { useForm } from "@tanstack/react-form";
import { CreateBudgetSchema, type CreateBudget } from "@budget/core";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";

const currencies = [
  { name: "Canadian Dollar", code: "CAD", symbol: "$" },
  { name: "US Dollar", code: "USD", symbol: "$" },
];

interface BudgetBasicsFormProps {
  values?: CreateBudget;
  onChange?: (field: keyof CreateBudget, value: string) => void;
  onValidityChange?: (isValid: boolean) => void;
  disabled?: boolean;
}

const BudgetBasicsForm = ({
  values: externalValues,
  onChange: externalOnChange,
  onValidityChange,
  disabled = false,
}: BudgetBasicsFormProps = {}) => {
  console.log(externalValues);
  const form = useForm({
    defaultValues: externalValues || {
      name: "",
      description: "",
      currency: "CAD",
      ownerId: "",
    },
    validators: {
      onMount: CreateBudgetSchema,
      onChange: CreateBudgetSchema,
    },
    onSubmit: async ({ value }) => {
      console.log("success! Form submitted successfully", value);
    },
  });

  useEffect(() => {
    if (externalValues) {
      Object.entries(externalValues).forEach(([key, value]) => {
        const fieldValue = form.getFieldValue(key as keyof CreateBudget);
        if (fieldValue !== value) {
          form.setFieldValue(key as keyof CreateBudget, value, {
            dontUpdateMeta: true,
          });
        }
      });
    }
  }, [externalValues, form]);

  useEffect(() => {
    if (!onValidityChange) return;

    const unsubscribe = form.store.subscribe(() => {
      const values = form.state.values;

      // Check required fields are filled
      const isValid =
        values.name.trim().length > 0 &&
        values.ownerId.trim().length > 0 &&
        values.currency.length === 3;

      onValidityChange(isValid);
    });

    // Run initial validity check
    const values = form.state.values;
    const isValid =
      values.name.trim().length > 0 &&
      values.ownerId.trim().length > 0 &&
      values.currency.length === 3;
    onValidityChange(isValid);

    return () => unsubscribe();
  }, [form]);

  const handleFieldChange = (field: keyof CreateBudget, value: string) => {
    // Update TanStack Form's internal state
    form.setFieldValue(field, value);

    // If controlled, notify parent of change
    if (externalOnChange) {
      externalOnChange(field, value);
    }
  };

  return (
    <Card>
      <CardContent>
        <form
          id="budget-basics-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Budget Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        handleFieldChange("name", e.target.value)
                      }
                      aria-invalid={isInvalid}
                      placeholder="Shared Home Expenses"
                      autoComplete="off"
                      disabled={disabled}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />

            <form.Field
              name="description"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        handleFieldChange("description", e.target.value)
                      }
                      aria-invalid={isInvalid}
                      placeholder="Keeping track of shared expenses for cleaning supplies, property taxes, management fees, etc."
                      autoComplete="off"
                      className="resize-none"
                      disabled={disabled}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />

            <form.Field
              name="currency"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Currency</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) =>
                        handleFieldChange("currency", value)
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger
                        id={field.name}
                        aria-invalid={isInvalid}
                        onBlur={field.handleBlur}
                      >
                        <SelectValue placeholder="Select a currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.name} ({currency.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
};

export default BudgetBasicsForm;
