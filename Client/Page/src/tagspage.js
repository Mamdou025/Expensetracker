import React, { useEffect, useState } from "react";

const TagsPage = () => {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch("http://localhost:5000/api/tags")
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to fetch tags");
                }
                return response.json();
            })
            .then(data => {
                console.log("Fetched tags:", data); // Debugging log
                setTags(data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching tags:", error);
                setError(error.message);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div style={{ fontFamily: "Arial, sans-serif", padding: "40px", backgroundColor: "white", color: "black", maxWidth: "900px", margin: "auto" }}>
            <h1 style={{ textAlign: "center", fontSize: "2.2em", marginBottom: "30px" }}>Tags and Associated Transactions</h1>
            <div style={{ overflowY: "auto", maxHeight: "500px", border: "1px solid #ddd", padding: "10px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f4f4f4" }}>
                            <th>Tag</th>
                            <th>Transactions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tags.map(({ tag, transactions }) => (
                            <tr key={tag}>
                                <td>{tag}</td>
                                <td>
                                    {transactions.split(", ").map((txn, index) => (
                                        <div key={index}>{txn}</div>
                                    ))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TagsPage;
