import React, { useState } from "react";

import ExpenseForm from "./ExpenseForm";
import "./NewExpense.css";

const NewExpense = (props) => {
  const [showForm, setShowForm] = useState(false);

  const saveExpenseDataHandler = (enteredExpenseData) => {
    const expenseData = {
      ...enteredExpenseData,
      id: Math.random().toString(),
    };

    props.onAddExpense(expenseData);
    setShowForm(false);
  };

  const buttonClickHandler = () => {
    setShowForm(true);
  }

  const cancelHandler = () => {
    setShowForm(false);
  }

  return (
    <div className="new-expense">
  {!showForm && <button onClick={buttonClickHandler}>Add New Expense</button>}
      {showForm && <ExpenseForm
        onSaveExpenseData={saveExpenseDataHandler}
        onCancel={cancelHandler}
      />}
    </div>
  );
};

export default NewExpense;
