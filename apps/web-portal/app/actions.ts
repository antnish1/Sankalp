"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { claimStatuses } from "@/components/data";
import { createServerSupabaseClient, getServerAccessToken, getAuthenticatedProfile } from "@/lib/auth-server";

function textValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(formData: FormData, name: string) {
  const value = textValue(formData, name);
  return value ? Number(value) : null;
}

async function currentProfileId() {
  const accessToken = await getServerAccessToken();
  const { profile } = await getAuthenticatedProfile(accessToken);
  return profile?.id ?? null;
}

export async function createCustomer(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const createdBy = await currentProfileId();
  const contactName = textValue(formData, "contact_name");
  const phone = textValue(formData, "phone");

  if (!contactName || !phone) {
    throw new Error("Contact name and phone are required.");
  }

  const { error } = await supabase.from("customers").insert({
    customer_code: `CUST-${Date.now()}`,
    contact_name: contactName,
    company_name: textValue(formData, "company_name"),
    phone,
    email: textValue(formData, "email"),
    address: textValue(formData, "address"),
    city: textValue(formData, "city"),
    state: textValue(formData, "state"),
    created_by: createdBy
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/customers");
}

export async function updateCustomer(id: string, formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const contactName = textValue(formData, "contact_name");
  const phone = textValue(formData, "phone");

  if (!contactName || !phone) {
    throw new Error("Contact name and phone are required.");
  }

  const { error } = await supabase
    .from("customers")
    .update({
      contact_name: contactName,
      company_name: textValue(formData, "company_name"),
      phone,
      email: textValue(formData, "email"),
      address: textValue(formData, "address"),
      city: textValue(formData, "city"),
      state: textValue(formData, "state")
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  redirect("/customers");
}

export async function createVehicle(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const customerId = textValue(formData, "customer_id");
  const vehicleNo = textValue(formData, "vehicle_no");
  const vehicleType = textValue(formData, "vehicle_type");

  if (!customerId || !vehicleNo || !vehicleType) {
    throw new Error("Customer, vehicle number, and vehicle type are required.");
  }

  const { error } = await supabase.from("vehicles").insert({
    customer_id: customerId,
    vehicle_no: vehicleNo,
    vehicle_type: vehicleType,
    make: textValue(formData, "make"),
    model: textValue(formData, "model"),
    year: numberValue(formData, "year"),
    chassis_no: textValue(formData, "chassis_no"),
    engine_no: textValue(formData, "engine_no"),
    permit_no: textValue(formData, "permit_no")
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/vehicles");
}

export async function updateVehicle(id: string, formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const customerId = textValue(formData, "customer_id");
  const vehicleNo = textValue(formData, "vehicle_no");
  const vehicleType = textValue(formData, "vehicle_type");

  if (!customerId || !vehicleNo || !vehicleType) {
    throw new Error("Customer, vehicle number, and vehicle type are required.");
  }

  const { error } = await supabase
    .from("vehicles")
    .update({
      customer_id: customerId,
      vehicle_no: vehicleNo,
      vehicle_type: vehicleType,
      make: textValue(formData, "make"),
      model: textValue(formData, "model"),
      year: numberValue(formData, "year"),
      chassis_no: textValue(formData, "chassis_no"),
      engine_no: textValue(formData, "engine_no"),
      permit_no: textValue(formData, "permit_no")
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  redirect("/vehicles");
}

async function insuranceCompanyId(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const existingId = textValue(formData, "insurance_company_id");
  const newName = textValue(formData, "insurance_company_name");

  if (existingId) {
    return existingId;
  }

  if (!newName) {
    return null;
  }

  const { data: existing, error: existingError } = await supabase
    .from("insurance_companies")
    .select("id")
    .eq("name", newName)
    .maybeSingle<{ id: string }>();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing?.id) {
    return existing.id;
  }

  const { data: created, error: createError } = await supabase
    .from("insurance_companies")
    .insert({ name: newName })
    .select("id")
    .single<{ id: string }>();

  if (createError) {
    throw new Error(createError.message);
  }

  return created.id;
}

export async function createPolicy(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const customerId = textValue(formData, "customer_id");
  const vehicleId = textValue(formData, "vehicle_id");
  const insurerId = await insuranceCompanyId(formData);
  const policyNo = textValue(formData, "policy_no");
  const policyType = textValue(formData, "policy_type");
  const startDate = textValue(formData, "start_date");
  const endDate = textValue(formData, "end_date");

  if (!customerId || !vehicleId || !insurerId || !policyNo || !policyType || !startDate || !endDate) {
    throw new Error("Customer, vehicle, insurer, policy number, policy type, and policy dates are required.");
  }

  const { error } = await supabase.from("policies").insert({
    customer_id: customerId,
    vehicle_id: vehicleId,
    insurance_company_id: insurerId,
    policy_no: policyNo,
    policy_type: policyType,
    insured_declared_value: numberValue(formData, "insured_declared_value"),
    start_date: startDate,
    end_date: endDate
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/policies");
}

export async function updatePolicy(id: string, formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const customerId = textValue(formData, "customer_id");
  const vehicleId = textValue(formData, "vehicle_id");
  const insurerId = await insuranceCompanyId(formData);
  const policyNo = textValue(formData, "policy_no");
  const policyType = textValue(formData, "policy_type");
  const startDate = textValue(formData, "start_date");
  const endDate = textValue(formData, "end_date");

  if (!customerId || !vehicleId || !insurerId || !policyNo || !policyType || !startDate || !endDate) {
    throw new Error("Customer, vehicle, insurer, policy number, policy type, and policy dates are required.");
  }

  const { error } = await supabase
    .from("policies")
    .update({
      customer_id: customerId,
      vehicle_id: vehicleId,
      insurance_company_id: insurerId,
      policy_no: policyNo,
      policy_type: policyType,
      insured_declared_value: numberValue(formData, "insured_declared_value"),
      start_date: startDate,
      end_date: endDate
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  redirect("/policies");
}

export async function updateClaimStatus(id: string, formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const changedBy = await currentProfileId();
  const nextStatus = textValue(formData, "current_status");
  const notes = textValue(formData, "notes");

  if (!nextStatus || !claimStatuses.includes(nextStatus as (typeof claimStatuses)[number])) {
    throw new Error("Choose a valid claim status.");
  }

  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .select("id, current_status")
    .eq("id", id)
    .maybeSingle<{ id: string; current_status: (typeof claimStatuses)[number] }>();

  if (claimError || !claim) {
    throw new Error(claimError?.message ?? "Claim not found.");
  }

  if (claim.current_status === nextStatus) {
    revalidatePath(`/claims/${id}`);
    return;
  }

  const { error: updateError } = await supabase
    .from("claims")
    .update({ current_status: nextStatus })
    .eq("id", id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { error: historyError } = await supabase.from("claim_status_history").insert({
    claim_id: id,
    from_status: claim.current_status,
    to_status: nextStatus,
    notes,
    changed_by: changedBy
  });

  if (historyError) {
    throw new Error(historyError.message);
  }

  revalidatePath(`/claims/${id}`);
  revalidatePath("/claims");
  revalidatePath("/timeline");
}
