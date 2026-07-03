import { Routes, Route } from "react-router";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import InventoryList from "./pages/InventoryList";
import Categories from "./pages/Categories";
import ActivityLog from "./pages/ActivityLog";
import ReorderList from "./pages/ReorderList";
import AddProduct from "./pages/AddProduct";
import Analytics from "./pages/Analytics";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="inventory" element={<InventoryList />} />
        <Route path="categories" element={<Categories />} />
        <Route path="activity" element={<ActivityLog />} />
        <Route path="reorders" element={<ReorderList />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="add-product" element={<AddProduct />} />
      </Route>
    </Routes>
  );
}

export default App;
