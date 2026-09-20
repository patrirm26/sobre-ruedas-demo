import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.tsx'
import { TenantProvider } from './state/TenantContext.tsx'
import { StaffProvider } from './state/StaffContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TenantProvider>
      <StaffProvider>
        <App />
      </StaffProvider>
    </TenantProvider>
  </StrictMode>,
)
