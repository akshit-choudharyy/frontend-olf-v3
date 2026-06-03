import { createRouter, RouterProvider } from '@tanstack/react-router';
import './App.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { routeTree } from './routeTree.gen';
import { useAuth } from './hooks/useAuth';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from './store/store';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 min
      refetchOnWindowFocus: true,
    },
  },
});

export const router = createRouter({
  routeTree,
  defaultPendingComponent: () => (
    <div className={`p-2 text-2xl`}>
      <></>
    </div>
  ),
  defaultErrorComponent: () => (
    <div
      style={{
        textAlign: 'center',
        color: '#333',
        backgroundColor: '#f9f9f9',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        maxWidth: '400px',
        margin: '50px auto',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <img
        src={"https://e7.pngegg.com/pngimages/194/9/png-clipart-shiba-inu-doge-flying-discs-know-your-meme-disc-dog-doge-miscellaneous-carnivoran-thumbnail.png"}
        alt="Aw, Snap!"
        style={{ width: '150px', marginBottom: '20px' }}
      />
      <h2 style={{ marginBottom: '10px' }}>Aw, Snap!</h2>
      <p>Something went wrong. Please try refreshing the page or come back later.</p>
    </div>
  ),

  defaultNotFoundComponent: function NotFound() {
    return (<><p>Not founddd!!!</p></>)
  },
  context: { authentication: undefined! },
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
function App() {
  const authentication = useAuth();
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <Toaster />
      
          <RouterProvider
            router={router}
            defaultPreload="intent"
            context={{ authentication }}
          />
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  )
}

export default App
