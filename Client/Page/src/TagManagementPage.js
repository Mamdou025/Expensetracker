import React, { useEffect, useState } from "react";

const TagManagementPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [selectedTransactions, setSelectedTransactions] = useState([]);
    const [tags, setTags] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [newTag, setNewTag] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [error, setError] = useState(null);

    // ✅ Fetch transactions and tags on mount
    useEffect(() => {
        fetch("http://localhost:5000/api/transactions")
            .then(response => response.json())
            .then(data => {
                setTransactions(data);
                setFilteredTransactions(data);
            })
            .catch(error => setError("Failed to load transactions"));

        // ✅ Fetch all tags
        fetch("http://localhost:5000/api/tags")
            .then(response => response.json())
            .then(data => setAllTags(data.map(tag => tag.tag)))
            .catch(error => setError("Failed to load tags"));
    }, []);

    // ✅ Search transactions
    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);
        setFilteredTransactions(transactions.filter(txn =>
            txn.description.toLowerCase().includes(term) ||
            txn.bank.toLowerCase().includes(term) ||
            txn.category.toLowerCase().includes(term)
        ));
    };

    // ✅ Select/Deselect individual transactions
    const toggleTransactionSelection = (transactionId) => {
        setSelectedTransactions(prev =>
            prev.includes(transactionId)
                ? prev.filter(id => id !== transactionId)
                : [...prev, transactionId]
        );
    };

    // ✅ Select All Transactions in Selected Category
    const selectAllInCategory = () => {
        if (!selectedCategory) return;

        const categoryTransactions = filteredTransactions
            .filter(txn => txn.category === selectedCategory)
            .map(txn => txn.id);

        setSelectedTransactions(prev => Array.from(new Set([...prev, ...categoryTransactions])));
    };

    // ✅ Bulk Tagging Function
    const addTagToSelected = () => {
        if (!newTag.trim() || selectedTransactions.length === 0) return;

        selectedTransactions.forEach(transactionId => {
            fetch(`http://localhost:5000/api/transactions/${transactionId}/tags`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tag: newTag }),
            })
                .then(response => response.json())
                .catch(error => setError("Failed to add tag"));
        });

        setNewTag("");
        setSelectedTransactions([]);
        alert(`Tag "${newTag}" applied to selected transactions.`);
    };

    // ✅ Fetch untagged transactions
    const getUntaggedTransactions = () => {
        return transactions.filter(txn => !txn.tags || txn.tags.trim() === "");
    };

    // ✅ Extract all unique categories for the dropdown
    const allCategories = Array.from(new Set(transactions.map(txn => txn.category)));

    return (
        <div style={{ fontFamily: "Arial, sans-serif", padding: "40px", backgroundColor: "white", color: "black", maxWidth: "1100px", margin: "auto" }}>
            <h1 style={{ textAlign: "center", fontSize: "2.2em", marginBottom: "30px" }}>Manage Transaction Tags</h1>

            {error && <div style={{ color: "red", textAlign: "center" }}>{error}</div>}

            {/* 🔍 Search Transactions */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={handleSearch}
                    style={{ padding: "10px", width: "300px", borderRadius: "5px", border: "1px solid #ccc" }}
                />
            </div>

            {/* 🔽 Category Filter */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <label style={{ marginRight: "10px" }}>Filter by Category:</label>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{ padding: "8px", borderRadius: "5px" }}
                >
                    <option value="">-- Select Category --</option>
                    {allCategories.map(category => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>

                <button
                    onClick={selectAllInCategory}
                    style={{ marginLeft: "10px", padding: "8px 15px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
                >
                    Select All in Category
                </button>
            </div>

            {/* ✅ Transaction List with Category */}
            <h2>Transactions</h2>
            <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #ddd", padding: "10px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f4f4f4" }}>
                            <th>Select</th>
                            <th>ID</th>
                            <th>Description</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Tags</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.map(txn => (
                            <tr key={txn.id}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedTransactions.includes(txn.id)}
                                        onChange={() => toggleTransactionSelection(txn.id)}
                                    />
                                </td>
                                <td>{txn.id}</td>
                                <td>{txn.description}</td>
                                <td>${txn.amount.toFixed(2)}</td>
                                <td>{txn.date}</td>
                                <td>{txn.category || "Uncategorized"}</td>
                                <td>{txn.tags || "No Tags"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 🏷️ Bulk Tagging */}
            <div style={{ marginTop: "20px", textAlign: "center" }}>
                <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Enter new tag"
                    style={{ padding: "8px", width: "200px", marginRight: "10px" }}
                />
                <button
                    onClick={addTagToSelected}
                    style={{ padding: "8px 15px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
                >
                    Apply Tag to Selected
                </button>
            </div>
            {/* 📋 List of Tags */}
            <h2 style={{ marginTop: "40px" }}>All Tags</h2>
            <div style={{ textAlign: "center" }}>
                {allTags.length > 0 ? (
                    allTags.map(tag => (
                        <span key={tag} style={{ display: "inline-block", margin: "5px", padding: "5px 10px", backgroundColor: "#ddd", borderRadius: "5px" }}>
                            {tag}
                        </span>
                    ))
                ) : (
                    <p>No tags found</p>
                )}
            </div>

            {/* 🔥 Untagged Transactions */}
            <h2 style={{ marginTop: "40px" }}>Untagged Transactions</h2>
            <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #ddd", padding: "10px" }}>
                {getUntaggedTransactions().length > 0 ? (
                    <ul>
                        {getUntaggedTransactions().map(txn => (
                            <li key={txn.id}>{txn.description} (${txn.amount.toFixed(2)})</li>
                        ))}
                    </ul>
                ) : (
                    <p>All transactions are tagged 🎉</p>
                )}
            </div>

            
        </div>
    );
};

export default TagManagementPage;

