import * as React from "react";
import { Ingredient, Recipe, Employee, Transaction, Expense, Unit, RecipeItem, ShiftType, Attendance } from "../types";
import { CATEGORIES } from "../constants";
import { supabase } from "../lib/supabase";

// Fixed tenant ID for this resto (no auth required)
const TENANT_ID = 'e57a0505-1234-5678-90ab-c0de57f17ac1';

// Helper: convert Employee camelCase to Supabase snake_case
const employeeToRow = (emp: Employee) => ({
  id: emp.id,
  name: emp.name,
  role: emp.role,
  salary: emp.salary,
  avatar_color: emp.avatarColor,
  initials: emp.initials,
  user_id: TENANT_ID,
});

// Helper: convert Supabase snake_case row to Employee camelCase
const rowToEmployee = (row: any): Employee => ({
  id: row.id,
  name: row.name,
  role: row.role,
  salary: Number(row.salary),
  avatarColor: row.avatar_color || undefined,
  initials: row.initials || undefined,
});

// --- NEW MAPPING HELPERS ---

const ingredientToRow = (ing: Ingredient) => ({
  id: ing.id,
  name: ing.name,
  category: ing.category,
  purchase_price: ing.purchasePrice,
  purchase_unit: ing.purchaseUnit,
  use_unit: ing.useUnit,
  conversion_value: ing.conversionValue,
  stock_quantity: ing.stockQuantity,
  low_stock_threshold: ing.lowStockThreshold,
  user_id: TENANT_ID,
});

const rowToIngredient = (row: any): Ingredient => ({
  id: row.id,
  name: row.name,
  category: row.category,
  purchasePrice: Number(row.purchase_price),
  purchaseUnit: row.purchase_unit,
  useUnit: row.use_unit,
  conversionValue: Number(row.conversion_value),
  stockQuantity: Number(row.stock_quantity),
  lowStockThreshold: Number(row.low_stock_threshold),
});

const recipeToRow = (rec: Recipe) => ({
  id: rec.id,
  name: rec.name,
  selling_price: rec.sellingPrice,
  markup_percent: rec.markupPercent,
  labor_cost: rec.laborCost,
  overhead_cost: rec.overheadCost,
  shrinkage_percent: rec.shrinkagePercent,
  user_id: TENANT_ID,
});

const rowToRecipe = (row: any, items: RecipeItem[] = []): Recipe => ({
  id: row.id,
  name: row.name,
  category: row.category || 'Makanan',
  sellingPrice: Number(row.selling_price),
  markupPercent: Number(row.markup_percent),
  laborCost: Number(row.labor_cost),
  overheadCost: Number(row.overhead_cost),
  shrinkagePercent: Number(row.shrinkage_percent),
  items,
});

const transactionToRows = (trans: Transaction) => {
  return trans.items.map((item, index) => ({
    id: `${trans.id}-${index}`, // Fixed ID to prevent duplicates on upsert
    created_at: trans.date,
    recipe_id: item.recipeId,
    quantity: item.quantity,
    total_price: item.price * item.quantity,
    total_hpp: (trans.totalHpp / trans.items.length), // Approximate split if not individually calculated
    user_id: TENANT_ID,
  }));
};

const attendanceToRow = (att: Attendance) => ({
  id: att.id,
  employee_id: att.employeeId,
  date: att.date,
  status: att.status,
  user_id: TENANT_ID,
});

const rowToAttendance = (row: any): Attendance => ({
  id: row.id,
  employeeId: row.employee_id,
  date: row.date,
  status: row.status,
});

const expenseToRow = (exp: Expense) => ({
  id: exp.id,
  date: exp.date,
  description: exp.description,
  amount: exp.amount,
  category: exp.category,
  user_id: TENANT_ID,
});

const rowToExpense = (row: any): Expense => ({
  id: row.id,
  date: row.date,
  description: row.description,
  amount: Number(row.amount),
  category: row.category as any,
});

