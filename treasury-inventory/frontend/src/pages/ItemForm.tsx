import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useCategories, useVendors } from "../hooks/useReferenceData";
import { SelectField } from "../components/SelectField";

interface FormValues {
  name: string;
  description: string;
  serial_number: string;
  asset_tag: string;
  ifmis_asset_code: string;
  category: number;
  vendor: number | "";
  purchase_order_ref: string;
  funding_source: string;
  unit_cost: number;
  date_acquired: string;
  warranty_expiry: string;
}

export default function ItemForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>();
  const navigate = useNavigate();
  const { data: categories, isLoading: loadingCategories } = useCategories();
  const { data: vendors, isLoading: loadingVendors } = useVendors();

  async function onSubmit(values: FormValues) {
    const payload = { ...values, vendor: values.vendor || null };
    const { data } = await api.post("/items/", payload);
    navigate(`/items/${data.id}`);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-1">Register new item</h1>
      <p className="text-sm text-treasury-slate mb-5">
        Values are recorded in Kenya Shillings (KES). Fields marked * are required.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
        <div>
          <label className="label">Item name *</label>
          <input className="input-field" {...register("name", { required: true })} />
          {errors.name && <p className="text-xs text-treasury-red mt-1">Required</p>}
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input-field" rows={3} {...register("description")} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Serial number *</label>
            <input className="input-field" {...register("serial_number", { required: true })} />
          </div>
          <div>
            <label className="label">Asset tag *</label>
            <input className="input-field" {...register("asset_tag", { required: true })} />
          </div>
        </div>

        <div>
          <label className="label">IFMIS asset code</label>
          <input className="input-field" {...register("ifmis_asset_code")} placeholder="Optional cross-reference" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Category *"
            options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
            placeholder={loadingCategories ? "Loading..." : "Select category"}
            {...register("category", { required: true, valueAsNumber: true })}
            error={errors.category ? "Required" : undefined}
          />
          <SelectField
            label="Vendor"
            options={(vendors ?? []).map((v) => ({ value: v.id, label: v.name }))}
            placeholder={loadingVendors ? "Loading..." : "Select vendor (optional)"}
            {...register("vendor", { valueAsNumber: true })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Unit cost (KES) *</label>
            <input type="number" step="0.01" min="0" className="input-field"
              {...register("unit_cost", { required: true, valueAsNumber: true, min: 0 })} />
          </div>
          <div>
            <label className="label">Date acquired *</label>
            <input type="date" className="input-field" {...register("date_acquired", { required: true })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">LPO / procurement ref</label>
            <input className="input-field" {...register("purchase_order_ref")} />
          </div>
          <div>
            <label className="label">Warranty expiry</label>
            <input type="date" className="input-field" {...register("warranty_expiry")} />
          </div>
        </div>

        <div>
          <label className="label">Funding source</label>
          <input className="input-field" {...register("funding_source")} placeholder="e.g. National Treasury — Programme 0703" />
        </div>

        <div className="flex gap-3 pt-2">
          <button disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? "Saving..." : "Register item"}
          </button>
        </div>
      </form>
    </div>
  );
}
