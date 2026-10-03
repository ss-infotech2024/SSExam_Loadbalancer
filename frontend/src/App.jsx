import AppRoutes from "./routes/AppRoutes";
import './index.css'
import { Provider } from "react-redux";
import { store } from "./store/index";
import { ToastProvider } from "./components/ui";

function App() {

  return (
    <>
      <Provider  store={store}>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </Provider>
    </>
  )
}

export default App
