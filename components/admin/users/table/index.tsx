'use client';

import * as React from 'react';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import { visuallyHidden } from '@mui/utils';
import { RiDeleteBin7Fill } from 'react-icons/ri';
import axios from "axios";
import { toast } from 'react-toastify';

import styles from './styles.module.scss';

/* ============= Types from page props ============= */

export type UserRow = {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
  role?: string;      // 'admin' | 'customer' | ...
  verified?: boolean;
};

type Order = 'asc' | 'desc';

/** Exact shape rendered by the table (kept concrete to please TS) */
type DisplayRow = {
  id: string;         // from _id
  name: string;
  email: string;
  image: string;      // always a string ('' if absent)
  verified: boolean;
  admin: boolean;
};

/* ============= Sorting helpers (DisplayRow-specific) ============= */

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

/* ============= Head cells ============= */

type HeadCell<T> = {
  id: keyof T;
  numeric?: boolean;
  disablePadding?: boolean;
  label: string;
};

const headCells: HeadCell<DisplayRow>[] = [
  { id: 'image', numeric: false, disablePadding: true, label: '' },
  { id: 'name', numeric: false, label: 'Name' },
  { id: 'email', numeric: false, label: 'Email' },
  { id: 'verified', numeric: true, label: 'Verified' },
  { id: 'admin', numeric: true, label: 'Admin' },
];

type EnhancedTableHeadProps = {
  numSelected: number;
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  order: Order;
  orderBy: keyof DisplayRow;
  rowCount: number;
  onRequestSort: (event: React.MouseEvent<unknown>, property: keyof DisplayRow) => void;
};

function EnhancedTableHead(props: EnhancedTableHeadProps) {
  const { onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort } = props;

  const createSortHandler =
    (property: keyof DisplayRow) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{ 'aria-label': 'select all users' }}
          />
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={String(headCell.id)}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
        {/* actions column */}
        <TableCell align="right" />
      </TableRow>
    </TableHead>
  );
}

/* ============= Toolbar ============= */

function EnhancedTableToolbar({ numSelected }: { numSelected: number }) {
  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        ...(numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
        }),
      }}
    >
      {numSelected > 0 ? (
        <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1" component="div">
          {numSelected} selected
        </Typography>
      ) : (
        <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div">
          Users
        </Typography>
      )}

      {numSelected > 0 ? (
        <Tooltip title="Delete">
          <IconButton>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Filter list">
          <IconButton>
            <FilterListIcon />
          </IconButton>
        </Tooltip>
      )}
    </Toolbar>
  );
}

/* ============= Main component ============= */

type Props = { rows: UserRow[] };

export default function EnhancedTable({ rows }: Props) {
  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] = React.useState<keyof DisplayRow>('name');
  const [selected, setSelected] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(0);
  const [dense, setDense] = React.useState(false);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  // track a single-row delete in progress
  const [deleting, setDeleting] = React.useState<string | null>(null);

  // local mutable copy so we can update UI after deletes
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
      await axios.delete(`/api/admin/users/${id}`);
      // Optimistically unselect and remove from table
      setSelected((s) => s.filter((x) => x !== id));
      setData((prev) => prev.filter((r) => r.id !== id));
      toast.success('User deleted');
    } catch (e: unknown) {
      let message = 'Delete failed';
      if (e && typeof e === 'object') {
        const err = e as { response?: { data?: { message?: string } }; message?: string };
        message = err.response?.data?.message ?? err.message ?? message;
      }
      toast.error(message);
    } finally {
      setDeleting(null);
    }
  }

  const handleRequestSort = (_: React.MouseEvent<unknown>, property: keyof DisplayRow) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelected(event.target.checked ? data.map((r) => r.id) : []);
  };

  const handleClick = (_event: React.MouseEvent<unknown>, id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleChangeDense = (event: React.ChangeEvent<HTMLInputElement>) =>
    setDense(event.target.checked);

  const isSelected = (id: string) => selected.includes(id);

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;

  const sorted: DisplayRow[] = stableSort(data, getComparator(order, orderBy)).slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <EnhancedTableToolbar numSelected={selected.length} />
        <TableContainer>
          <Table
            sx={{ minWidth: 750 }}
            aria-labelledby="tableTitle"
            size={dense ? 'small' : 'medium'}
            className={styles.table}
          >
            <EnhancedTableHead
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={data.length}
            />

            <TableBody>
              {sorted.map((row: DisplayRow) => {
                const isItemSelected = isSelected(row.id);
                const labelId = `enhanced-table-checkbox-${row.id}`;

                return (
                  <TableRow
                    hover
                    onClick={(event: React.MouseEvent) => handleClick(event, row.id)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.id}
                    selected={isItemSelected}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox color="primary" checked={isItemSelected} inputProps={{ 'aria-labelledby': labelId }} />
                    </TableCell>

                    <TableCell component="th" id={labelId} scope="row" padding="none" style={{ paddingTop: 5 }}>
                      {row.image ? (
                        <img src={row.image} alt="" className={styles.table__img} />
                      ) : (
                        <div className={styles.table__img} />
                      )}
                    </TableCell>

                    <TableCell align="right">{row.name}</TableCell>
                    <TableCell align="right">{row.email}</TableCell>

                    <TableCell align="right">
                      <img
                        src={row.verified ? '/images/verified.png' : '/images/unverified.png'}
                        alt={row.verified ? 'Verified' : 'Unverified'}
                        className={styles.ver}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <img
                        src={row.admin ? '/images/verified.png' : '/images/unverified.png'}
                        alt={row.admin ? 'Admin' : 'Not admin'}
                        className={styles.ver}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <button
    type="button"
    onClick={(e) => { e.stopPropagation(); deleteOne(row.id); }}
    title="Delete user"
    disabled={deleting === row.id}
    style={{ background: "none", border: 0, cursor: "pointer" }}
  >
    <RiDeleteBin7Fill />
  </button>
                    </TableCell>
                  </TableRow>
                );
              })}

              {emptyRows > 0 && (
                <TableRow style={{ height: (dense ? 33 : 53) * emptyRows }}>
                  <TableCell colSpan={7} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <FormControlLabel control={<Switch checked={dense} onChange={handleChangeDense} />} label="Dense padding" />
    </Box>
  );
}