import { useForm } from "@tanstack/react-form";
import {
  CreateChannelSchema,
  type CreateChannel,
  type ChannelType,
  CHANNEL_TEMPLATES,
  CHANNEL_TYPE_INFO,
} from "@budget/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Plus, Trash2, CreditCard, Banknote } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ChannelFormData extends Omit<CreateChannel, "budgetId"> {
  tempId: string; // Temporary ID for UI management
}

interface ChannelCreationFormProps {
  budgetId: string;
  values?: ChannelFormData[];
  onChange?: (channels: ChannelFormData[]) => void;
  onValidityChange?: (isValid: boolean) => void;
  disabled?: boolean;
}

const ChannelCreationForm = ({
  budgetId,
  values: externalValues = [],
  onChange: externalOnChange,
  onValidityChange,
  disabled = false,
}: ChannelCreationFormProps) => {
  const [channels, setChannels] = useState<ChannelFormData[]>(
    externalValues.length > 0 ? externalValues : [createEmptyChannel()] // Start with one empty channel
  );

  const [validationStates, setValidationStates] = useState<
    Map<string, boolean>
  >(new Map());

  // Helper to create an empty channel
  function createEmptyChannel(): ChannelFormData {
    return {
      tempId: crypto.randomUUID(),
      name: "",
      description: "",
      type: "checking",
      institution: "",
      accountNumber: "",
      creditLimit: undefined,
      billTracking: undefined,
      isActive: true,
    };
  }

  // Notify parent of changes
  useEffect(() => {
    if (externalOnChange) {
      externalOnChange(channels);
    }
  }, [channels, externalOnChange]);

  // Update validity when validation states change
  useEffect(() => {
    if (!onValidityChange) return;

    // All channels must be valid, or we must have at least one valid channel
    const allChannelsValid = channels.every((channel) =>
      validationStates.get(channel.tempId)
    );

    // At least one channel should be present and valid
    const hasValidChannel = channels.length > 0 && allChannelsValid;

    onValidityChange(hasValidChannel);
  }, [channels, validationStates, onValidityChange]);

  const handleAddChannel = () => {
    setChannels([...channels, createEmptyChannel()]);
  };

  const handleRemoveChannel = (tempId: string) => {
    if (channels.length === 1) return; // Don't allow removing the last channel
    setChannels(channels.filter((c) => c.tempId !== tempId));
    setValidationStates((prev) => {
      const newMap = new Map(prev);
      newMap.delete(tempId);
      return newMap;
    });
  };

  const handleUpdateChannel = (
    tempId: string,
    updates: Partial<ChannelFormData>
  ) => {
    setChannels(
      channels.map((channel) =>
        channel.tempId === tempId ? { ...channel, ...updates } : channel
      )
    );
  };

  const handleApplyTemplate = (tempId: string, templateKey: string) => {
    const template = CHANNEL_TEMPLATES[templateKey];
    if (!template) return;

    handleUpdateChannel(tempId, {
      name: template.name,
      description: template.description,
      type: template.type,
      creditLimit: template.creditLimit,
    });
  };

  const handleChannelValidityChange = (tempId: string, isValid: boolean) => {
    setValidationStates((prev) => {
      const newMap = new Map(prev);
      newMap.set(tempId, isValid);
      return newMap;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Add Channels</h2>
        <p className="text-slate-600 mt-1">
          Channels represent your financial accounts where money is physically
          stored (checking, savings, cash, credit cards).
        </p>
      </div>

      {/* Quick Templates */}
      {!disabled && channels.length === 1 && !channels[0].name && (
        <Alert>
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Quick Start Templates:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(CHANNEL_TEMPLATES).map(([key, template]) => (
                  <Button
                    key={key}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyTemplate(channels[0].tempId, key)}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Channel Cards */}
      <div className="space-y-4">
        {channels.map((channel, index) => (
          <ChannelCard
            key={channel.tempId}
            channel={channel}
            index={index}
            budgetId={budgetId}
            disabled={disabled}
            canRemove={channels.length > 1}
            onUpdate={(updates) => handleUpdateChannel(channel.tempId, updates)}
            onRemove={() => handleRemoveChannel(channel.tempId)}
            onValidityChange={(isValid) =>
              handleChannelValidityChange(channel.tempId, isValid)
            }
            onApplyTemplate={(templateKey) =>
              handleApplyTemplate(channel.tempId, templateKey)
            }
          />
        ))}
      </div>

      {/* Add Channel Button */}
      {!disabled && (
        <Button
          type="button"
          variant="outline"
          onClick={handleAddChannel}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Channel
        </Button>
      )}

      {/* Helper Text */}
      <div className="text-sm text-slate-500">
        <p>
          <strong>Tip:</strong> You can skip this step and add channels later,
          but we recommend adding at least your primary checking account to get
          started.
        </p>
      </div>
    </div>
  );
};

interface ChannelCardProps {
  channel: ChannelFormData;
  index: number;
  budgetId: string;
  disabled: boolean;
  canRemove: boolean;
  onUpdate: (updates: Partial<ChannelFormData>) => void;
  onRemove: () => void;
  onValidityChange: (isValid: boolean) => void;
  onApplyTemplate: (templateKey: string) => void;
}

const ChannelCard = ({
  channel,
  index,
  budgetId,
  disabled,
  canRemove,
  onUpdate,
  onRemove,
  onValidityChange,
  onApplyTemplate,
}: ChannelCardProps) => {
  const form = useForm({
    defaultValues: {
      ...channel,
      budgetId,
    },
    validators: {
      onChange: CreateChannelSchema,
    },
  });

  // Sync external values to form
  useEffect(() => {
    Object.entries({ ...channel, budgetId }).forEach(([key, value]) => {
      const fieldValue = form.getFieldValue(key as keyof CreateChannel);
      if (fieldValue !== value) {
        form.setFieldValue(key as keyof CreateChannel, value, {
          dontUpdateMeta: true,
        });
      }
    });
  }, [channel, budgetId, form]);

  // Track form validity
  useEffect(() => {
    const unsubscribe = form.store.subscribe(() => {
      const values = form.state.values;

      // Required fields validation
      const isValid =
        values.name.trim().length > 0 &&
        values.type.length > 0 &&
        // Credit cards must have a credit limit
        (values.type !== "credit" ||
          (values.creditLimit !== undefined && values.creditLimit > 0)) &&
        // Cash accounts shouldn't have institution
        (values.type !== "cash" || !values.institution);

      onValidityChange(isValid);
    });

    // Initial validity check
    const values = form.state.values;
    const isValid =
      values.name.trim().length > 0 &&
      values.type.length > 0 &&
      (values.type !== "credit" ||
        (values.creditLimit !== undefined && values.creditLimit > 0)) &&
      (values.type !== "cash" || !values.institution);

    onValidityChange(isValid);

    return () => unsubscribe();
  }, [form, onValidityChange]);

  const handleFieldChange = (
    field: keyof ChannelFormData,
    value: string | number | boolean | undefined
  ) => {
    form.setFieldValue(field as keyof CreateChannel, value);
    onUpdate({ [field]: value });
  };

  const getChannelIcon = (type: ChannelType) => {
    if (type === "credit") {
      return <CreditCard className="w-5 h-5" />;
    }
    return <Banknote className="w-5 h-5" />;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              {getChannelIcon(channel.type)}
            </div>
            <div>
              <CardTitle className="text-lg">
                {channel.name || `Channel ${index + 1}`}
              </CardTitle>
              {channel.type && (
                <p className="text-sm text-slate-500">
                  {CHANNEL_TYPE_INFO[channel.type].label}
                </p>
              )}
            </div>
          </div>
          {!disabled && canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <FieldGroup>
            {/* Channel Type */}
            <form.Field
              name="type"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={`${channel.tempId}-type`}>
                      Account Type
                    </FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) =>
                        handleFieldChange("type", value as ChannelType)
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger
                        id={`${channel.tempId}-type`}
                        aria-invalid={isInvalid}
                        onBlur={field.handleBlur}
                      >
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CHANNEL_TYPE_INFO).map(
                          ([type, info]) => (
                            <SelectItem key={type} value={type}>
                              <div>
                                <div className="font-medium">{info.label}</div>
                                <div className="text-xs text-slate-500">
                                  {info.description}
                                </div>
                              </div>
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />

            {/* Channel Name */}
            <form.Field
              name="name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={`${channel.tempId}-name`}>
                      Account Name
                    </FieldLabel>
                    <Input
                      id={`${channel.tempId}-name`}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        handleFieldChange("name", e.target.value)
                      }
                      aria-invalid={isInvalid}
                      placeholder="Primary Checking"
                      disabled={disabled}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />

            {/* Description */}
            <form.Field
              name="description"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={`${channel.tempId}-description`}>
                      Description (Optional)
                    </FieldLabel>
                    <Textarea
                      id={`${channel.tempId}-description`}
                      value={field.state.value || ""}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        handleFieldChange("description", e.target.value)
                      }
                      aria-invalid={isInvalid}
                      placeholder="Daily spending account"
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

            {/* Institution (not for cash) */}
            {channel.type !== "cash" && (
              <form.Field
                name="institution"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={`${channel.tempId}-institution`}>
                        Institution (Optional)
                      </FieldLabel>
                      <Input
                        id={`${channel.tempId}-institution`}
                        value={field.state.value || ""}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          handleFieldChange("institution", e.target.value)
                        }
                        aria-invalid={isInvalid}
                        placeholder="Bank of America"
                        disabled={disabled}
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />
            )}

            {/* Account Number (not for cash) */}
            {channel.type !== "cash" && (
              <form.Field
                name="accountNumber"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={`${channel.tempId}-accountNumber`}>
                        Account Number (Optional - Last 4 digits)
                      </FieldLabel>
                      <Input
                        id={`${channel.tempId}-accountNumber`}
                        value={field.state.value || ""}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          handleFieldChange("accountNumber", e.target.value)
                        }
                        aria-invalid={isInvalid}
                        placeholder="1234"
                        maxLength={20}
                        disabled={disabled}
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />
            )}

            {/* Credit Limit (for credit cards) */}
            {channel.type === "credit" && (
              <form.Field
                name="creditLimit"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={`${channel.tempId}-creditLimit`}>
                        Credit Limit
                      </FieldLabel>
                      <Input
                        id={`${channel.tempId}-creditLimit`}
                        type="number"
                        value={field.state.value || ""}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          handleFieldChange(
                            "creditLimit",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined
                          )
                        }
                        aria-invalid={isInvalid}
                        placeholder="5000"
                        min="0"
                        step="0.01"
                        disabled={disabled}
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />
            )}
          </FieldGroup>
        </form>

        {/* Template Suggestions */}
        {!disabled && !channel.name && index === 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-slate-600 mb-2">Quick fill:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CHANNEL_TEMPLATES)
                .slice(0, 3)
                .map(([key, template]) => (
                  <Button
                    key={key}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onApplyTemplate(key)}
                  >
                    {template.name}
                  </Button>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChannelCreationForm;
