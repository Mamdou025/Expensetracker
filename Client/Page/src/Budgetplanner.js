import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const BudgetPlanner = () => {
    const [expenses, setExpenses] = useState([]);
    const [newExpense, setNewExpense] = useState({
        name: "",
        amount: "",
        color: "#888888"
    });

    // ✅ Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewExpense(prev => ({ ...prev, [name]: value }));
    };

    // ✅ Add new expense
    const addExpense = () => {
        if (!newExpense.name.trim() || !newExpense.amount) return;

        setExpenses(prev => [
            ...prev,
            {
                name: newExpense.name,
                amount: parseFloat(newExpense.amount),
                color: newExpense.color
            }
        ]);

        // Reset input fields
        setNewExpense({ name: "", amount: "", color: "#888888" });
    };

    // ✅ Delete an expense
    const deleteExpense = (index) => {
        setExpenses(prev => prev.filter((_, idx) => idx !== index));
    };

    // ✅ Calculate total spending
    const totalSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    return (
        <div style={{ fontFamily: "Arial, sans-serif", padding: "40px", backgroundColor: "white", color: "black", maxWidth: "900px", margin: "auto" }}>
            <h1 style={{ textAlign: "center", fontSize: "2.2em", marginBottom: "30px" }}>💰 Budget Planner</h1>

            {/* ✅ Add Expense Section */}
            <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
                <input
                    type="text"
                    name="name"
                    placeholder="Expense Name"
                    value={newExpense.name}
                    onChange={handleInputChange}
                    style={{ padding: "8px", width: "150px" }}
                />
                <input
                    type="number"
                    name="amount"
                    placeholder="Amount"
                    value={newExpense.amount}
                    onChange={handleInputChange}
                    style={{ padding: "8px", width: "100px" }}
                />
                <input
                    type="color"
                    name="color"
                    value={newExpense.color}
                    onChange={handleInputChange}
                    style={{ width: "40px", height: "40px", border: "none" }}
                />
                <button onClick={addExpense} style={{ padding: "10px 20px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
                    ➕ Add Expense
                </button>
            </div>

            {/* ✅ Pie Chart for Expense Proportions */}
            {expenses.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                        <Pie
                            data={expenses}
                            dataKey="amount"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={130}
                            label={({ name, amount }) => `${name} ($${amount.toFixed(2)})`}
                        >
                            {expenses.map((exp, index) => (
                                <Cell key={`cell-${index}`} fill={exp.color} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <p style={{ textAlign: "center", marginTop: "20px" }}>No expenses added yet.</p>
            )}

            {/* ✅ Total Spending */}
            <h2 style={{ textAlign: "center", marginTop: "30px" }}>
                Total Budget: ${totalSpending.toFixed(2)}
            </h2>

            {/* ✅ Expense List */}
            <div style={{ marginTop: "30px", border: "1px solid #ddd", padding: "10px", borderRadius: "5px" }}>
                <h3>💸 Expenses List:</h3>
                {expenses.map((exp, index) => (
                    <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <div style={{ width: "15px", height: "15px", backgroundColor: exp.color, marginRight: "10px", borderRadius: "50%" }}></div>
                            <strong>{exp.name}</strong> — ${exp.amount.toFixed(2)}
                        </div>
                        <button onClick={() => deleteExpense(index)} style={{ backgroundColor: "#dc3545", color: "white", border: "none", padding: "5px 10px", borderRadius: "3px", cursor: "pointer" }}>
                            ✖ Delete
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BudgetPlanner;
