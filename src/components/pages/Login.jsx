import '../../Main.css'

// components

import LoginForm from '../ui/LoginForm'

function Login() {

   return (
      <>

         {/* page container thing */}
         <div className="flex flex-row bg-white/0 w-full h-full">

            {/* left side */}
            <div className="flex items-center justify-center w-1/2 h-full bg-red-300/0">

               <LoginForm />

            </div>

            {/* right side */}
            <div className="w-1/2 h-full bg-blue-300/0"></div>

         </div>

      </>
   )
}

export default Login
