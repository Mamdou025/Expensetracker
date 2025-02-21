import React, { useEffect, useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

// 🔥 Define category colors
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
    "Debt":"#970102"

    
};

// 🔥 Define custom category stacking order
const customOrder = [
   "Rent", "Food Delivery", "Groceries", "Restaurant", "Fast Food", "Food",
    "Travel", "Transport", "Convenience", "Entertainment","Miscellaneous",
    "Shopping","Education", "Transfer","Home Improvement","Healthcare", "Vet",
    "Services", "Subscription", "Telecommunications","Debt"
];

// 🔥 Custom Tooltip Component (includes total spending per month)
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const totalSpending = payload.reduce((sum, entry) => sum + entry.value, 0);

        return (
            <div style={{ backgroundColor: "white", padding: "10px", border: "1px solid #ddd" }}>
                <p><strong>{payload[0].payload.month}</strong></p>
                <p><strong>Total: ${totalSpending.toFixed(2)}</strong></p>
                {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color }}>
                        {entry.name}: ${entry.value.toFixed(2)}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const MonthlySpendingPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch("http://localhost:5000/api/transactions")
            .then(response => response.json())
            .then(data => {
                setTransactions(data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching transactions:", error);
                setError(error.message);
                setLoading(false);
            });
    }, []);

    // 🔥 Get last completed month (e.g., if today is February, show up to January)
    const getLastCompletedMonth = () => {
        const today = new Date();
        today.setDate(1); // Set to the first day of the current month
        today.setMonth(today.getMonth() - 1); // Go back one month
        return today.toISOString().substring(0, 7); // Format as YYYY-MM
    };

    // 🔥 Aggregate spending by month and category (only for completed months)
    const aggregateSpendingByMonth = () => {
        const lastCompletedMonth = getLastCompletedMonth();
        const monthlySpending = transactions.reduce((acc, txn) => {
            const month = txn.date.substring(0, 7); // Extract YYYY-MM
            if (month > lastCompletedMonth) return acc; // Skip current incomplete month

            if (!acc[month]) acc[month] = { total: 0 };
            acc[month].total += txn.amount; // Track total spending per month
            acc[month][txn.category] = (acc[month][txn.category] || 0) + txn.amount;

            return acc;
        }, {});

        return Object.keys(monthlySpending)
            .sort((a, b) => a.localeCompare(b)) // 🔥 Sort months in ASCENDING order
            .map(month => ({
                month,
                total: monthlySpending[month].total,
                ...monthlySpending[month]
            }));
    };

    // 🔥 Processed monthly spending data
    const spendingByMonth = useMemo(() => aggregateSpendingByMonth(), [transactions]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div style={{ fontFamily: "Arial, sans-serif", padding: "40px", backgroundColor: "white", color: "black", maxWidth: "1000px", margin: "auto" }}>
            <h1 style={{ textAlign: "center", fontSize: "2.2em", marginBottom: "30px" }}>Monthly Spending Breakdown</h1>

            {/* 🔥 Stacked Bar Chart with Tooltip */}
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={spendingByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    {/* 🔥 Display each category in the correct stacked order */}
                    {customOrder.map(category => (
                        <Bar
                            key={category}
                            dataKey={category}
                            stackId="a"
                            fill={categoryColors[category] || categoryColors["Other"]}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MonthlySpendingPage;
