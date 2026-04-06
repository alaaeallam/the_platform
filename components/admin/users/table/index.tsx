'use client';

import * as React from 'react';
import Image from 'next/image';
import { toast } from 'react-toastify';
import DeleteIcon from '@mui/icons-material/Delete';
import styles from './styles.module.scss';

export type UserRow = {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
  role?: string;
  verified?: boolean;
};

type Order = 'asc' | 'desc';

type DisplayRow = {
  id: string;
  name: string;
  email: string;
  image: string;
  verified: boolean;
  admin: boolean;
};

function descendingComparator(
  a: DisplayRow,
  b: DisplayRow,
  orderBy: keyof DisplayRow
) {
  const av = a[orderBy] as unknown as string | number | boolean | undefined;
  const bv = b[orderBy] as unknown as string | number | boolean | undefined;
  if (bv! < av!) return -1;
  if (bv! > av!) return 1;
  return 0;
}

function getComparator(
  order: Order,
  orderBy: keyof DisplayRow
): (a: DisplayRow, b: DisplayRow) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(
  array: readonly DisplayRow[],
  comparator: (a: DisplayRow, b: DisplayRow) => number
) {
  const stabilized = array.map((el, index) => [el, index] as const);
  stabilized.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    return order !== 0 ? order : a[1] - b[1];
  });
  return stabilized.map((el) => el[0]);
}

type SortKey = keyof DisplayRow;

type HeadCell = {
  id: SortKey;
  label: string;
  align?: 'left' | 'right' | 'center';
};

const headCells: HeadCell[] = [
  { id: 'image', label: '', align: 'left' },
  { id: 'name', label: 'Name', align: 'left' },
  { id: 'email', label: 'Email', align: 'left' },
  { id: 'verified', label: 'Verified', align: 'center' },
  { id: 'admin', label: 'Admin', align: 'center' },
];

type Props = { rows: UserRow[] };

function SortButton({
  active,
  order,
  label,
  onClick,
}: {
  active: boolean;
  order: Order;
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'none',
        border: 0,
        padding: 0,
        color: 'inherit',
        font: 'inherit',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      <span>{label}</span>
      {label ? <span style={{ fontSize: 12 }}>{active ? (order === 'asc' ? '▲' : '▼') : '↕'}</span> : null}
    </button>
  );
}

