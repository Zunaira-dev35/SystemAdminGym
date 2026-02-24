// src/redux/pagesSlices/financeSlice.ts

import { createSlice, createAsyncThunk, isAnyOf } from "@reduxjs/toolkit";
import { ApiRequests } from "../../service/ApiRequests";
import {
  catchAsync,
  handleLoadingErrorParamsForAsycThunk,
  reduxToolKitCaseBuilder,
} from "../../helpers/detectError";
import { toast } from "@/hooks/use-toast";

export interface ExpenseCategory {
  id: number;
  title: string;
  description?: string;
}

export interface Expense {
  id: number;
  title: string;
  amount: number;
  category_id: number;
  deposit_method: string;
  date: string;
  notes: string;
}

export interface IncomeCategory {
  id: number;
  title: string;
  description?: string;
}

export interface Incomes {
  id: number;
  title: string;
  category_id: number;
  amount: number;
  deposit_method: string;
  notes: string;
  date: string;
}

export interface PaymentVoucher {
  id: number;
  reference_num: string;
  date: string;
  description: string;
  transaction_type: "income" | "expense";
  source: string;
  amount: number;
  payment_method: string;
  created_by_name: string;
}

interface PaginationMeta {
  current_page: number;
  from: number | null;
  to: number | null;
  per_page: number;
  total: number;
  last_page: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

interface FinanceState {
  expenseCategories: {
    data: ExpenseCategory[];
    meta: PaginationMeta;
  };
  expenses: {
    data: Expense[];
    meta: PaginationMeta;
    summary?: {
      system_currency: string;
    };
  };
  incomeCategories: {
    data: IncomeCategory[];
    meta: PaginationMeta;
  };
  incomes: {
    data: Incomes[];
    meta: PaginationMeta;
    summary?: {
      system_currency: string;
    };
  };
  createBanks: any;
  getBanks: any;
  paymentVouchers: {
    data: PaymentVoucher[];
    meta: PaginationMeta;
    summary?: {
      system_currency: string;
      total_income: number;
      total_expense: number;
      final_balance: number;
    };
  };

