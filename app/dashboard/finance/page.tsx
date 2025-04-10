"use client";

import { useFinanceData } from "@/lib/hooks/use-finance-data";
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react"
import { TransactionForm } from "./components/transaction-form"
import { useFinanceHistory, useFinanceMutations, type FinanceData, type FinanceTransaction } from "@/hooks/useFinance"
import { formatRupiah } from "@/lib/utils"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

// Local interface for displaying transactions in the UI
interface Transaction extends FinanceTransaction {
  // Add any UI-specific fields here
  type?: "income" | "expense" // Optional field for UI purposes
}

interface TransactionFormData {
  amount: string;
  type: "income" | "expense";
  date: Date;
  description: string;
}

export default function FinancePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null)

  const { data: financeSummary, isLoading } = useFinanceData();
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    refetch
  } = useFinanceHistory();

  // Map API transactions to UI transactions with derived type field
  const transactions: Transaction[] = (transactionsData?.transactions || []).map(t => ({
    ...t,
    type: t.category === "Pemasukan" ? "income" : "expense"
  }));
  const { createFinance, updateFinance, deleteFinance } = useFinanceMutations();

  const handleAddTransaction = (data: TransactionFormData) => {
    const financeData: FinanceData = {
      amount: Number(data.amount),
      category: data.type === "income" ? "Pemasukan" : "Pengeluaran",
      date: data.date.toISOString(),
      description: data.description
    }

    createFinance.mutate(financeData, {
      onSuccess: () => {
        setIsDialogOpen(false)
        refetch()
      }
    })
  }

  const handleEditTransaction = (data: TransactionFormData) => {
    if (!transactionToEdit) return

    const financeData: FinanceData = {
      amount: Number(data.amount),
      category: data.type === "income" ? "Pemasukan" : "Pengeluaran",
      date: data.date.toISOString(),
      description: data.description
    }

    updateFinance.mutate({
      id: transactionToEdit.id,
      data: financeData
    }, {
      onSuccess: () => {
        setIsEditDialogOpen(false)
        setTransactionToEdit(null)
        refetch()
      }
    })
  }

  const handleDeleteTransaction = () => {
    if (!transactionToDelete) return

    deleteFinance.mutate(transactionToDelete, {
      onSuccess: () => {
        setIsDeleteAlertOpen(false)
        setTransactionToDelete(null)
        refetch()
      }
    })
  }

  const openEditDialog = (transaction: Transaction) => {
    setTransactionToEdit(transaction)
    setIsEditDialogOpen(true)
  }

  const openDeleteAlert = (id: number) => {
    setTransactionToDelete(id)
    setIsDeleteAlertOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manajemen Keuangan</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Transaksi
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Transaksi Baru</DialogTitle>
            </DialogHeader>
            <TransactionForm onSubmit={handleAddTransaction} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Pemasukan</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold text-green-600">
                {formatRupiah(financeSummary?.total_income || "0")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold text-red-600">
                {formatRupiah(financeSummary?.total_expense || "0")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saldo Saat Ini</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold">
                {formatRupiah(financeSummary?.current_balance || "0")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTransactions ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Belum ada transaksi</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction: Transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{format(new Date(transaction.date), "dd MMM yyyy")}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      {transaction.category === "Pemasukan" ? (
                        <Badge className="bg-green-500 hover:bg-green-600 text-white">
                          <ArrowDown className="mr-1 h-3 w-3" />
                          {transaction.category}
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <ArrowUp className="mr-1 h-3 w-3" />
                          {transaction.category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={transaction.category === "Pemasukan" ? "text-green-600" : "text-red-600"}>
                        {formatRupiah(Number(transaction.amount))}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(transaction)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => openDeleteAlert(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaksi</DialogTitle>
          </DialogHeader>
          {transactionToEdit && (
            <TransactionForm
              onSubmit={handleEditTransaction}
              defaultValues={{
                date: new Date(transactionToEdit.date),
                description: transactionToEdit.description,
                amount: String(transactionToEdit.amount),
                type: transactionToEdit.category === "Pemasukan" ? "income" : "expense"
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Transaction Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTransaction}
              className="bg-red-500 hover:bg-red-600"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}










