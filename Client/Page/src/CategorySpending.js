import React, { useEffect, useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

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

// 🔥 Define custom order for Pie Chart
const customOrder = [
    "Food Delivery", "Groceries", "Restaurant", "Fast Food", "Food",
    "Travel", "Transport", "Convenience", "Entertainment",
    "Shopping", "Education", "Miscellaneous", "Home Improvement",
    "Healthcare", "Vet", "Services", "Subscription", "Telecommunications"
];

// 🔥 Custom Tooltip for Pie Chart
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const { name, value, percentage } = payload[0].payload;
        return (
            <div style={{ backgroundColor: "white", padding: "10px", border: "1px solid #ddd" }}>
                <p><strong>{name}</strong></p>
                <p>Amount: ${value.toFixed(2)}</p>
                <p>Percentage: {percentage}</p>
            </div>
        );
    }
    return null;
};

// 🔥 Category Pie Chart (Sorted & Enhanced)
const CategoryPieChart = ({ data }) => (
    <ResponsiveContainer width="100%" height={400}>  {/* Increased height for better spacing */}
        <PieChart>
            <Pie
                data={data}
                cx="50%"
                cy="45%"
                outerRadius={130} // 🔥 Increased Pie Chart size
                dataKey="value"
                label={false} // 🔥 Removed labels for clarity
            >
                {data.map((entry) => (
                    <Cell key={entry.name} fill={categoryColors[entry.name] || categoryColors["Other"]} />
                ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ marginTop: "20px" }} />
        </PieChart>
    </ResponsiveContainer>
);

const CategorySpendingPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch("http://localhost:5000/api/transactions")
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to fetch transactions");
                }
                return response.json();
            })
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

    // 🔥 Aggregate spending by **category**
    const aggregateSpendingByCategory = () => {
        const categoryTotals = transactions.reduce((acc, txn) => {
            const category = txn.category?.trim();
            if (category) {
                acc[category] = (acc[category] || 0) + txn.amount;
            }
            return acc;
        }, {});

        // Filter out categories with 0 spending & calculate total spending
        const totalSpending = Object.values(categoryTotals).reduce((sum, v) => sum + v, 0);

        let spendingData = Object.keys(categoryTotals).map(category => ({
            name: category,
            value: categoryTotals[category],
            percentage: ((categoryTotals[category] / totalSpending) * 100).toFixed(2) + "%"
        }));

        // 🔥 Ensure categories follow custom order
        spendingData.sort((a, b) => {
            const indexA = customOrder.indexOf(a.name);
            const indexB = customOrder.indexOf(b.name);
            return (indexA !== -1 ? indexA : customOrder.length) - (indexB !== -1 ? indexB : customOrder.length);
        });

        return spendingData;
    };

    const spendingByCategory = useMemo(() => aggregateSpendingByCategory(), [transactions]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div style={{ fontFamily: "Arial, sans-serif", padding: "40px", backgroundColor: "white", color: "black", maxWidth: "900px", margin: "auto" }}>
            <h1 style={{ textAlign: "center", fontSize: "2.2em", marginBottom: "30px" }}>Spending by Category</h1>
            <CategoryPieChart data={spendingByCategory} />
        </div>
    );
};

export default CategorySpendingPage;
