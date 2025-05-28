
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import * as React from "react";
import * as ReactDOM from "react-dom/client";

import App from "./App";
import ErrorPage from "./components/ErrorPage";
import Errorboundary from "./components/ErrorBoundary";

import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <Errorboundary/>,
  },
  {
    path: "/*",
    element: <ErrorPage />,
  }
])

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
        <RouterProvider router={router}/>
  </React.StrictMode>
);
