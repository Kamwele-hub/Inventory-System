import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { SelectField } from "../components/SelectField";

interface FormValues {
  disposal_date: string;
  method: "sold" | "scrapped" | "donated" | "lost_write_off";
  reason: string;
  proceeds: number;
}

const METHODS = [
  { value: "sold", label: "Sold" },
  { value: "scrapped", label: "Scrapped" },
  { value: "donated", label: "Donated" },
  { value: "lost_write_off", label: "Lost — written off" },
];

export default function DisposalForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    await api.post("/disposals/", { ...values, item: id });
    await queryClient.invalidateQueries({ queryKey: ["item", id] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    navigate(`/items/${id}`);
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-1">Dispose / write off item</h1>
      <p className="text-sm text-treasury-red-dark bg-treasury-red/10 rounded-md px-3 py-2 mb-5">
        This is final. The item's status will be set to "disposed" and it will
        drop out of the active register. Confirm this matches your asset
        disposal committee's approval under the Public Procurement and Asset
        Disposal Act, 2015 before submitting.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Disposal date *</label>
            <input type="date" className="input-field" {...register("disposal_date", { required: true })} />
            {errors.disposal_date && <p className="text-xs text-treasury-red mt-1">Required</p>}
          </div>
          <SelectField
            label="Method *"
            options={METHODS}
            {...register("method", { required: true })}
            error={errors.method ? "Required" : undefined}
          />
        </div>

        <div>
          <label className="label">Reason *</label>
          <textarea className="input-field" rows={4} {...register("reason", { required: true })} placeholder="Committee reference, condition, justification..." />
          {errors.reason && <p className="text-xs text-treasury-red mt-1">Required</p>}
        </div>

        <div>
          <label className="label">Proceeds (KES)</label>
          <input type="number" step="0.01" min="0" className="input-field" {...register("proceeds", { valueAsNumber: true, min: 0 })} />
        </div>

        <button disabled={isSubmitting} className="btn-danger">
          {isSubmitting ? "Recording..." : "Confirm disposal"}
        </button>
      </form>
    </div>
  );
}