export function useAppState() {
  const [ingredients, setIngredients] = React.useState<Ingredient[]>([]);
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [attendances, setAttendances] = React.useState<Attendance[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [pettyCash, setPettyCash] = React.useState<number>(0);
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem("resto-theme");
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e) { return 'light'; }
  });
  const [shifts, setShifts] = React.useState<Record<string, Record<string, ShiftType>>>(() => {
    try {
      const saved = localStorage.getItem("resto-shift-data");
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });
  const [weeklyPattern, setWeeklyPattern] = React.useState<Record<string, ShiftType[]>>(() => {
    try {
      const saved = localStorage.getItem("resto-shift-pattern");
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);

  // No auth required - using fixed TENANT_ID for Supabase access

  // Load data from Supabase or localStorage
  React.useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      let supabaseLoaded = false;
      try {
        {
          // Fetch from Supabase with a timeout
          const fetchData = async () => {
            try {
              const { data: ingData } = await supabase.from('ingredients').select('*');
              const { data: recData } = await supabase.from('recipes').select('*');
              const { data: recItemsData } = await supabase.from('recipe_items').select('*');
              const { data: empData } = await supabase.from('employees').select('*');
              const { data: transData } = await supabase.from('transactions').select('*');
              const { data: attData } = await supabase.from('attendances').select('*');
              const { data: expData } = await supabase.from('expenses').select('*').order('date', { ascending: false });
              const { data: configData } = await supabase.from('app_config').select('*');
              
              // Fetch shifts and patterns
              const { data: shiftData } = await supabase.from('shifts').select('*');
              const { data: patternData } = await supabase.from('shift_patterns').select('*');

              if (mounted) {
                if (ingData) { 
                  setIngredients(ingData.map(rowToIngredient)); 
                  supabaseLoaded = true; 
                }
                
                if (recData) {
                  const reconstructedRecipes = recData.map(row => {
                    const items = (recItemsData || [])
                      .filter(ri => ri.recipe_id === row.id)
                      .map(ri => ({
                        id: ri.id,
                        ingredientId: ri.ingredient_id,
                        quantityNeeded: Number(ri.quantity_needed)
                      }));
                    return rowToRecipe(row, items);
                  });
                  setRecipes(reconstructedRecipes);
                }

                if (empData) {
                  setEmployees(empData.map(rowToEmployee));
                  supabaseLoaded = true;
                }
                
                if (transData) {
                  // Transactions are simple list for now, we don't group them back into multi-item carts
                  // as they are already flattened in the DB
                  const mappedTrans: Transaction[] = transData.map(row => ({
                    id: row.id,
                    date: row.created_at,
                    totalPrice: Number(row.total_price),
                    totalHpp: Number(row.total_hpp),
                    paymentMethod: 'Tunai', // Default as it's not in DB
                    items: [{
                      recipeId: row.recipe_id,
                      name: "Item", // We'd need a join to get the name
                      quantity: row.quantity,
                      price: Number(row.total_price) / row.quantity
                    }]
                  }));
                  setTransactions(mappedTrans);
                }

                if (attData) setAttendances(attData.map(rowToAttendance));
                
                if (shiftData) {
                  const formattedShifts: Record<string, Record<string, ShiftType>> = {};
                  shiftData.forEach(s => {
                    if (!formattedShifts[s.employee_id]) formattedShifts[s.employee_id] = {};
                    formattedShifts[s.employee_id][s.date] = s.shift_type as ShiftType;
                  });
                  setShifts(formattedShifts);
                }
                if (patternData) {
                  const formattedPatterns: Record<string, ShiftType[]> = {};
                  patternData.forEach(p => {
                    formattedPatterns[p.employee_id] = p.pattern as ShiftType[];
                  });
                  setWeeklyPattern(formattedPatterns);
                }

                if (expData) {
                  setExpenses(expData.map(rowToExpense));
                }

                if (configData) {
                  const pc = configData.find(c => c.id === 'petty_cash');
                  if (pc) setPettyCash(Number(pc.value));
                }
              }
            } catch (err) {
              console.error("Supabase fetch exception:", err);
            }
          };

          // Race between fetch and a 5s timeout
          await Promise.race([
            fetchData(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
          ]).catch(err => {
            console.warn("Supabase fetch failed or timed out, using local state if any:", err);
          });
        }
        
        // Only load from localStorage if Supabase didn't provide data
        if (!supabaseLoaded) {
          try {
            const savedIngredients = localStorage.getItem("resto_ingredients");
            const savedRecipes = localStorage.getItem("resto_recipes");
            const savedEmployees = localStorage.getItem("resto_employees");
            const savedTransactions = localStorage.getItem("resto_transactions");
            const savedAttendances = localStorage.getItem("resto_attendances");
            const savedExpenses = localStorage.getItem("resto_expenses");
            const savedPettyCash = localStorage.getItem("resto_petty_cash");
    
            if (mounted) {
              if (savedIngredients) setIngredients(JSON.parse(savedIngredients));
              if (savedRecipes) setRecipes(JSON.parse(savedRecipes));
              if (savedEmployees) setEmployees(JSON.parse(savedEmployees));
              if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
              if (savedAttendances) setAttendances(JSON.parse(savedAttendances));
              if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
              if (savedPettyCash) setPettyCash(Number(savedPettyCash));
            }
          } catch (e) {
            console.error("LocalStorage parse error:", e);
          }
        } else {
          // Still load expenses and petty cash from localStorage (not in Supabase)
          try {
            const savedExpenses = localStorage.getItem("resto_expenses");
            const savedPettyCash = localStorage.getItem("resto_petty_cash");
            if (mounted) {
              if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
              if (savedPettyCash) setPettyCash(Number(savedPettyCash));
            }
          } catch (e) {
            console.error("LocalStorage parse error:", e);
          }
        }
      } catch (error) {
        console.error("Error in loadData sequence:", error);
      } finally {
        if (mounted) {
          console.log("Setting isLoaded to true");
          setIsLoaded(true);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // Save data to localStorage & Supabase
  React.useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("resto_ingredients", JSON.stringify(ingredients));
    
    const syncIngredients = async () => {
      if (ingredients.length > 0) {
        setIsSyncing(true);
        const ingredientsRows = ingredients.map(ingredientToRow);
        const { error } = await supabase.from('ingredients').upsert(ingredientsRows);
        if (error) console.error('Ingredient sync error:', error);
        setIsSyncing(false);
      }
    };
    syncIngredients();
  }, [ingredients, isLoaded]);

  React.useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("resto_recipes", JSON.stringify(recipes));

    const syncRecipes = async () => {
      if (recipes.length > 0) {
        setIsSyncing(true);
        try {
          // 1. Sync metadata
          const recipesRows = recipes.map(recipeToRow);
          const { error: recErr } = await supabase.from('recipes').upsert(recipesRows);
          if (recErr) throw recErr;

          // 2. Sync items (BOM)
          const recipeItemsRows: any[] = [];
          recipes.forEach(rec => {
            rec.items.forEach(item => {
              recipeItemsRows.push({
                recipe_id: rec.id,
                ingredient_id: item.ingredientId,
                quantity_needed: item.quantityNeeded,
                user_id: TENANT_ID
              });
            });
          });

          // Delete old items first to handle removals
          // (In a more robust system, we would use a more precise delete or separate IDs)
          const recipeIds = recipes.map(r => r.id);
          await supabase.from('recipe_items').delete().in('recipe_id', recipeIds);
          
          if (recipeItemsRows.length > 0) {
            const { error: itemsErr } = await supabase.from('recipe_items').insert(recipeItemsRows);
            if (itemsErr) throw itemsErr;
          }
        } catch (error) {
          console.error('Recipe/Items sync error:', error);
        } finally {
          setIsSyncing(false);
        }
      }
    };
    syncRecipes();
  }, [recipes, isLoaded]);

  // Track previous employee IDs for delete detection
  const prevEmployeeIdsRef = React.useRef<string[]>([]);

  React.useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("resto_employees", JSON.stringify(employees));

    const syncEmployees = async () => {
      setIsSyncing(true);
      
      const currentIds = employees.map(e => e.id);
      const deletedIds = prevEmployeeIdsRef.current.filter(id => !currentIds.includes(id));
      
      if (deletedIds.length > 0) {
        const { error: delErr } = await supabase.from('employees').delete().in('id', deletedIds);
        if (delErr) console.warn('Failed to delete removed employees from Supabase:', delErr);
      }
      
      if (employees.length > 0) {
        const employeesForDb = employees.map(emp => employeeToRow(emp));
        const { error } = await supabase.from('employees').upsert(employeesForDb);
        if (error) {
          console.error('❌ Employee Sync Failed:', error.message, error.details, error.hint);
          // If foreign key error, it likely means the TENANT_ID doesn't exist in auth.users
          if (error.code === '23503') {
            console.error('HINT: TENANT_ID likely missing from auth.users. Ensure schema uses UUID without FK for demo mode.');
          }
        } else {
          console.log('✅ Employees synced to Supabase:', employees.length);
        }
      }
      
      prevEmployeeIdsRef.current = currentIds;
      setIsSyncing(false);
    };
    syncEmployees();
  }, [employees, isLoaded]);

  React.useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("resto_transactions", JSON.stringify(transactions));

    const syncTransactions = async () => {
      if (transactions.length > 0) {
        setIsSyncing(true);
        // We only sync the most recent transaction to avoid re-upserting everything 
        // as our simple single-recipe table doesn't have an external mapping back to our UUID carts
        // But for this ERP fix, we will just upsert everything and assume ID collisions handle it
        const transactionRows = transactions.flatMap(transactionToRows);
        const { error } = await supabase.from('transactions').upsert(transactionRows);
        if (error) console.error('Transaction sync error:', error);
        setIsSyncing(false);
      }
    };
    syncTransactions();
  }, [transactions, isLoaded]);

  React.useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("resto_attendances", JSON.stringify(attendances));

    const syncAttendances = async () => {
      if (attendances.length > 0) {
        setIsSyncing(true);
        const attendancesRows = attendances.map(attendanceToRow);
        const { error } = await supabase.from('attendances').upsert(attendancesRows);
        if (error) console.error('Attendance sync error:', error);
        setIsSyncing(false);
      }
    };
    syncAttendances();
  }, [attendances, isLoaded]);

  React.useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("resto_expenses", JSON.stringify(expenses));

    const syncExpenses = async () => {
      if (expenses.length > 0) {
        setIsSyncing(true);
        const expenseRows = expenses.map(expenseToRow);
        const { error } = await supabase.from('expenses').upsert(expenseRows);
        if (error) console.error('Expense sync error:', error);
        setIsSyncing(false);
      }
    };
    syncExpenses();
  }, [expenses, isLoaded]);

  React.useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("resto_petty_cash", pettyCash.toString());

    const syncPettyCash = async () => {
      setIsSyncing(true);
      const { error } = await supabase.from('app_config').upsert({
        id: 'petty_cash',
        value: pettyCash,
        user_id: TENANT_ID,
        updated_at: new Date().toISOString()
      });
      if (error) console.error('Petty cash sync error:', error);
      setIsSyncing(false);
    };
    syncPettyCash();
  }, [pettyCash, isLoaded]);

  // Sync Shifts to Supabase
  React.useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("resto-shift-data", JSON.stringify(shifts));

    const syncShifts = async () => {
      if (Object.keys(shifts).length > 0) {
        setIsSyncing(true);
        const shiftList: any[] = [];
        Object.entries(shifts).forEach(([employee_id, days]) => {
          Object.entries(days).forEach(([date, shift_type]) => {
            shiftList.push({
              employee_id,
              date,
              shift_type,
              user_id: TENANT_ID
            });
          });
        });
        
        if (shiftList.length > 0) {
          await supabase.from('shifts').upsert(shiftList, { onConflict: 'employee_id,date' });
        }
        setIsSyncing(false);
      }
    };
    syncShifts();
  }, [shifts, isLoaded]);

  // Sync Patterns to Supabase
  React.useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("resto-shift-pattern", JSON.stringify(weeklyPattern));

    const syncPatterns = async () => {
      if (Object.keys(weeklyPattern).length > 0) {
        setIsSyncing(true);
        const patternList = Object.entries(weeklyPattern).map(([employee_id, pattern]) => ({
          employee_id,
          pattern,
          user_id: TENANT_ID
        }));
        await supabase.from('shift_patterns').upsert(patternList, { onConflict: 'employee_id' });
        setIsSyncing(false);
      }
    };
    syncPatterns();
  }, [weeklyPattern, isLoaded]);

  // Handle Theme Application
  React.useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem("resto-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const deleteIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  const deleteEmployee = async (id: string) => {
    // Delete from Supabase
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) console.error('Failed to delete employee from Supabase:', error);
    setEmployees(employees.filter(emp => emp.id !== id));
  };

  const handleBackup = () => {
    const data = {
      ingredients,
      recipes,
      employees,
      transactions,
      expenses,
      pettyCash
    };
    const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `restocost_backup_${new Date().toISOString()}.json`;
    a.click();
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setIngredients(data.ingredients);
        setRecipes(data.recipes);
        setEmployees(data.employees);
        setTransactions(data.transactions);
        setExpenses(data.expenses);
        setPettyCash(data.pettyCash);
        alert("Data berhasil dipulihkan!");
      } catch (err) {
        alert("Gagal memulihkan data. Pastikan file backup valid.");
      }
    };
    reader.readAsText(file);
  };

  const handleAddIngredient = (newIngredient: Partial<Ingredient>, setIsAddingIngredient: (val: boolean) => void, setNewIngredient: (val: Partial<Ingredient>) => void) => {
    if (!newIngredient.name) {
      alert("Nama bahan baku wajib diisi!");
      return;
    }
    if ((newIngredient.purchasePrice || 0) <= 0) {
      alert("Harga beli harus lebih besar dari 0!");
      return;
    }
    if ((newIngredient.conversionValue || 0) <= 0) {
      alert("Nilai konversi harus lebih besar dari 0!");
      return;
    }
    
    if (ingredients.some(i => i.name.toLowerCase() === newIngredient.name?.toLowerCase())) {
      alert("Bahan baku dengan nama tersebut sudah ada!");
      return;
    }
    
    const toTitleCase = (str: string) => {
      return str.replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
    };

    const ingredient: Ingredient = {
      ...newIngredient as Ingredient,
      name: toTitleCase(newIngredient.name || ""),
      id: crypto.randomUUID(),
    };
    
    setIngredients([...ingredients, ingredient]);
    setIsAddingIngredient(false);
    setNewIngredient({
      name: "",
      category: CATEGORIES[0],
      purchasePrice: 0,
      purchaseUnit: "kg",
      useUnit: "gr",
      conversionValue: 1000,
      stockQuantity: 0,
      lowStockThreshold: 0
    });
  };

  const handleAddExpense = (
    newExpense: Partial<Expense>,
    setIsAddingExpense: (val: boolean) => void,
    setNewExpense: (val: Partial<Expense>) => void
  ) => {
    if (!newExpense.description || !newExpense.amount) return;
    
    if (newExpense.amount > pettyCash) {
      alert("Saldo Petty Cash tidak mencukupi untuk pengeluaran ini!");
      return;
    }

    const expense: Expense = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      description: newExpense.description,
      amount: newExpense.amount,
      category: newExpense.category as any
    };
    setExpenses([expense, ...expenses]);
    setPettyCash(prev => prev - expense.amount);
    setIsAddingExpense(false);
    setNewExpense({ description: "", amount: 0, category: 'Operasional' });
  };

  const handleSaveEmployee = (
    newEmployee: Partial<Employee>,
    editingEmployeeId: string | null,
    setEditingEmployeeId: (val: string | null) => void,
    setIsAddingEmployee: (val: boolean) => void,
    setNewEmployee: (val: Partial<Employee>) => void
  ) => {
    if (!newEmployee.name) return;
    
    if (editingEmployeeId) {
      setEmployees(employees.map(emp => 
        emp.id === editingEmployeeId ? { ...emp, ...newEmployee as Employee } : emp
      ));
      setEditingEmployeeId(null);
    } else {
      const employee: Employee = {
        ...newEmployee as Employee,
        id: crypto.randomUUID(),
      };
      setEmployees([...employees, employee]);
    }
    setIsAddingEmployee(false);
    setNewEmployee({ name: "", role: "", salary: 0 });
  };

  const handleProcessTransaction = (transaction: Transaction) => {
    // 1. Deduct Stock
    const updatedIngredients = [...ingredients];
    let totalTransactionHpp = 0;

    transaction.items.forEach(item => {
      const recipe = recipes.find(r => r.id === item.recipeId);
      if (!recipe) return;

      recipe.items.forEach(recipeItem => {
        const ingredientIndex = updatedIngredients.findIndex(i => i.id === recipeItem.ingredientId);
        if (ingredientIndex !== -1) {
          const ing = updatedIngredients[ingredientIndex];
          const amountToDeduct = recipeItem.quantityNeeded * item.quantity;
          
          // Calculate HPP contribution
          const unitPrice = ing.purchasePrice / (ing.conversionValue || 1);
          totalTransactionHpp += amountToDeduct * unitPrice;

          // Update stock
          updatedIngredients[ingredientIndex] = {
            ...ing,
            stockQuantity: Number((ing.stockQuantity - amountToDeduct).toFixed(2))
          };
        }
      });
    });

    // 2. Add Transaction
    const finalTransaction: Transaction = {
      ...transaction,
      totalHpp: totalTransactionHpp,
      date: new Date().toISOString()
    };

    setIngredients(updatedIngredients);
    setTransactions([finalTransaction, ...transactions]);
    
    // Explicit sync for immediate stock reduction
    const syncStock = async () => {
      const rows = updatedIngredients.map(ingredientToRow);
      await supabase.from('ingredients').upsert(rows);
    };
    syncStock();

    return finalTransaction;
  };

  const toggleAttendance = (employeeId: string, date: string, status: Attendance['status']) => {
    const existingIndex = attendances.findIndex(a => a.employeeId === employeeId && a.date === date);
    
    if (existingIndex !== -1) {
      if (attendances[existingIndex].status === status) {
        // Toggle off: remove record
        setAttendances(attendances.filter((_, i) => i !== existingIndex));
      } else {
        // Change status
        const updated = [...attendances];
        updated[existingIndex] = { ...updated[existingIndex], status };
        setAttendances(updated);
      }
    } else {
      // New record
      const newAttendance: Attendance = {
        id: crypto.randomUUID(),
        employeeId,
        date,
        status
      };
      setAttendances([...attendances, newAttendance]);
    }
  };

  React.useEffect(() => {
    console.log("isLoaded changed to:", isLoaded);
  }, [isLoaded]);

  const syncAll = async () => {
    setIsSyncing(true);
    try {
      // Manual trigger for all sync operations
      await Promise.all([
        syncIngredients(),
        syncRecipes(),
        syncEmployees(),
        syncTransactions(),
        syncAttendances(),
        syncExpenses(),
        syncPettyCash(),
        syncShifts(),
        syncPatterns()
      ]);
      console.log('✅ All data synced to Supabase manually');
    } catch (error) {
      console.error('❌ Manual Sync Failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    ingredients,
    setIngredients,
    recipes,
    setRecipes,
    employees,
    setEmployees,
    transactions,
    setTransactions,
    expenses,
    setExpenses,
    pettyCash,
    setPettyCash,
    isLoaded,
    isSyncing,
    syncAll,
    deleteIngredient,
    deleteEmployee,
    handleBackup,
    handleRestore,
    handleAddIngredient,
    handleAddExpense,
    handleSaveEmployee,
    handleProcessTransaction,
    shifts,
    setShifts,
    weeklyPattern,
    setWeeklyPattern,
    attendances,
    setAttendances,
    toggleAttendance,
    theme,
    toggleTheme
  };
}
