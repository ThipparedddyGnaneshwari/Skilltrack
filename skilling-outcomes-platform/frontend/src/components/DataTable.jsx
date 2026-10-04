import { useMemo, useState } from 'react';
import { Box, Table, TableHead, TableRow, TableCell, TableBody, TableSortLabel, TablePagination, TextField, InputAdornment, Stack } from '@mui/material';
import Search from '@mui/icons-material/Search';
import { EmptyState } from './ui.jsx';

// columns: [{ key, label, render?(row), align?, sortable? }]
export default function DataTable({ rows, columns, onRowClick, initialQuery = '', pageSize = 8, searchable = true, toolbar, emptyText = 'Try a different search.' }) {
  const [q, setQ] = useState(initialQuery); const [page, setPage] = useState(0); const [rpp, setRpp] = useState(pageSize); const [sort, setSort] = useState({ key: null, asc: true });
  const data = useMemo(() => {
    let r = rows.filter((x) => !q || Object.values(x).some((v) => typeof v !== 'object' && String(v).toLowerCase().includes(q.toLowerCase())));
    if (sort.key) r = [...r].sort((a, b) => (a[sort.key] > b[sort.key] ? 1 : -1) * (sort.asc ? 1 : -1));
    return r;
  }, [rows, q, sort]);
  return (
    <Box>
      {(searchable || toolbar) && <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }} alignItems="center">
        {searchable && <TextField placeholder="Search" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} sx={{ width: { xs: '100%', sm: 280 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />}{toolbar}</Stack>}
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead><TableRow>{columns.map((c) => (
            <TableCell key={c.key} align={c.align}>{c.sortable === false ? c.label :
              <TableSortLabel active={sort.key === c.key} direction={sort.asc ? 'asc' : 'desc'} onClick={() => { setSort({ key: c.key, asc: sort.key === c.key ? !sort.asc : true }); setPage(0); }}>{c.label}</TableSortLabel>}</TableCell>))}</TableRow></TableHead>
          <TableBody>{data.slice(page * rpp, page * rpp + rpp).map((r, i) => (
            <TableRow key={r.id ?? i} hover onClick={onRowClick ? () => onRowClick(r) : undefined} sx={{ cursor: onRowClick ? 'pointer' : 'default', '&:last-child td': { border: 0 } }}>
              {columns.map((c) => <TableCell key={c.key} align={c.align} sx={{ py: 1.1 }}>{c.render ? c.render(r) : r[c.key]}</TableCell>)}</TableRow>))}</TableBody>
        </Table>
      </Box>
      {data.length === 0 && <EmptyState title="No results" text={emptyText} />}
      <TablePagination component="div" count={data.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rpp} rowsPerPageOptions={[8, 15, 30]}
        onRowsPerPageChange={(e) => { setRpp(+e.target.value); setPage(0); }} />
    </Box>
  );
}
