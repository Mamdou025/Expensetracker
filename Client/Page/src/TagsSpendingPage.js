import React, { useEffect, useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const TagsSpendingPage = () => {
    const [tags, setTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Fetch all tags
    useEffect(() => {
        fetch("http://localhost:5000/api/tags")
            .then(response => response.json())
            .then(data => setTags(data.map(tag => tag.tag))) // Extract tag names
            .catch(error => console.error("Error fetching tags:", error));
    }, []);

    // Fetch transactions filtered by selected tags
    useEffect(() => {
        if (selectedTags.length > 0) {
            const tagQuery = selectedTags.join(",");
            fetch(`http://localhost:5000/api/transactions/tag/${tagQuery}`)
                .then(response => response.json())
                .then(data => setTransactions(data))
                .catch(error => console.error("Error fetching transactions:", error));
        }
    }, [selectedTags]);

    // Filter transactions by date range
    const filteredTransactions = useMemo(() => {
        return transactions.filter(txn => {
            const txnDate = new Date(txn.date);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            return (!start || txnDate >= start) && (!end || txnDate <= end);
        });
    }, [transactions, startDate, endDate]);

    // Compute total spending for selected tags
    const totalSpending = useMemo(() => {
        return filteredTransactions.reduce((sum, txn) => sum + txn.amount, 0);
    }, [filteredTransactions]);

    // Aggregate spending by date for Line Chart
    const aggregateSpendingByDate = () => {
        const dateSpending = filteredTransactions.reduce((acc, txn) => {
            if (!acc[txn.date]) acc[txn.date] = { date: txn.date, total: 0 };
            acc[txn.date].total += txn.amount;
            return acc;
        }, {});

        return Object.values(dateSpending).sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const spendingByDate = useMemo(() => aggregateSpendingByDate(), [filteredTransactions]);

    return (
        <div style={{ fontFamily: "Arial, sans-serif", padding: "40px", backgroundColor: "white", color: "black", maxWidth: "1000px", margin: "auto" }}>
            <h1 style={{ textAlign: "center", fontSize: "2.2em", marginBottom: "30px" }}>Spending by Tags</h1>

            {/* Select Tags */}
            <div style={{ marginBottom: "20px", textAlign: "center" }}>
                <label style={{ fontSize: "1.2em", marginRight: "10px" }}>Select Tags:</label>
                <select multiple value={selectedTags} onChange={e => setSelectedTags([...e.target.selectedOptions].map(option => option.value))} style={{ width: "300px", height: "120px" }}>
                    {tags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                </select>
            </div>

            {/* Select Date Range */}
            <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "20px" }}>
                <label>
                    Start Date:
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </label>
                <label>
                    End Date:
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </label>
            </div>

            {/* Total Spending Display */}
            <h2 style={{ textAlign: "center", fontSize: "1.9em", marginBottom: "30px" }}>Total Spending for Selected Tags: ${totalSpending.toFixed(2)}</h2>

            {/* Line Chart for Spending Over Time */}
            <h2 style={{ textAlign: "center", fontSize: "1.9em", marginBottom: "30px", marginTop: "50px" }}>Spending Over Time by Tags</h2>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={spendingByDate}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>

            {/* Transactions Table */}
            <h2 style={{ textAlign: "center", fontSize: "1.9em", marginBottom: "20px" }}>Transactions</h2>
            <div style={{ overflowY: "auto", maxHeight: "400px", border: "1px solid #ddd", padding: "10px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f4f4f4" }}>
                            <th>ID</th>
                            <th>Amount</th>
                            <th>Description</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Bank</th>
                            <th>Tags</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.map((txn, index) => (
                            <tr key={index}>
                                <td>{txn.id}</td>
                                <td>${txn.amount.toFixed(2)}</td>
                                <td>{txn.description}</td>
                                <td>{txn.date}</td>
                                <td>{txn.time}</td>
                                <td>{txn.bank}</td>
                                <td>{txn.tags || "No Tags"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TagsSpendingPage;
