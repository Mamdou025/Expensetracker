import React, { useEffect, useState } from "react";

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
    "Rent": "#D86D03",
    "Transfer": "#F94AAA",
    "Debt": "#970102",
    "Remove": "#000000"
};

// 🔥 Define available categories for selection
const categoryOptions = ["All Categories", ...Object.keys(categoryColors)];

const TransactionCategoryEditor = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedBank, setSelectedBank] = useState("All Banks");
    const [selectedCategory, setSelectedCategory] = useState("All Categories");

    // Fetch transactions from API
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

    // 🔥 Handle category update
    const updateCategory = (transactionId, newCategory) => {
        fetch(`http://localhost:5000/api/transactions/${transactionId}/category`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: newCategory }),
        })
            .then(response => response.json())
            .then(() => {
                setTransactions(prevTransactions =>
                    prevTransactions.map(txn =>
                        txn.id === transactionId ? { ...txn, category: newCategory } : txn
                    )
                );
            })
            .catch(error => console.error("Error updating category:", error));
    };

    // 🔥 Get unique list of banks
    const bankOptions = ["All Banks", ...new Set(transactions.map(txn => txn.bank))];

    // 🔥 Filter transactions by selected bank and category
    const filteredTransactions = transactions.filter(txn => {
        const bankMatch = selectedBank === "All Banks" || txn.bank === selectedBank;
        const categoryMatch = selectedCategory === "All Categories" || txn.category === selectedCategory;
        return bankMatch && categoryMatch;
    });

    if (loading) return <div>Loading transactions...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div style={{ fontFamily: "Arial, sans-serif", padding: "40px", backgroundColor: "white", color: "black", maxWidth: "900px", margin: "auto" }}>
            <h1 style={{ textAlign: "center", fontSize: "2.2em", marginBottom: "30px" }}>Modify Transaction Categories</h1>

            {/* 🔥 Filters Section */}
            <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "20px" }}>
                {/* Bank Filter */}
                <div>
                    <label style={{ fontSize: "1.2em", marginRight: "10px" }}>Filter by Bank:</label>
                    <select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)} style={{ padding: "8px", width: "200px" }}>
                        {bankOptions.map((bank, index) => (
                            <option key={index} value={bank}>{bank}</option>
                        ))}
                    </select>
                </div>

                {/* Category Filter */}
                <div>
                    <label style={{ fontSize: "1.2em", marginRight: "10px" }}>Filter by Category:</label>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ padding: "8px", width: "200px" }}>
                        {categoryOptions.map((category, index) => (
                            <option key={index} value={category}>{category}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 🔥 Transactions Table */}
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
                        {filteredTransactions.map((txn) => (
                            <tr key={txn.id}>
                                <td>{txn.id}</td>
                                <td>${txn.amount.toFixed(2)}</td>
                                <td>{txn.description}</td>
                                <td>{txn.date}</td>
                                <td>{txn.time}</td>
                                <td>{txn.bank}</td>
                                <td style={{ backgroundColor: categoryColors[txn.category] || categoryColors["Other"], color: "#fff", padding: "5px", textAlign: "center" }}>
                                    <select
                                        value={txn.category}
                                        onChange={(e) => updateCategory(txn.id, e.target.value)}
                                        style={{ padding: "5px", border: "1px solid #ddd", background: "white", fontWeight: "bold" }}
                                    >
                                        {categoryOptions.map(category => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TransactionCategoryEditor;
