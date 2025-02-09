import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const TransactionsPage = () => {
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        fetch("http://localhost:5000/api/transactions")
            .then((response) => response.json())
            .then((data) => setTransactions(data))
            .catch((error) => console.error("Error fetching transactions:", error));
    }, []);
    

    const aggregateSpendingByBank = () => {
        const bankTotals = transactions.reduce((acc, txn) => {
            acc[txn.bank] = (acc[txn.bank] || 0) + txn.amount;
            return acc;
        }, {});

        return Object.keys(bankTotals).map(bank => ({
            name: bank,
            value: bankTotals[bank]
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
                            <th>ID</th>
                            <th>Amount</th>
                            <th>Description</th>
                            <th>Card Type</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Bank</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((txn, index) => (
                            <tr key={index}>
                                <td>{txn.id}</td>
                                <td>${txn.amount.toFixed(2)}</td>
                                <td>{txn.description}</td>
                                <td>{txn.card_type}</td>
                                <td>{txn.date}</td>
                                <td>{txn.time}</td>
                                <td>{txn.bank}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <h2>Spending by Bank</h2>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={aggregateSpendingByBank()}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label
                    >
                        {aggregateSpendingByBank().map((entry, index) => (
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

