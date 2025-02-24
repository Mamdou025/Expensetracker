import React, { useEffect, useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// ✅ Category Colors
const categoryColors = {
    "Groceries": "#098903",
    "Shopping": "#E5BA0B",
    "Rent": "#33ff57",
    "Utilities": "#3357ff",
    "Transport": "#E4080A",
    "Dining Out": "#0BA504",
    "Entertainment": "#F2CA28",
    "Food Delivery": "#089B00",
    "Food": "#098403",
    "Restaurant": "#0BA603",
    "Fast Food": "#09B601",
    "Gas Station": "#842401",
    "Travel": "#E4080A",
    "Convenience": "#E4080A",
    "Subscription": "#00FADD",
    "Services": "#00E3C9",
    "Education": "#001AFA",
    "Healthcare": "#AC2AF2",
    "Miscellaneous": "#C0D101",
    "Home Improvement": "#5F524D",
    "Vet": "#A35CC8",
    "Telecommunications": "#EC69E4",
    "Other": "#888888",
    "Investments": "#040175",
    "Rent":"#D86D03",
    "Transfer":"#F94AAA",
    "Debt":"#970102",
    "Remove":"#000000"

};

// ✅ Custom Order for Categories
const customOrder = [
    "Rent", "Food Delivery", "Groceries", "Restaurant", "Fast Food", "Food",
    "Travel", "Transport", "Convenience", "Entertainment", "Miscellaneous",
    "Shopping", "Education", "Transfer", "Home Improvement", "Healthcare", "Vet",
    "Services", "Subscription", "Telecommunications", "Debt"
];

const TagsSpendingPage = () => {
    const [tags, setTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // ✅ Fetch all tags
    useEffect(() => {
        fetch("http://localhost:5000/api/tags")
            .then(response => response.json())
            .then(data => setTags(data.map(tag => tag.tag)))
            .catch(error => console.error("Error fetching tags:", error));
    }, []);

    // ✅ Fetch transactions filtered by selected tags
    useEffect(() => {
        if (selectedTags.length > 0) {
            const tagQuery = selectedTags.join(",");
            fetch(`http://localhost:5000/api/transactions/tag/${tagQuery}`)
                .then(response => response.json())
                .then(data => setTransactions(data))
                .catch(error => console.error("Error fetching transactions:", error));
        } else {
            setTransactions([]); // Clear transactions if no tags are selected
        }
    }, [selectedTags]);

    // ✅ Filter transactions by date range
    const filteredTransactions = useMemo(() => {
        return transactions.filter(txn => {
            const txnDate = new Date(txn.date);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            return (!start || txnDate >= start) && (!end || txnDate <= end);
        });
    }, [transactions, startDate, endDate]);

    // ✅ Aggregate Spending by Month and Category
    const spendingByMonth = useMemo(() => {
        const monthlyData = {};

        filteredTransactions.forEach(txn => {
            const month = txn.date.substring(0, 7); // Format: YYYY-MM
            const category = txn.category || "Other";

            if (!monthlyData[month]) {
                monthlyData[month] = { month, total: 0 };
            }

            monthlyData[month][category] = (monthlyData[month][category] || 0) + txn.amount;
            monthlyData[month].total += txn.amount;
        });

        return Object.values(monthlyData).sort((a, b) => new Date(a.month) - new Date(b.month));
    }, [filteredTransactions]);

    // ✅ Custom Tooltip for Monthly Total
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const total = payload.reduce((sum, entry) => sum + entry.value, 0);
            return (
                <div style={{ backgroundColor: "white", padding: "10px", border: "1px solid #ccc" }}>
                    <p><strong>{label}</strong></p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                            {entry.name}: ${entry.value.toFixed(2)}
                        </p>
                    ))}
                    <p><strong>Total: ${total.toFixed(2)}</strong></p>
                </div>
            );
        }
        return null;
    };

    // ✅ Compute Total Spending for Selected Tags
    const totalSpending = useMemo(() => {
        return filteredTransactions.reduce((sum, txn) => sum + txn.amount, 0);
    }, [filteredTransactions]);

    return (
        <div style={{ fontFamily: "Arial, sans-serif", padding: "40px", backgroundColor: "white", color: "black", maxWidth: "1000px", margin: "auto" }}>
            <h1 style={{ textAlign: "center", fontSize: "2.2em", marginBottom: "30px" }}>Spending by Tags</h1>

            {/* 🔍 Select Tags */}
            <div style={{ marginBottom: "20px", textAlign: "center" }}>
                <label style={{ fontSize: "1.2em", marginRight: "10px" }}>Select Tags:</label>
                <select multiple value={selectedTags} onChange={e => setSelectedTags([...e.target.selectedOptions].map(option => option.value))} style={{ width: "300px", height: "120px" }}>
                    {tags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                </select>
            </div>

            {/* 📅 Select Date Range */}
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

            {/* 💰 Total Spending */}
            <h2 style={{ textAlign: "center", fontSize: "1.9em", marginBottom: "30px" }}>Total Spending for Selected Tags: ${totalSpending.toFixed(2)}</h2>

            {/* 📊 Bar Chart (Histogram) */}
            <h2 style={{ textAlign: "center", fontSize: "1.9em", marginBottom: "30px" }}>Spending Over Time by Tags</h2>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={spendingByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />

                    {/* 🔥 Stack Bars by Custom Order */}
                    {customOrder.map((category) => (
                        <Bar
                            key={category}
                            dataKey={category}
                            stackId="a"
                            fill={categoryColors[category] || categoryColors["Other"]}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>

            {/* 📄 Transactions Table */}
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
                            <th>Category</th>
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
                                <td>{txn.category || "Uncategorized"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TagsSpendingPage;
