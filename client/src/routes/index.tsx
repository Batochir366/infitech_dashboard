import { createBrowserRouter, RouterProvider } from "react-router-dom"
import AuthLayout from "../layouts/AuthLayout"

import { Navigate } from "react-router-dom"
import AuthGuard from "../middlewares/authGuard"
import LoginPage from "../pages/auth/LoginPage"
import ClientListPage from "../pages/clients/ClientListPage"
import ClientFormPage from "../pages/clients/ClientFormPage"
import ClientDetailPage from "../pages/clients/ClientDetailPage"
import ModuleListPage from "../pages/modules/ModuleListPage"
import ModuleDetailPage from "../pages/modules/ModuleDetailPage"
import SystemListPage from "../pages/systems/SystemListPage"
import PublicInvoicePage from "../pages/invoices/PublicInvoicePage"

const router = createBrowserRouter([
  {
    path: "/invoice/:token",
    element: <PublicInvoicePage />,
  },
  {
    path: "/",
    element: <AuthGuard />,
    children: [
      {
        index: true,
        element: <Navigate to="/clients" replace />,
      },
      {
        path: "clients",
        children: [
          {
            index: true,
            element: <ClientListPage />,
          },
          {
            path: ":id",
            element: <ClientDetailPage />,
          },
          {
            path: ":id/edit",
            element: <ClientFormPage />,
          },
        ],
      },
      {
        path: "systems",
        children: [
          {
            index: true,
            element: <SystemListPage />,
          },
        ],
      },
      {
        path: "modules",
        children: [
          {
            index: true,
            element: <ModuleListPage />,
          },
          {
            path: ":id",
            element: <ModuleDetailPage />,
          },
        ],
      },
    ],
  },
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      {
        path: "login",
        element: <LoginPage />,
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
