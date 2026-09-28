import { Routes, Route } from "react-router";
import ProtectedRoute from "./components/ProtectedRoute";
import RequireCapability from "./components/RequireCapability";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import InventoryList from "./pages/InventoryList";
import Categories from "./pages/Categories";
import Locations from "./pages/Locations";
import StockCount from "./pages/StockCount";
import ActivityLog from "./pages/ActivityLog";
import ReorderList from "./pages/ReorderList";
import AddProduct from "./pages/AddProduct";
import ImportProducts from "./pages/ImportProducts";
import EditProduct from "./pages/EditProduct";
import Analytics from "./pages/Analytics";
import Suppliers from "./pages/Suppliers";
import PurchaseOrders from "./pages/PurchaseOrders";
import PurchaseOrderForm from "./pages/PurchaseOrderForm";
import PurchaseOrderDetail from "./pages/PurchaseOrderDetail";
import Users from "./pages/Users";

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
        <Route path="locations" element={<Locations />} />
        <Route path="stock-count" element={<StockCount />} />
        <Route path="activity" element={<ActivityLog />} />
        <Route path="reorders" element={<ReorderList />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="add-product" element={<AddProduct />} />
        <Route path="import-products" element={<ImportProducts />} />
        <Route path="inventory/:id/edit" element={<EditProduct />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="purchase-orders" element={<PurchaseOrders />} />
        <Route path="purchase-orders/new" element={<PurchaseOrderForm />} />
        <Route path="purchase-orders/:id" element={<PurchaseOrderDetail />} />
        <Route
          path="purchase-orders/:id/edit"
          element={<PurchaseOrderForm />}
        />
        <Route
          path="users"
          element={
            <RequireCapability capability="canManageUsers">
              <Users />
            </RequireCapability>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
