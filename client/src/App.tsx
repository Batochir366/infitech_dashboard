import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AppRouter } from "./routes"
import { ToastProvider } from "./context/ToastContext"
import { ThemeProvider } from "./context/ThemeContext"

const queryClient = new QueryClient()



function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
