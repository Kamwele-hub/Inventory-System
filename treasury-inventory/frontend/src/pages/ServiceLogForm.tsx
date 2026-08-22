import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

interface FormValues {
  service_date: string;
  performed_by: string;
  description: string;
  cost: number;
  next_service_due: string;
}

export default function ServiceLogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    await api.post("/service-records/", { ...values, item: id });
    await queryClient.invalidateQueries({ queryKey: ["item", id] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    navigate(`/items/${id}`);
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-1">Log a service event</h1>
      <p className="text-sm text-treasury-slate mb-5">Record maintenance performed on this item.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Service date *</label>
            <input type="date" className="input-field" {...register("service_date", { required: true })} />
            {errors.service_date && <p className="text-xs text-treasury-red mt-1">Required</p>}
          </div>
          <div>
            <label className="label">Next service due</label>
            <input type="date" className="input-field" {...register("next_service_due")} />
          </div>
        </div>

        <div>
          <label className="label">Performed by *</label>
          <input className="input-field" {...register("performed_by", { required: true })} placeholder="Technician or vendor name" />
          {errors.performed_by && <p className="text-xs text-treasury-red mt-1">Required</p>}
        </div>

        <div>
          <label className="label">Description *</label>
          <textarea className="input-field" rows={4} {...register("description", { required: true })} />
          {errors.description && <p className="text-xs text-treasury-red mt-1">Required</p>}
        </div>

        <div>
          <label className="label">Cost (KES)</label>
          <input type="number" step="0.01" min="0" className="input-field" {...register("cost", { valueAsNumber: true, min: 0 })} />
        </div>

        <button disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? "Saving..." : "Log service"}
        </button>
      </form>
    </div>
  );
}
