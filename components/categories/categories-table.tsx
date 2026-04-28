'use client';

import { useState, useTransition } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { CategoryFormDialog } from './category-form-dialog';
import { deleteCategoryAction } from '@/app/actions/categories';

interface Category {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
}

export function CategoriesTable({ categories }: { categories: Category[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | undefined>(undefined);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditTarget(undefined);
    setDialogOpen(true);
  }

  function openEdit(category: Category) {
    setEditTarget(category);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (!result.success) setSnackbar(result.error);
    });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Categories
          </Typography>
          <Typography variant="body2" color="text.secondary" className="mt-0.5">
            Organise your transactions into categories
          </Typography>
        </div>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} size="small">
          New category
        </Button>
      </div>

      {categories.length === 0 ? (
        <Box className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <Typography variant="h6" color="text.secondary">
            No categories yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your first category to start organising transactions.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreate} className="mt-2">
            Add category
          </Button>
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: 'grey.50' } }}>
                <TableCell>Name</TableCell>
                <TableCell>Icon</TableCell>
                <TableCell>Color</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {category.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">
                      {category.icon ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {category.color ? (
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-4 h-4 rounded-full border border-slate-200 shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {category.color}
                        </Typography>
                      </div>
                    ) : (
                      <Typography variant="body2" color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(category)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        disabled={isPending}
                        onClick={() => handleDelete(category.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <CategoryFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        category={editTarget}
      />

      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setSnackbar(null)}>
          {snackbar}
        </Alert>
      </Snackbar>
    </>
  );
}
