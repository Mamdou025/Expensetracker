import React from "react";
import TransactionsPage from "./TransactionsPage";
import TagsPage from "./tagspage";
import TagManagementPage from "./TagManagementPage";
import TagsSpendingPage from "./TagsSpendingPage";

function App() {
    return (
        <div>
            <TransactionsPage />
            <TagManagementPage/>
            <TagsPage/>
            <TagsSpendingPage/>
        </div>
    );
}

export default App;