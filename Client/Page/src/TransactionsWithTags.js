import React, { useState, useEffect } from 'react';
import Select from 'react-select/creatable';

// ✅ Define tag colors for consistency
const tagColors = {
    "Urgent": "#FF5733",
    "Work": "#33FF57",
    "Personal": "#3357FF",
    "Finance": "#F7CA15",
    "Shopping": "#E91E63",
    "Health": "#00BCD4",
    "Other": "#888888"
};

// ✅ Custom styles for react-select
const customSelectStyles = {
    multiValue: (styles, { data }) => ({
        ...styles,
        backgroundColor: tagColors[data.value] || tagColors["Other"]
    }),
    multiValueLabel: (styles) => ({
        ...styles,
        color: 'white'
    }),
    multiValueRemove: (styles) => ({
        ...styles,
        color: 'white',
        ':hover': {
            backgroundColor: '#d32f2f',
            color: 'white',
        },
    }),
};

const TagSelector = ({ transactionId, existingTags, allTags, onTagsUpdate }) => {
    const [selectedTags, setSelectedTags] = useState(existingTags || []);

    const handleChange = (newTags) => {
        setSelectedTags(newTags);
        onTagsUpdate(transactionId, newTags.map(tag => tag.value));
    };

    const tagOptions = allTags.map(tag => ({ value: tag, label: tag }));

    return (
        <Select
            isMulti
            value={selectedTags.map(tag => ({ value: tag, label: tag }))}
            options={tagOptions}
            onChange={handleChange}
            styles={customSelectStyles}
            placeholder="Add or create tags..."
            isClearable
            isSearchable
        />
    );
};

const TransactionsWithTags = () => {
    const [transactions, setTransactions] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [error, setError] = useState(null);

    // ✅ Fetch transactions and tags
    useEffect(() => {
        fetch("http://localhost:5000/api/transactions")
            .then(response => response.json())
            .then(data => {
                setTransactions(data);
                const tagsFromData = data.flatMap(txn => txn.tags || []);
                setAllTags([...new Set(tagsFromData)]);
            })
            .catch(err => setError(err.message));
    }, []);

    const handleTagsUpdate = (transactionId, newTags) => {
        fetch(`http://localhost:5000/api/transactions/${transactionId}/tags`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tags: newTags })
        })
            .then(res => res.json())
            .then(updatedTxn => {
                setTransactions(prev =>
                    prev.map(txn =>
                        txn.id === transactionId ? { ...txn, tags: newTags } : txn
                    )
                );
                setAllTags(prev => [...new Set([...prev, ...newTags])]);
            })
            .catch(err => console.error("Error updating tags:", err));
    };

    if (error) return <div>Error: {error}</div>;

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h1 style={{ textAlign: "center" }}>Transactions with Tags</h1>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
                <thead>
                    <tr style={{ backgroundColor: "#f4f4f4" }}>
                        <th style={{ padding: "8px", border: "1px solid #ddd" }}>ID</th>
                        <th style={{ padding: "8px", border: "1px solid #ddd" }}>Description</th>
                        <th style={{ padding: "8px", border: "1px solid #ddd" }}>Amount</th>
                        <th style={{ padding: "8px", border: "1px solid #ddd" }}>Tags</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map(txn => (
                        <tr key={txn.id}>
                            <td style={{ padding: "8px", border: "1px solid #ddd" }}>{txn.id}</td>
                            <td style={{ padding: "8px", border: "1px solid #ddd" }}>{txn.description}</td>
                            <td style={{ padding: "8px", border: "1px solid #ddd" }}>${txn.amount.toFixed(2)}</td>
                            <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                                <TagSelector
                                    transactionId={txn.id}
                                    existingTags={txn.tags || []}
                                    allTags={allTags}
                                    onTagsUpdate={handleTagsUpdate}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TransactionsWithTags;
