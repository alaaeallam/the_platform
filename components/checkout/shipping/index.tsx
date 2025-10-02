// components/checkout/shipping/index.tsx
"use client";

import * as React from "react";
import styles from "./styles.module.scss";
import { Form, Formik } from "formik";
import * as Yup from "yup";

import ShippingInput from "../../inputs/shippingInput";
import SingularSelect from "../../selects/SingularSelect";
import { countries } from "../../../data/countries";

import {
  changeActiveAddress,
  deleteAddress,
  saveAddress,
} from "@/requests/user";

import { FaIdCard, FaMapMarkerAlt } from "react-icons/fa";
import { GiPhone } from "react-icons/gi";
import { IoMdArrowDropupCircle } from "react-icons/io";
import { AiOutlinePlus } from "react-icons/ai";
import { IoIosRemoveCircleOutline } from "react-icons/io";

/* ----------------------------- Types ----------------------------- */

export interface Address {
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
}

export interface UserLite {
  image?: string;
  user?: { image?: string }; // when profile=true
  address?: Address[];
}

type ShippingProps = {
  user: UserLite;
  addresses: Address[];
  setAddresses: (next: Address[]) => void;
  profile?: boolean;
};

/* --------------------------- Validation -------------------------- */

const ShippingSchema = Yup.object({
  firstName: Yup.string().required("First name is required.").min(3).max(20),
  lastName: Yup.string().required("Last name is required.").min(3).max(20),
  phoneNumber: Yup.string().required("Phone number is required.").min(3).max(30),
  state: Yup.string().required("State name is required.").min(2).max(60),
  city: Yup.string().required("City name is required.").min(2).max(60),
  zipCode: Yup.string().required("Zip/Postal code is required.").min(2).max(30),
  address1: Yup.string().required("Address Line 1 is required.").min(5).max(100),
  address2: Yup.string().optional().min(5).max(100),
  country: Yup.string().required("Country name is required."),
});

/* ----------------------------- Component ----------------------------- */

const emptyForm: Omit<Address, "_id"> = {
  firstName: "",
  lastName: "",
  phoneNumber: "",
  state: "",
  city: "",
  zipCode: "",
  address1: "",
  address2: "",
  country: "",
};

export default function Shipping({
  user,
  addresses,
  setAddresses,
  profile,
}: ShippingProps) {
  const [form, setForm] = React.useState<Omit<Address, "_id">>(emptyForm);

  // show the create form only when there are no saved addresses
  const hasAnyAddress = Array.isArray(user?.address) && user.address.length > 0;
  const [visible, setVisible] = React.useState<boolean>(!hasAnyAddress);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCountryChange = (value: string) => {
    setForm((prev) => ({ ...prev, country: value || "" }));
  };

  const saveShippingHandler = async (): Promise<void> => {
    const res = await saveAddress(form);
    if (res.ok) {
      // Assert API result to our local Address[] to keep types in one place
      setAddresses(res.data.addresses as unknown as Address[]);
      setVisible(false);
      setForm(emptyForm);
    } else {
      // eslint-disable-next-line no-console
      console.error(res.error);
    }
  };

  const changeActiveHandler = async (id: string): Promise<void> => {
    const res = await changeActiveAddress(id);
    if (res.ok) setAddresses(res.data.addresses as unknown as Address[]);
    else console.error(res.error);
  };

  const deleteHandler = async (id: string): Promise<void> => {
    const res = await deleteAddress(id);
    if (res.ok) setAddresses(res.data.addresses as unknown as Address[]);
    else console.error(res.error);
  };

  const avatarSrc = profile ? user?.user?.image : user?.image;

  return (
    <div className={styles.shipping}>
      {!profile && (
        <div className={styles.header}>
          <h3>Shipping Information</h3>
        </div>
      )}

      {/* Saved addresses */}
      <div className={styles.addresses}>
        {addresses.map((address) => {
          const isActive = !!address.active;
          const id = address._id; // optional _id → guard below
          return (
            <div
              key={id ?? `${address.firstName}-${address.zipCode}`}
              className={styles.address__wrap}
            >
             <button
  type="button"
  className={styles.address__delete}
  onClick={() => id && deleteHandler(id)}
  disabled={!id}
  aria-disabled={!id}
  aria-label={id ? "Delete address" : "No id for this address"}
  title={id ? "Delete address" : "Address has no id"}
>
  <IoIosRemoveCircleOutline />
</button>

              <button
                type="button"
                className={`${styles.address} ${isActive ? styles.active : ""}`}
                onClick={() => id && changeActiveHandler(id)}
                aria-pressed={isActive}
                aria-label={`Select address for ${address.firstName} ${address.lastName}`}
              >
                <div className={styles.address__side}>
                  <img src={avatarSrc || "/avatar.png"} alt="User avatar" />
                </div>

                <div className={styles.address__col}>
                  <span>
                    <FaIdCard />
                    {address.firstName.toUpperCase()}{" "}
                    {address.lastName.toUpperCase()}
                  </span>
                  <span>
                    <GiPhone />
                    {address.phoneNumber}
                  </span>
                </div>

                <div className={styles.address__col}>
                  <span>
                    <FaMapMarkerAlt />
                    {address.address1}
                  </span>
                  {address.address2 ? <span>{address.address2}</span> : null}
                  <span>
                    {address.city}, {address.state}, {address.country}
                  </span>
                  <span>{address.zipCode}</span>
                </div>

                {isActive && (
                  <span className={styles.active__text}>Active</span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Toggle create form */}
      <button
        type="button"
        className={styles.hide_show}
        onClick={() => setVisible((v) => !v)}
        aria-expanded={visible}
      >
        {visible ? (
          <span>
            <IoMdArrowDropupCircle style={{ fontSize: "2rem", fill: "#222" }} />
          </span>
        ) : (
          <span>
            ADD NEW ADDRESS <AiOutlinePlus />
          </span>
        )}
      </button>

      {/* Create / edit address form */}
      {visible && (
        <Formik
          enableReinitialize
          initialValues={form}
          validationSchema={ShippingSchema}
          onSubmit={saveShippingHandler}
        >
          {() => (
            <Form>
              <SingularSelect
                name="country"
                value={form.country}
                placeholder="*Country"
                handleChange={handleCountryChange}
                data={countries as Array<{ _id?: string; name: string }>}
              />

              <div className={styles.col}>
                <ShippingInput
                  name="firstName"
                  placeholder="*First Name"
                  onChange={handleChange}
                />
                <ShippingInput
                  name="lastName"
                  placeholder="*Last Name"
                  onChange={handleChange}
                />
              </div>

              <div className={styles.col}>
                <ShippingInput
                  name="state"
                  placeholder="*State/Province"
                  onChange={handleChange}
                />
                <ShippingInput
                  name="city"
                  placeholder="*City"
                  onChange={handleChange}
                />
              </div>

              <ShippingInput
                name="phoneNumber"
                placeholder="*Phone number"
                onChange={handleChange}
              />
              <ShippingInput
                name="zipCode"
                placeholder="*Post/Zip code"
                onChange={handleChange}
              />
              <ShippingInput
                name="address1"
                placeholder="Address 1"
                onChange={handleChange}
              />
              <ShippingInput
                name="address2"
                placeholder="Address 2"
                onChange={handleChange}
              />

              <button type="submit">Save Address</button>
            </Form>
          )}
        </Formik>
      )}
    </div>
  );
}