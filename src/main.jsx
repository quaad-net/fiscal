import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import App from "./App";
import ErrorPage from "./components/ErrorPage";
// import ErrorBoundary from "./components/ErrorBoundary";
// import Fiscal from "./components/Fiscal";
// import Lgn from "./components/Lgn";

import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    // errorElement: <ErrorBoundary/>,
  },
  // {
  //   path: "/lgn",
  //   element: <Lgn />,  
    
  // },
  // {
  //   path: "/dashboard",
  //   element: <Fiscal />,
  // },
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
