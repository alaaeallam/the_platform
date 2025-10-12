export interface UserRow {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
  role?: string;
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
}