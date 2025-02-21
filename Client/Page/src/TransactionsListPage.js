import React, { useEffect, useState, useMemo } from "react";

// Define category colors
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
    "Miscellaneous": "#EF8419",
    "Home Improvement": "#5F524D",
    "Vet": "#A35CC8",
    "Telecommunications": "#EC69E4",
    "Investments": "#040175",
        "Transfer":"#F94AAA",
    "Other": "#888888"
};

const TransactionsListPage = () => {
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
                setTransactions(data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching transactions:", error);
                setError(error.message);
                setLoading(false);
            });
    }, []);

    // 🔥 Filter transactions by selected date range
    const filteredTransactions = useMemo(() => {
        return transactions.filter(txn => {
            const txnDate = new Date(txn.date);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            return (!start || txnDate >= start) && (!end || txnDate <= end);
        });
    }, [transactions, startDate, endDate]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div style={{ fontFamily: "Arial, sans-serif", padding: "40px", backgroundColor: "white", color: "black", maxWidth: "900px", margin: "auto" }}>
            <h1 style={{ textAlign: "center", fontSize: "2.2em", marginBottom: "30px" }}>Transaction List</h1>

            {/* 🔥 Date Filter */}
            <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "20px" }}>
                <label>
                    Start Date:
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </label>
                <label>
                    End Date:
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </label>
            </div>

            {/* 🔥 Transaction Table */}
            <div style={{ overflowY: "auto", maxHeight: "500px", border: "1px solid #ddd", padding: "10px" }}>
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
                                    {/* 🔥 Apply color only to category column */}
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
        </div>
    );
};

export default TransactionsListPage;
