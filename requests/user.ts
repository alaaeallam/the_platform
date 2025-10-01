// requests/user.ts
import axios, { AxiosError } from "axios";

/* ---------- Shared Types ---------- */

export type Address = {
  _id?: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  state: string;
  city: string;
  zipCode: string;
  address1: string;
  address2?: string;
  country: string;
  active?: boolean;
};

type AddressListPayload = { addresses: Address[] };

type CouponSuccess = {
  totalAfterDiscount: number;
  discount: number;
};

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: string };
export type ApiResult<T> = ApiOk<T> | ApiErr;

/* ---------- Helpers ---------- */

function getAxiosErrorMessage(err: unknown): string {
  const ax = err as AxiosError<any>;
  if (ax?.response?.data) {
    const d = ax.response.data as any;
    // common shapes: { message }, { error: { message } }
    if (typeof d.message === "string") return d.message;
    if (d.error && typeof d.error.message === "string") return d.error.message;
  }
  return ax?.message || "Request failed";
}

async function wrap<T>(p: Promise<{ data: T }>): Promise<ApiResult<T>> {
  try {
    const { data } = await p;
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: getAxiosErrorMessage(err) };
  }
}

/* ---------- API Calls ---------- */

export async function saveCart(
  cart: unknown
): Promise<ApiResult<unknown>> {
  // Server returns a variety of shapes; keep as unknown unless you control it.
  return wrap(axios.post<unknown>("/api/user/saveCart", { cart }));
}

export async function saveAddress(
  address: Address,
  userId?: string
): Promise<ApiResult<AddressListPayload>> {
  return wrap(
    axios.post<AddressListPayload>("/api/user/saveAddress", { address, userId })
  );
}

export async function changeActiveAddress(
  id: string
): Promise<ApiResult<AddressListPayload>> {
  return wrap(
    axios.put<AddressListPayload>("/api/user/manageAddress", { id })
  );
}

export async function deleteAddress(
  id: string
): Promise<ApiResult<AddressListPayload>> {
  // axios.delete sends payload via the `data` option
  return wrap(
    axios.delete<AddressListPayload>("/api/user/manageAddress", { data: { id } })
  );
}

export async function applyCoupon(
  coupon: string
): Promise<ApiResult<CouponSuccess>> {
  return wrap(
    axios.post<CouponSuccess>("/api/user/applyCoupon", { coupon })
  );
}