export default function EnhancedTable({ rows }: Props) {
  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] = React.useState<SortKey>('name');
  const [selected, setSelected] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(0);
  const [dense, setDense] = React.useState(false);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const [data, setData] = React.useState<DisplayRow[]>([]);

  React.useEffect(() => {
    setData(
      (rows ?? []).map((u) => ({
        id: u._id,
        name: u.name ?? '',
        email: u.email ?? '',
        image: u.image ?? '',
        verified: Boolean(u.verified),
        admin: (u.role ?? '') === 'admin',
      }))
    );
  }, [rows]);

  async function deleteOne(id: string) {
    if (!confirm('Delete this user?')) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });

      const payload = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        throw new Error(payload.message || 'Delete failed');
      }

      setSelected((prev) => prev.filter((x) => x !== id));
      setData((prev) => prev.filter((r) => r.id !== id));
      toast.success('User deleted');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Delete failed';
      toast.error(message);
    } finally {
      setDeleting(null);
    }
  }

  const handleRequestSort = (_: React.MouseEvent<unknown>, property: SortKey) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelected(event.target.checked ? data.map((r) => r.id) : []);
  };

  const handleClick = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isSelected = (id: string) => selected.includes(id);

  const sortedData = React.useMemo(
    () => stableSort(data, getComparator(order, orderBy)),
    [data, order, orderBy]
  );

  const pageRows = React.useMemo(
    () =>
      sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedData, page, rowsPerPage]
  );

  const totalPages = Math.max(1, Math.ceil(data.length / rowsPerPage));

  React.useEffect(() => {
    if (page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

  const rowHeight = dense ? 44 : 58;
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          width: '100%',
          marginBottom: 16,
          borderRadius: 16,
          background: '#fff',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>Users</div>
            {selected.length > 0 ? (
              <div style={{ color: '#2563eb', fontSize: 14 }}>{selected.length} selected</div>
            ) : (
              <div style={{ color: '#6b7280', fontSize: 14 }}>Manage users and roles</div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={dense}
                onChange={(event) => setDense(event.target.checked)}
              />
              Dense padding
            </label>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table
            className={styles.table}
            style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse' }}
          >
            <thead>
              <tr>
                <th style={{ padding: '12px 16px', width: 48 }}>
                  <input
                    type="checkbox"
                    aria-label="select all users"
                    checked={data.length > 0 && selected.length === data.length}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = selected.length > 0 && selected.length < data.length;
                      }
                    }}
                    onChange={handleSelectAllClick}
                  />
                </th>
                {headCells.map((headCell) => (
                  <th
                    key={String(headCell.id)}
                    style={{
                      padding: '12px 16px',
                      textAlign: headCell.align ?? 'left',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <SortButton
                      active={orderBy === headCell.id}
                      order={orderBy === headCell.id ? order : 'asc'}
                      label={headCell.label}
                      onClick={(event) => handleRequestSort(event, headCell.id)}
                    />
                  </th>
                ))}
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {pageRows.map((row) => {
                const selectedRow = isSelected(row.id);
                return (
                  <tr
                    key={row.id}
                    onClick={() => handleClick(row.id)}
                    style={{
                      background: selectedRow ? 'rgba(37, 99, 235, 0.06)' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <td style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>
                      <input
                        type="checkbox"
                        checked={selectedRow}
                        onChange={() => handleClick(row.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`select ${row.name || row.email || row.id}`}
                      />
                    </td>

                    <td style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', width: 64 }}>
                      {row.image ? (
                        <Image
                          src={row.image}
                          alt={row.name || 'User avatar'}
                          width={36}
                          height={36}
                          sizes="36px"
                          className={styles.table__img}
                          priority={false}
                        />
                      ) : (
                        <div className={styles.table__img} />
                      )}
                    </td>

                    <td style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>{row.name}</td>
                    <td style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>{row.email}</td>

                    <td style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
                      <Image
                        src={row.verified ? '/images/verified.png' : '/images/unverified.png'}
                        alt={row.verified ? 'Verified' : 'Unverified'}
                        width={18}
                        height={18}
                        sizes="18px"
                        className={styles.ver}
                        priority={false}
                      />
                    </td>

                    <td style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
                      <Image
                        src={row.admin ? '/images/verified.png' : '/images/unverified.png'}
                        alt={row.admin ? 'Admin' : 'Not admin'}
                        width={18}
                        height={18}
                        sizes="18px"
                        className={styles.ver}
                        priority={false}
                      />
                    </td>

                    <td style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void deleteOne(row.id);
                        }}
                        title="Delete user"
                        disabled={deleting === row.id}
                        style={{
                          background: 'none',
                          border: 0,
                          cursor: deleting === row.id ? 'not-allowed' : 'pointer',
                          opacity: deleting === row.id ? 0.6 : 1,
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {emptyRows > 0 && (
                <tr style={{ height: rowHeight * emptyRows }}>
                  <td colSpan={7} />
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            padding: '12px 16px',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <div style={{ fontSize: 14, color: '#6b7280' }}>
            Showing {data.length === 0 ? 0 : page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, data.length)} of {data.length}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              Rows:
              <select
                value={rowsPerPage}
                onChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
                style={{ minHeight: 34, borderRadius: 8, border: '1px solid #d1d5db', padding: '0 8px' }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </label>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={page === 0}
                style={{ minWidth: 72, minHeight: 34, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}
              >
                Prev
              </button>
              <span style={{ fontSize: 14 }}>
                {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={page >= totalPages - 1}
                style={{ minWidth: 72, minHeight: 34, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}