import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Login from './components/pages/Login.jsx'

createRoot(document.getElementById('root')).render(
   <StrictMode>
      <div className="flex p-5 w-screen h-screen bg-zinc-800">
         <Login />
      </div>
   </StrictMode>,
)
