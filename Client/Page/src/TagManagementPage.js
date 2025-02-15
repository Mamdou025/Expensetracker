import React, { useEffect, useState } from "react";

const TagManagementPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [tags, setTags] = useState([]);
    const [newTag, setNewTag] = useState("");
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch("http://localhost:5000/api/transactions")
            .then(response => response.json())
            .then(data => setTransactions(data))
            .catch(error => setError("Failed to load transactions"));
    }, []);

    const fetchTags = (transactionId) => {
        fetch(`http://localhost:5000/api/transactions/${transactionId}/tags`)
            .then(response => response.json())
            .then(data => setTags(data))
            .catch(error => setError("Failed to load tags"));
    };

    const addTag = () => {
        if (!newTag.trim() || !selectedTransaction) return;
        
        fetch(`http://localhost:5000/api/transactions/${selectedTransaction}/tags`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag: newTag }),
        })
            .then(response => response.json())
            .then(() => {
                setTags([...tags, newTag]);
                setNewTag("");
            })
            .catch(error => setError("Failed to add tag"));
    };

    const removeTag = (tag) => {
        fetch(`http://localhost:5000/api/transactions/${selectedTransaction}/tags`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag }),
        })
            .then(response => response.json())
            .then(() => {
                setTags(tags.filter(t => t !== tag));
            })
            .catch(error => setError("Failed to remove tag"));
    };

    return (
        <div style={{ fontFamily: "Arial, sans-serif", padding: "40px", backgroundColor: "white", color: "black", maxWidth: "900px", margin: "auto" }}>
            <h1 style={{ textAlign: "center", fontSize: "2.2em", marginBottom: "30px" }}>Manage Transaction Tags</h1>
            
            {error && <div style={{ color: "red", textAlign: "center" }}>{error}</div>}

            <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "20px" }}>
                <label>
                    Select Transaction:
                    <select onChange={(e) => {
                        setSelectedTransaction(e.target.value);
                        fetchTags(e.target.value);
                    }}>
                        <option value="">-- Select --</option>
                        {transactions.map(txn => (
                            <option key={txn.id} value={txn.id}>
                                {txn.description} (${txn.amount.toFixed(2)})
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {selectedTransaction && (
                <div>
                    <h2 style={{ textAlign: "center", fontSize: "1.9em", marginBottom: "20px" }}>Current Tags</h2>
                    <div style={{ textAlign: "center" }}>
                        {tags.length > 0 ? tags.map(tag => (
                            <span key={tag} style={{ display: "inline-block", margin: "5px", padding: "5px 10px", backgroundColor: "#ddd", borderRadius: "5px", cursor: "pointer" }} onClick={() => removeTag(tag)}>
                                {tag} ✖
                            </span>
                        )) : <p>No tags</p>}
                    </div>

                    <div style={{ textAlign: "center", marginTop: "20px" }}>
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Enter new tag"
                            style={{ padding: "8px", marginRight: "10px" }}
                        />
                        <button onClick={addTag} style={{ padding: "8px 15px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
                            Add Tag
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TagManagementPage;
