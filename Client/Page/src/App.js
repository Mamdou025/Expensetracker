import React from "react";
import TransactionsPage from "./TransactionsPage";
import TagsPage from "./tagspage";
import TagManagementPage from "./TagManagementPage";
import TagsSpendingPage from "./TagsSpendingPage";
import MonthlySpendingPage from "./Monthlyspending";
import CategorySpendingPage from "./CategorySpending";
import TransactionsListPage from "./TransactionsListPage";
import TransactionCategoryEditor from "./TransactionCategoryEditor";

function App() {
    return (
        <div>
            <TransactionCategoryEditor/>
            <CategorySpendingPage/>
            <MonthlySpendingPage/>
            <TagManagementPage/>
            <TagsPage/>
            <TagsSpendingPage/>
        </div>
    );
}

export default App;