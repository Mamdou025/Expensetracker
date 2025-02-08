import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const TransactionsPage = () => {
    const [transactions, setTransactions] = useState([
        { date: "2024-02-01", payee: "Maxi Supercentre ", amount: 45.67, category: "Food" },
        { date: "2024-02-02", payee: "Electric Company", amount: 120.50, category: "Utilities" },
        { date: "2024-02-03", payee: "Restaurant", amount: 30.5, category: "Dining" },
        { date: "2024-02-04", payee: "Gas Station", amount: 50.00, category: "Transport" },
        { date: "2024-02-05", payee: "Bookstore", amount: 25.00, category: "Education" },
        { date: "2024-02-06", payee: "Gym Membership", amount: 60.00, category: "Health" },
        { date: "2024-02-07", payee: "Supermarket", amount: 78.99, category: "Food" },
        { date: "2024-02-08", payee: "Water Bill", amount: 40.00, category: "Utilities" },
        { date: "2024-02-09", payee: "Cafe", amount: 15.00, category: "Dining" },
        { date: "2024-02-10", payee: "Taxi", amount: 22.50, category: "Transport" },
        { date: "2024-02-11", payee: "Online Course", amount: 100.00, category: "Education" },
        { date: "2024-02-12", payee: " Dentiste", amount: 200.00, category: "Health" },
    ]);

    useEffect(() => {
        fetch("/api/transactions")
            .then(response => response.json())
            .then(data => setTransactions(data))
            .catch(error => console.error("Error fetching transactions:", error));
    }, []);

    const aggregateSpendingByCategory = () => {
        const categoryTotals = transactions.reduce((acc, txn) => {
            acc[txn.category] = (acc[txn.category] || 0) + txn.amount;
            return acc;
        }, {});

        return Object.keys(categoryTotals).map(category => ({
            name: category,
            value: categoryTotals[category]
        }));
    };

    const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1", "#d884d8"];

    return (
        <div style={{ fontFamily: "Arial, sans-serif", padding: "20px", backgroundColor: "white", color: "black", maxWidth: "900px", margin: "auto" }}>
            <h1>Transaction List</h1>
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f4f4f4" }}>
                            <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Date</th>
                            <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Payee</th>
                            <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Amount</th>
                            <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Category</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((txn, index) => (
                            <tr key={index}>
                                <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>{txn.date}</td>
                                <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>{txn.payee}</td>
                                <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>${txn.amount.toFixed(2)}</td>
                                <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>{txn.category}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <h2>Spending Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={aggregateSpendingByCategory()}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label
                    >
                        {aggregateSpendingByCategory().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TransactionsPage;
