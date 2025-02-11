import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const TransactionsPage = () => {
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        fetch("http://localhost:5000/api/transactions")
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to fetch transactions");
                }
                return response.json();
            })
            .then(data => {
                const formattedData = data.map(txn => ({
                    ...txn,
                    amount: parseFloat(txn.amount) // Ensure amount is a number
                }));
                setTransactions(formattedData);
            })
            .catch(error => console.error("Error fetching transactions:", error));
    }, []);

    const aggregateSpendingByCategory = () => {
        const categoryTotals = transactions.reduce((acc, txn) => {
            acc[txn.category] = (acc[txn.category] || 0) + txn.amount;
            return acc;
        }, {});

        const totalSpending = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);

        return Object.keys(categoryTotals).map(category => ({
            name: category,
            value: categoryTotals[category],
            percentage: ((categoryTotals[category] / totalSpending) * 100).toFixed(2) + "%"
        }));
    };

    const aggregateSpendingByDate = () => {
        const dailySpending = transactions.reduce((acc, txn) => {
            if (!acc[txn.date]) {
                acc[txn.date] = {};
            }
            acc[txn.date][txn.category] = (acc[txn.date][txn.category] || 0) + txn.amount;
            return acc;
        }, {});

        return Object.keys(dailySpending).sort().map(date => ({
            date,
            ...dailySpending[date]
        }));
    };

    const aggregateSpendingByMonth = () => {
        const monthlySpending = transactions.reduce((acc, txn) => {
            const month = txn.date.substring(0, 7); // Extract YYYY-MM format
            if (!acc[month]) {
                acc[month] = { total: 0 };
            }
            acc[month].total += txn.amount;
            acc[month][txn.category] = (acc[month][txn.category] || 0) + txn.amount;
            return acc;
        }, {});

        return Object.keys(monthlySpending).sort().map(month => ({
            month,
            ...monthlySpending[month]
        }));
    };

    const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1", "#d884d8"];
    const categories = [...new Set(transactions.map(txn => txn.category))];

    return (
        <div style={{ fontFamily: "Arial, sans-serif", padding: "40px", backgroundColor: "white", color: "black", maxWidth: "900px", margin: "auto" }}>
            <h1 style={{ textAlign: "center", fontSize: "2.2em", marginBottom: "30px" }}>Transaction List</h1>
            <div style={{ overflowY: "auto", maxHeight: "300px", marginBottom: "50px", border: "1px solid #ddd", padding: "10px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f4f4f4" }}>
                            <th>ID</th>
                            <th>Amount</th>
                            <th>Description</th>
                            
                            <th>Date</th>
                            <th>Time</th>
                            <th>Bank</th>
                            <th>Category</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((txn, index) => (
                            <tr key={index}>
                                <td>{txn.id}</td>
                                <td>${txn.amount.toFixed(2)}</td>
                                <td>{txn.description}</td>
                                
                                <td>{txn.date}</td>
                                <td>{txn.time}</td>
                                <td>{txn.bank}</td>
                                <td>{txn.category || "Uncategorized"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <h2 style={{ textAlign: "center", fontSize: "1.9em", marginBottom: "30px" }}>Spending by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={aggregateSpendingByCategory()}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percentage }) => `${name} (${percentage})`}
                    >
                        {aggregateSpendingByCategory().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
            <h2 style={{ textAlign: "center", fontSize: "1.9em", marginTop: "50px", marginBottom: "30px" }}>Daily Spending by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={aggregateSpendingByDate()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {categories.map((category, index) => (
                        <Bar key={category} dataKey={category} fill={colors[index % colors.length]} />
                    ))}
                </BarChart>
            </ResponsiveContainer>
            <h2 style={{ textAlign: "center", fontSize: "1.9em", marginTop: "50px", marginBottom: "30px" }}>Monthly Spending Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={aggregateSpendingByMonth()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {categories.map((category, index) => (
                        <Bar key={category} dataKey={category} stackId="a" fill={colors[index % colors.length]} />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TransactionsPage;
