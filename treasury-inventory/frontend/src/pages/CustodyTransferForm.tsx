import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { useLocations } from "../hooks/useReferenceData";
import { SelectField } from "../components/SelectField";
import { CustodianPicker } from "../components/CustodianPicker";

interface FormValues {
  location: number;
  notes: string;
}

export default function CustodyTransferForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>();
  const { data: locations, isLoading: loadingLocations } = useLocations();
  const [custodianId, setCustodianId] = useState<number | null>(null);
  const [custodianError, setCustodianError] = useState("");

  async function onSubmit(values: FormValues) {
    if (!custodianId) {
      setCustodianError("Search for and select a custodian.");
      return;
    }
    setCustodianError("");
    await api.post("/custody-records/", {
      item: id,
      custodian: custodianId,
      location: values.location,
      notes: values.notes,
    });
    await queryClient.invalidateQueries({ queryKey: ["item", id] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    navigate(`/items/${id}`);
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-1">Transfer custody</h1>
      <p className="text-sm text-treasury-slate mb-5">Record who now holds this item and where it is stationed.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
        <CustodianPicker
          label="Custodian *"
          value={custodianId}
          onChange={setCustodianId}
          error={custodianError}
        />

        <SelectField
          label="Location *"
          options={(locations ?? []).map((l) => ({ value: l.id, label: `${l.name} (${l.department_name})` }))}
          placeholder={loadingLocations ? "Loading..." : "Select location"}
          {...register("location", { required: true, valueAsNumber: true })}
          error={errors.location ? "Required" : undefined}
        />

        <div>
          <label className="label">Notes</label>
          <textarea className="input-field" rows={3} {...register("notes")} placeholder="Reason for transfer, condition on handover, etc." />
        </div>

        <button disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? "Recording..." : "Record transfer"}
        </button>
      </form>
    </div>
  );
}
