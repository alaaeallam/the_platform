import { useState } from "react";

/**
 * Hook for paginating an array of items.
 *
 * @param data - The full array of items to paginate.
 * @param itemsPerPage - Number of items to show per page.
 */
export default function usePagination<T>(data: T[], itemsPerPage: number) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const maxPage = Math.max(1, Math.ceil(data.length / itemsPerPage));

  /** Items for the current page */
  function currentData(): T[] {
    const begin = (currentPage - 1) * itemsPerPage;
    const end = begin + itemsPerPage;
    return data.slice(begin, end);
  }

  /** Go to the next page */
  function next(): void {
    setCurrentPage((prev) => Math.min(prev + 1, maxPage));
  }

  /** Go to the previous page */
  function prev(): void {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }

  /** Jump to a specific page */
  function jump(page: number): void {
    const pageNumber = Math.max(1, page);
    setCurrentPage(() => Math.min(pageNumber, maxPage));
  }

  return { next, prev, jump, currentData, currentPage, maxPage };
}