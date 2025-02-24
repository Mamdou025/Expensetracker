import React, { useEffect, useState } from "react";

const TagDeletionPage = () => {
    const [tags, setTags] = useState([]);
    const [error, setError] = useState(null);

    // ✅ Fetch all tags from the server
    const fetchTags = () => {
        fetch("http://localhost:5000/api/tags")
            .then(response => response.json())
            .then(data => setTags(data))
            .catch(error => setError("❌ Failed to load tags"));
    };

    useEffect(() => {
        fetchTags();
    }, []);

    // ✅ Delete Tag
    const deleteTag = (tagName) => {
        if (!window.confirm(`Are you sure you want to delete the tag "${tagName}"?`)) return;

        fetch(`http://localhost:5000/api/tags/${tagName}`, {
            method: "DELETE",
        })
            .then(response => response.json())
            .then(() => fetchTags())
            .catch(() => setError("❌ Failed to delete tag"));
    };

    return (
        <div style={{ fontFamily: "Arial, sans-serif", padding: "40px", backgroundColor: "white", color: "black", maxWidth: "600px", margin: "auto" }}>
            <h1 style={{ textAlign: "center", fontSize: "2em", marginBottom: "30px" }}>Delete Tags</h1>

            {error && <div style={{ color: "red", textAlign: "center" }}>{error}</div>}

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {tags.length > 0 ? tags.map((tag, index) => (
                    <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #ddd", padding: "10px", borderRadius: "5px" }}>
                        <span>{tag.tag}</span>
                        <button
                            onClick={() => deleteTag(tag.tag)}
                            style={{ padding: "5px 10px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "3px", cursor: "pointer" }}
                        >
                            Delete
                        </button>
                    </div>
                )) : <p style={{ textAlign: "center" }}>No tags found.</p>}
            </div>
        </div>
    );
};

export default TagDeletionPage;