  paramsForThunk: Record<string, any>;
  loadings: Record<string, boolean>;
  errors: Record<string, boolean>;
  errorMessages: Record<string, string>;
  errorCodes: Record<string, number>;
}

const initialState: FinanceState = {
  expenseCategories: {
    data: [],
    meta: {
      current_page: 1,
      from: null,
      to: null,
      per_page: 10,
      total: 0,
      last_page: 1,
      next_page_url: null,
      prev_page_url: null,
    },
  },
  expenses: {
    data: [],
    meta: {
      current_page: 1,
      from: null,
      to: null,
      per_page: 10,
      total: 0,
      last_page: 1,
      next_page_url: null,
      prev_page_url: null,
    },
  },
  incomeCategories: {
    data: [],
    meta: {
      current_page: 1,
      from: null,
      to: null,
      per_page: 10,
      total: 0,
      last_page: 1,
      next_page_url: null,
      prev_page_url: null,
    },
  },
  incomes: {
    data: [],
    meta: {
      current_page: 1,
      from: null,
      to: null,
      per_page: 10,
      total: 0,
      last_page: 1,
      next_page_url: null,
      prev_page_url: null,
    },
  },
  paymentVouchers: {
    data: [],
    meta: {
      current_page: 1,
      from: null,
      to: null,
      per_page: 10,
      total: 0,
      last_page: 1,
      next_page_url: null,
      prev_page_url: null,
    },
  },
  getBanks: [],
  createBanks: [],
  paramsForThunk: {},
  loadings: {
    getExpenseCategories: true,
    createOrUpdateExpenseCategory: false,
    deleteExpenseCategory: false,
    getExpenses: true,
    createOrUpdateExpense: false,
    deleteExpense: false,
    getIncomeCategories: true,
    createOrUpdateIncomeCategory: false,
    deleteIncomeCategory: false,
    getIncomes: true,
    createOrUpdateIncome: false,
    deleteIncome: false,
    getPaymentVouchers: true,
    getBanks: true,
    createBanks: true,
  },
  errors: {},
  errorMessages: {},
  errorCodes: {},
};

// === THUNKS (unchanged) ===
export const getExpenseCategoriesAsyncThunk = createAsyncThunk(
  "finance/getExpenseCategories",
  catchAsync(async (params?: any) => {
    const response = await ApiRequests.getExpenseCategory(params);
    return response?.data?.data;
  })
);

export const createOrUpdateExpenseCategoryAsyncThunk = createAsyncThunk(
  "finance/createOrUpdateExpenseCategory",
  catchAsync(async (payload: any) => {
    const response = await ApiRequests.createOrUpdateExpenseCategory(payload);
    toast({
      title: payload.id
        ? "Category updated successfully"
        : "Category created successfully",
    });
    return response?.data?.data;
  })
);

export const deleteExpenseCategoryAsyncThunk = createAsyncThunk(
  "finance/deleteExpenseCategory",
  catchAsync(async ({ id }: { id: number }) => {
    await ApiRequests.deleteExpenseCategory(id);
    return id;
  })
);

export const getExpensesAsyncThunk = createAsyncThunk(
  "finance/getExpenses",
  catchAsync(async (params?: any) => {
    const response = await ApiRequests.getExpense(params);
    console.log("getExpensesAsyncThunk response", response);
    return response?.data?.data;
  })
);

export const createOrUpdateExpenseAsyncThunk = createAsyncThunk(
  "finance/createOrUpdateExpense",
  catchAsync(async (payload: any) => {
    const response = await ApiRequests.createOrUpdateExpense(payload);
    toast({
      title: payload.id
        ? "Expense updated successfully"
        : "Expense created successfully",
    });
    return response?.data?.data;
  })
);

export const deleteExpenseAsyncThunk = createAsyncThunk(
  "finance/deleteExpense",
  catchAsync(async ({ id }: { id: number }) => {
    await ApiRequests.deleteExpense(id);
    return id;
  })
);

export const getIncomeCategoriesAsyncThunk = createAsyncThunk(
  "finance/getIncomeCategories",
  catchAsync(async (params?: any) => {
    const response = await ApiRequests.getIncomeCategory(params);
    return response?.data?.data;
  })
);

export const createOrUpdateIncomeCategoryAsyncThunk = createAsyncThunk(
  "finance/createOrUpdateIncomeCategory",
  catchAsync(async (payload: any) => {
    const response = await ApiRequests.createOrUpdateIncomeCategory(payload);
    toast({
      title: payload.id
        ? "Category updated successfully"
        : "Category created successfully",
    });
    return response?.data?.data;
  })
);

export const deleteIncomeCategoryAsyncThunk = createAsyncThunk(
  "finance/deleteIncomeCategory",
  catchAsync(async ({ id }: { id: number }) => {
    await ApiRequests.deleteIncomeCategory(id);
    return id;
  })
);

export const getIncomesAsyncThunk = createAsyncThunk(
  "finance/getIncomes",
  catchAsync(async (params?: any) => {
    const response = await ApiRequests.getIncomes(params);
    // console.log("getIncomesAsyncThunk response", response);
    return response?.data?.data;
  })
);

export const createOrUpdateIncomeAsyncThunk = createAsyncThunk(
  "finance/createOrUpdateIncome",
  catchAsync(async (payload: any) => {
    const response = await ApiRequests.createOrUpdateIncome(payload);
    toast({
      title: payload.id
        ? "Income updated successfully"
        : "Income created successfully",
    });
    return response?.data?.data;
  })
);

export const deleteIncomeAsyncThunk = createAsyncThunk(
  "finance/deleteIncome",
  catchAsync(async ({ id }: { id: number }) => {
    await ApiRequests.deleteIncome(id);
    return id;
  })
);

export const getPaymentVouchersAsyncThunk = createAsyncThunk(
  "finance/getPaymentVouchers",
  catchAsync(async (params?: any) => {
    const response = await ApiRequests.getPaymentVoucher(params);
    // console.log("getPaymentVouchersAsyncThunk response", response);
    return response?.data?.data;
  })
);
export const createBankAsyncThunk = createAsyncThunk(
  "bank/createBank",
  catchAsync(async ({ data }: { data: FormData }) => {
    const response = await ApiRequests.createBank(data);
    // toast({ title: data.get("id") ? "Plan updated" : "Plan created" });
    return response?.data;
  })
);
export const getBanksAsyncThunk = createAsyncThunk(
  "bank/getBanks",
  catchAsync(async ({ params }) => {
    // console.log("getBanksAsyncThunk params", params);
    const response = await ApiRequests.getBanks(params);
    // console.log("response",response)
    return response?.data?.data;
  })
);

const financeSlice = createSlice({
  name: "finance",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // === EXPENSE CATEGORIES ===
      .addCase(getExpenseCategoriesAsyncThunk.pending, (state) => {
        state.loadings.getExpenseCategories = true;
        state.errors.getExpenseCategories = false;
      })
      .addCase(getExpenseCategoriesAsyncThunk.fulfilled, (state, action) => {
        state.loadings.getExpenseCategories = false;
        const payload = action.payload;
        const categories = Array.isArray(payload)
          ? payload
          : payload?.data || [];
        state.expenseCategories.data = categories;
        state.expenseCategories.meta = {
          current_page: payload?.current_page || 1,
          from: payload?.from || null,
          to: payload?.to || null,
          per_page: payload?.per_page || categories.length,
          total: payload?.total || categories.length,
          last_page: payload?.last_page || 1,
          next_page_url: payload?.next_page_url || null,
          prev_page_url: payload?.prev_page_url || null,
        };
      })
      .addCase(getExpenseCategoriesAsyncThunk.rejected, (state) => {
        state.loadings.getExpenseCategories = false;
        state.errors.getExpenseCategories = true;
      })

      .addCase(createOrUpdateExpenseCategoryAsyncThunk.pending, (state) => {
        state.loadings.createOrUpdateExpenseCategory = true;
      })
      .addCase(
        createOrUpdateExpenseCategoryAsyncThunk.fulfilled,
        (state, action) => {
          state.loadings.createOrUpdateExpenseCategory = false;
          const cat = action.payload;
          const index = state.expenseCategories.data.findIndex(
            (c) => c.id === cat.id
          );
          if (index >= 0) {
            state.expenseCategories.data[index] = cat;
          } else {
            state.expenseCategories.data.unshift(cat);
            state.expenseCategories.meta.total += 1;
          }
        }
      )
      .addCase(createOrUpdateExpenseCategoryAsyncThunk.rejected, (state) => {
        state.loadings.createOrUpdateExpenseCategory = false;
      })

      .addCase(deleteExpenseCategoryAsyncThunk.pending, (state) => {
        state.loadings.deleteExpenseCategory = true;
      })
      .addCase(deleteExpenseCategoryAsyncThunk.fulfilled, (state, action) => {
        state.loadings.deleteExpenseCategory = false;
        const deletedId = action.payload;
        state.expenseCategories.data = state.expenseCategories.data.filter(
          (c) => c.id !== deletedId
        );
        state.expenseCategories.meta.total -= 1;
      })
      .addCase(deleteExpenseCategoryAsyncThunk.rejected, (state) => {
        state.loadings.deleteExpenseCategory = false;
      })

      // === EXPENSES ===
      .addCase(getExpensesAsyncThunk.pending, (state) => {
        state.loadings.getExpenses = true;
        state.errors.getExpenses = false;
      })
      .addCase(getExpensesAsyncThunk.fulfilled, (state, action) => {
        state.loadings.getExpenses = false;
        const p = action.payload;
        state.expenses.data = p.data || [];
        state.expenses.meta = {
          current_page: p.current_page || 1,
          from: p.from || null,
          to: p.to || null,
          per_page: p.per_page || 10,
          total: p.total || 0,
          last_page: p.last_page || 1,
          next_page_url: p.next_page_url || null,
          prev_page_url: p.prev_page_url || null,
        };
      })
      .addCase(getExpensesAsyncThunk.rejected, (state) => {
        state.loadings.getExpenses = false;
        state.errors.getExpenses = true;
      })

      .addCase(createOrUpdateExpenseAsyncThunk.pending, (state) => {
        state.loadings.createOrUpdateExpense = true;
      })
      .addCase(createOrUpdateExpenseAsyncThunk.fulfilled, (state, action) => {
        state.loadings.createOrUpdateExpense = false;
        const exp = action.payload;
        const index = state.expenses.data.findIndex((e) => e.id === exp.id);
        if (index >= 0) {
          state.expenses.data[index] = exp;
        } else {
          state.expenses.data.unshift(exp);
          state.expenses.meta.total += 1;
        }
      })
      .addCase(createOrUpdateExpenseAsyncThunk.rejected, (state) => {
        state.loadings.createOrUpdateExpense = false;
      })

      .addCase(deleteExpenseAsyncThunk.pending, (state) => {
        state.loadings.deleteExpense = true;
      })
      .addCase(deleteExpenseAsyncThunk.fulfilled, (state, action) => {
        state.loadings.deleteExpense = false;
        const deletedId = action.payload;
        state.expenses.data = state.expenses.data.filter(
          (e) => e.id !== deletedId
        );
        state.expenses.meta.total -= 1;
      })
      .addCase(deleteExpenseAsyncThunk.rejected, (state) => {
        state.loadings.deleteExpense = false;
      })

      // === INCOME CATEGORIES ===
      .addCase(getIncomeCategoriesAsyncThunk.pending, (state) => {
        state.loadings.getIncomeCategories = true;
        state.errors.getIncomeCategories = false;
      })
      .addCase(getIncomeCategoriesAsyncThunk.fulfilled, (state, action) => {
        state.loadings.getIncomeCategories = false;
        const payload = action.payload ?? {};
        const categories = Array.isArray(payload)
          ? payload
          : payload?.data || [];
        state.incomeCategories.data = categories;
        state.incomeCategories.meta = {
          current_page: (payload as any)?.current_page || 1,
          from: (payload as any)?.from || null,
          to: (payload as any)?.to || null,
          per_page: (payload as any)?.per_page || categories.length,
          total: (payload as any)?.total || categories.length,
          last_page: (payload as any)?.last_page || 1,
          next_page_url: (payload as any)?.next_page_url || null,
          prev_page_url: (payload as any)?.prev_page_url || null,
        };
      })
      .addCase(getIncomeCategoriesAsyncThunk.rejected, (state) => {
        state.loadings.getIncomeCategories = false;
        state.errors.getIncomeCategories = true;
      })

      .addCase(createOrUpdateIncomeCategoryAsyncThunk.pending, (state) => {
        state.loadings.createOrUpdateIncomeCategory = true;
      })
      .addCase(
        createOrUpdateIncomeCategoryAsyncThunk.fulfilled,
        (state, action) => {
          state.loadings.createOrUpdateIncomeCategory = false;
          const cat = action.payload;
          const index = state.incomeCategories.data.findIndex(
            (c) => c.id === cat.id
          );
          if (index >= 0) {
            state.incomeCategories.data[index] = cat;
          } else {
            state.incomeCategories.data.unshift(cat);
            state.incomeCategories.meta.total += 1;
          }
        }
      )
      .addCase(createOrUpdateIncomeCategoryAsyncThunk.rejected, (state) => {
        state.loadings.createOrUpdateIncomeCategory = false;
      })

      .addCase(deleteIncomeCategoryAsyncThunk.pending, (state) => {
        state.loadings.deleteIncomeCategory = true;
      })
      .addCase(deleteIncomeCategoryAsyncThunk.fulfilled, (state, action) => {
        state.loadings.deleteIncomeCategory = false;
        const deletedId = action.payload;
        state.incomeCategories.data = state.incomeCategories.data.filter(
          (c) => c.id !== deletedId
        );
        state.incomeCategories.meta.total -= 1;
      })
      .addCase(deleteIncomeCategoryAsyncThunk.rejected, (state) => {
        state.loadings.deleteIncomeCategory = false;
      })

      // === INCOMES ===
      .addCase(getIncomesAsyncThunk.pending, (state) => {
        state.loadings.getIncomes = true;
        state.errors.getIncomes = false;
      })
      .addCase(getIncomesAsyncThunk.fulfilled, (state, action) => {
        state.loadings.getIncomes = false;
        const p = action.payload as {
          data?: Incomes[];
          current_page?: number;
          from?: number | null;
          to?: number | null;
          per_page?: number;
          total?: number;
          last_page?: number;
          next_page_url?: string | null;
          prev_page_url?: string | null;
          system_currency?: string;
          total_income?: number;
          total_expense?: number;
          final_balance?: number;
        };
        state.incomes.data = (p as typeof p).data || [];
        state.incomes.meta = {
          current_page: (p as typeof p).current_page || 1,
          from: (p as typeof p).from || null,
          to: (p as typeof p).to || null,
          per_page: (p as typeof p).per_page || 10,
          total: (p as typeof p).total || 0,
          last_page: (p as typeof p).last_page || 1,
          next_page_url: (p as typeof p).next_page_url || null,
          prev_page_url: (p as typeof p).prev_page_url || null,
        };
        state.incomes.summary = {
          system_currency: (p as typeof p).system_currency,
        };
      })
      .addCase(getIncomesAsyncThunk.rejected, (state) => {
        state.loadings.getIncomes = false;
        state.errors.getIncomes = true;
      })

      .addCase(createOrUpdateIncomeAsyncThunk.pending, (state) => {
        state.loadings.createOrUpdateIncome = true;
      })
      .addCase(createOrUpdateIncomeAsyncThunk.fulfilled, (state, action) => {
        state.loadings.createOrUpdateIncome = false;
        const inc = action.payload;
        const index = state.incomes.data.findIndex((e) => e.id === inc.id);
        if (index >= 0) {
          state.incomes.data[index] = inc;
        } else {
          state.incomes.data.unshift(inc);
          state.incomes.meta.total += 1;
        }
      })
      .addCase(createOrUpdateIncomeAsyncThunk.rejected, (state) => {
        state.loadings.createOrUpdateIncome = false;
      })

      .addCase(deleteIncomeAsyncThunk.pending, (state) => {
        state.loadings.deleteIncome = true;
      })
      .addCase(deleteIncomeAsyncThunk.fulfilled, (state, action) => {
        state.loadings.deleteIncome = false;
        const deletedId = action.payload;
        state.incomes.data = state.incomes.data.filter(
          (e) => e.id !== deletedId
        );
        state.incomes.meta.total -= 1;
      })
      .addCase(deleteIncomeAsyncThunk.rejected, (state) => {
        state.loadings.deleteIncome = false;
      })

      // === PAYMENT VOUCHERS ===
      .addCase(getPaymentVouchersAsyncThunk.fulfilled, (state, action) => {
        state.loadings.getPaymentVouchers = false;
        const payload = action.payload as {
          vouchers?: {
            data?: any[];
            current_page?: number;
            from?: number | null;
            to?: number | null;
            per_page?: number;
            total?: number;
            last_page?: number;
            next_page_url?: string | null;
            prev_page_url?: string | null;
          };
          system_currency?: string;
          total_income?: number;
          total_expense?: number;
          final_balance?: number;
        };

        const rawVouchers = payload.vouchers?.data || [];

        // Map to clean rows with proper amount
        state.paymentVouchers.data = rawVouchers.map((v: any) => ({
          id: v.id,
          reference_num: v.reference_num,
          date: v.date,
          time: v.time,
          description: v.description,
          transaction_type: v.transaction_type,
          source: v.source,
          branch: v.branch,
          amount:
            v.transaction_type === "income" ? v.credit_amount : v.debit_amount,
          payment_method: v.payment_method,
          created_by_name: v.created_by?.name || "Unknown",
        }));

        state.paymentVouchers.meta = {
          current_page: payload.vouchers?.current_page || 1,
          from: payload.vouchers?.from || null,
          to: payload.vouchers?.to || null,
          per_page: payload.vouchers?.per_page || 10,
          total: payload.vouchers?.total || 0,
          last_page: payload.vouchers?.last_page || 1,
          next_page_url: payload.vouchers?.next_page_url || null,
          prev_page_url: payload.vouchers?.prev_page_url || null,
        };

        state.paymentVouchers.summary = {
          system_currency: payload.system_currency,
          total_income: payload.total_income || 0,
          total_expense: payload.total_expense || 0,
          final_balance: payload.final_balance || 0,
        };
      })
      .addCase(getPaymentVouchersAsyncThunk.pending, (state) => {
        state.loadings.getPaymentVouchers = true;
        state.errors.getPaymentVouchers = false;
      })
      .addCase(getPaymentVouchersAsyncThunk.rejected, (state) => {
        state.loadings.getPaymentVouchers = false;
        state.errors.getPaymentVouchers = true;
      })
      .addCase(createBankAsyncThunk.rejected, (state) => {
        state.loadings.createBanks = false;
      })

      .addCase(createBankAsyncThunk.pending, (state) => {
        state.loadings.createBanks = true;
      })
      .addCase(createBankAsyncThunk.fulfilled, (state, action) => {
        state.loadings.createBanks = false;
        // state.createBanks = action.payload;
      })
      .addCase(getBanksAsyncThunk.rejected, (state) => {
        state.loadings.getBanks = false;
      })

      .addCase(getBanksAsyncThunk.pending, (state) => {
        state.loadings.getBanks = true;
      })
      .addCase(getBanksAsyncThunk.fulfilled, (state, action) => {
        state.loadings.getBanks = false;
        console.log("action.payload",action.payload)
        state.getBanks = action.payload;
      })

      // Keep your existing matcher for loading/error params
      .addMatcher(
        isAnyOf(
          ...reduxToolKitCaseBuilder([
            getExpenseCategoriesAsyncThunk,
            createOrUpdateExpenseCategoryAsyncThunk,
            deleteExpenseCategoryAsyncThunk,
            getExpensesAsyncThunk,
            createOrUpdateExpenseAsyncThunk,
            deleteExpenseAsyncThunk,
            getIncomeCategoriesAsyncThunk,
            createOrUpdateIncomeCategoryAsyncThunk,
            deleteIncomeCategoryAsyncThunk,
            getIncomesAsyncThunk,
            createOrUpdateIncomeAsyncThunk,
            deleteIncomeAsyncThunk,
          ])
        ),
        handleLoadingErrorParamsForAsycThunk
      );
  },
});

export default financeSlice.reducer;
