import React, { useEffect, useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";


// Define custom colors for each category
const categoryColors = {
    "Groceries": "#098903",
    "Shopping": "#E5BA0B",
    "Rent": "#33ff57",
    "Utilities": "#3357ff",
    "Transport": "#E4080A",
    "Dining Out": "#0BA504",
    "Entertainment": "#F7CA15",
    "Food Delivery": "#089B00",
    "Food": "#098403",
    "Restaurant": "#0BA603",
    "Fast Food":"#09B601",
    "Gas Station": "#842401",
    "Travel": "#E4080A",
    "Convenience": "#E4080A",
    "Subscription": "#00FADD",
    "Services": "#00E3C9",
    "Education": "#001AFA",
    "Healthcare": "#EC69E4",
    "Miscellaneous": "#EF8419",
    "Home Improvement":"#9110DB",
    "Vet": "#E981E1",
    "Telecommunications":"#11DFC7",
        "Transfer":"#F94AAA",
    "Other": "#888888" // Default color for unlisted categories
};
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const { name, value, percentage } = payload[0].payload;
        return (
            <div style={{ backgroundColor: "white", padding: "10px", border: "1px solid #ddd" }}>
                <p><strong>{name}</strong></p>
                <p>Amount: ${value.toFixed(2)}</p>  {/* 🔥 Rounded amount */}
                <p>Percentage: {percentage}</p>  {/* 🔥 Show percentage */}
            </div>
        );
    }
    return null;
};


// Define reusable CategoryPieChart component
const CategoryPieChart = ({ data }) => (
    <ResponsiveContainer width="100%" height={350}>
        <PieChart>
            <Pie
                data={data}
                cx="50%"    
                cy="40%"
                outerRadius={100}
                dataKey="value"
                label={false} // 🔥 Removed labels
            >
                {data.map((entry) => (
                    <Cell key={entry.name} fill={categoryColors[entry.name] || categoryColors["Other"]} />
                ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} /> {/* 🔥 Custom Tooltip */}
            <Legend layout="horizontal" align="center" verticalAlign="bottom" />
        </PieChart>
    </ResponsiveContainer>
);

// Define reusable CategoryBarChart component
const CategoryBarChart = ({ data, categories, stackId }) => (
    <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barSize={30}> {/* 🔥 Increased bar size */}
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={stackId ? "month" : "date"} />
            <YAxis />
            <Tooltip />
            <Legend />
            {categories.map((category) => (
                <Bar
                    key={category}
                    dataKey={category}
                    stackId={stackId}
                    fill={categoryColors[category] || categoryColors["Other"]}
                />
            ))}
        </BarChart>
    </ResponsiveContainer>
);


const TransactionsPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
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
                const formattedData = data.map(txn => ({
                    ...txn,
                    amount: parseFloat(txn.amount)
                }));
                setTransactions(formattedData);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching transactions:", error);
                setError(error.message);
                setLoading(false);
            });
    }, []);

    const filterTransactionsByDate = () => {
        return transactions.filter(txn => {
            const txnDate = new Date(txn.date);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            return (!start || txnDate >= start) && (!end || txnDate <= end);
        });
    };

    const filteredTransactions = useMemo(() => filterTransactionsByDate(), [transactions, startDate, endDate]);

    const aggregateSpendingByCategory = () => {
        const categoryTotals = filteredTransactions.reduce((acc, txn) => {
            acc[txn.category] = (acc[txn.category] || 0) + txn.amount;
            return acc;
        }, {});

        const totalSpending = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);

        const spendingData = Object.keys(categoryTotals).map(category => ({
            name: category,
            value: categoryTotals[category],
            percentage: ((categoryTotals[category] / totalSpending) * 100).toFixed(2) + "%"
        }));

        // Define custom category order
        const customOrder = ["Food Delivery", "Groceries", "Restaurant","Fast Food","Food", "Travel", "Transport","Convenience" ,"Convinience", "Entertainment","Shopping", "Other","Healthcare","Vet","Services","Subscription","Telecommunications"];

        // Sort categories according to custom order
        spendingData.sort((a, b) => customOrder.indexOf(a.name) - customOrder.indexOf(b.name));

        return spendingData;
    };

    const spendingByCategory = useMemo(() => aggregateSpendingByCategory(), [filteredTransactions]);

    const aggregateSpendingByDate = () => {
        const dailySpending = filteredTransactions.reduce((acc, txn) => {
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

    const spendingByDate = useMemo(() => aggregateSpendingByDate(), [filteredTransactions]);

    const aggregateSpendingByMonth = () => {
        const monthlySpending = filteredTransactions.reduce((acc, txn) => {
            const month = txn.date.substring(0, 7);
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

    const spendingByMonth = useMemo(() => aggregateSpendingByMonth(), [filteredTransactions]);

    const categories = [...new Set(transactions.map(txn => txn.category))];

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

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
    {filteredTransactions.map((txn, index) => {
        const categoryColor = categoryColors[txn.category] || categoryColors["Other"];

        return (
            <tr key={index}>
                <td>{txn.id}</td>
                <td>${txn.amount.toFixed(2)}</td>
                <td>{txn.description}</td>
                <td>{txn.date}</td>
                <td>{txn.time}</td>
                <td>{txn.bank}</td>
                {/* Apply category color only to this column */}
                <td 
                    style={{
                        backgroundColor: categoryColor,
                        color: "#fff",
                        padding: "5px 3px",
                        textAlign: "center"
                    }}
                >
                    {txn.category || "Uncategorized"}
                </td>
            </tr>
        );
    })}
</tbody>

                </table>
            </div>
            <h2 style={{ textAlign: "center", fontSize: "1.9em", marginBottom: "30px" }}>Spending by Category</h2>
            <CategoryPieChart data={spendingByCategory} />
            <h2 style={{ textAlign: "center", fontSize: "1.9em", marginTop: "50px", marginBottom: "30px" }}>Daily Spending by Category</h2>
            <CategoryBarChart data={spendingByDate} categories={categories} />
            <h2 style={{ textAlign: "center", fontSize: "1.9em", marginTop: "50px", marginBottom: "30px" }}>Monthly Spending Breakdown</h2>
            <CategoryBarChart data={spendingByMonth} categories={categories} stackId="a" />
        </div>
    );
};

export default TransactionsPage;
