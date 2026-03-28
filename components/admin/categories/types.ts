export interface CategoryVM {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  iconKey?: string;
  parent?: string | null;
  createdAt?: string;
  updatedAt?: string;
}