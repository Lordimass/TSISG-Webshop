import { AuthSession, AuthTokenResponsePassword, createClient, SupabaseClient, UserResponse } from "@supabase/supabase-js";
import Footer from "../../assets/components/footer";
import Header from "../../assets/components/header";

import "./login.css"
import { notify } from "../../assets/components/notification";
import { FormEvent, useEffect, useState } from "react";

const SUPABASE_ID = "iumlpfiybqlkwoscrjzt"
const SUPABASE_DATABASE_URL = `https://${SUPABASE_ID}.supabase.co`
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1bWxwZml5YnFsa3dvc2Nyanp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxNTEyOTEsImV4cCI6MjA1NzcyNzI5MX0.jXIG6uxnvxAhbPDsKuTnFwa9-3fh8odQwYcV0ffQLeE"


const supabase = createClient(SUPABASE_DATABASE_URL, SUPABASE_ANON_KEY)
import { hide_icon, show_icon } from "../../assets/consts";

export default function LoginPage() {
    function Login() {
        async function login(e: FormEvent) {
            e.preventDefault()
            console.log("Attempting sign in...")
    
            if (!supabase) {
                return;
            }
            const email = (document.getElementById("email") as HTMLInputElement).value
            const password = (document.getElementById("password") as HTMLInputElement).value
    
    
            let signInResponse: AuthTokenResponsePassword | undefined = await supabase.auth.signInWithPassword({
                email,
                password
            })
            /**
             * Credentials invalid for some reason or another,
             * could be because either:
             *  - The account doesn't exist.
             *  - The password is incorrect.
             * Either way we try to create an account with the given
             * email to determine which of these cases we have.
             */
            if (signInResponse?.error) { 
                let signUpResponse = await supabase?.auth.signUp({
                    email,
                    password
                })
    
                if (signUpResponse.error || !signUpResponse.data.session) {
                    console.error("Password incorrect!")
                    setError("Password incorrect!")
                } else {
                    console.log("Created account successfully!")
                    history.back()
                }
            } else {
                console.log(signInResponse?.data)
                console.log("Signed in successfully!")
                history.back()
            }
        }
    
        const [showPass, setShowPass] = useState(false)
        const [error, setError] = useState<string | null>(null)
    
        return (
            <div className="login-box">
                <form className="login-form">
                    <h1>Welcome!</h1> <br/>
                    <label>Email</label> <br/>
                    <input id="email" type="text" placeholder="you@are.gay"/> <br/><br/>
                    <label>Password</label>
                    <input 
                        id="password" 
                        autoComplete="current-password" 
                        type={showPass ? "text" : "password"} 
                        placeholder="********"/>
                    <div className="under-password">
                        <img onClick={()=>{setShowPass(!showPass)}} src={showPass ? show_icon : hide_icon}/>
                        <p onClick={forgotNotImplemented} id="forgot-password">I forgot my password</p>
                    </div>
                    
                    <button onClick={login} id="submit">Sign Up / Sign In</button>
                    <p className="login-error">{error}</p>
                </form>
            </div>
        )
    }

    function LoggedIn() {
        const authStorageString = localStorage.getItem(`sb-${SUPABASE_ID}-auth-token`)
        if (!authStorageString) {
            console.error("You cannot display logged in component while logged out")
            return
        }
        const authStorage: AuthSession = JSON.parse(authStorageString)
        const email = authStorage.user.user_metadata.email;

        return (
            <div className="login-box">
                <h1>Hi again!</h1>
                <p id="already-logged-in">
                    You're already logged in as {email}! Did you want to log out?
                </p>
                <button id="logout" onClick={logOut}>Log out</button>
            </div>
        )
    }

    async function updateLoggedIn() {
        const response: UserResponse = await supabase?.auth.getUser();
        if (response?.data.user == null) {
            setLoggedIn(false);
        } else {
            setLoggedIn(true)
        }
    }

    function logOut() {
        supabase?.auth.signOut()
        console.log("Logged out")
    }

    supabase.auth.onAuthStateChange((event, session) => {
        setLoggedIn(session?.user != null)})

    const [loggedIn, setLoggedIn] = useState(false) 

    return (<><Header/><div className="content">
        {loggedIn ? <LoggedIn/> : <Login/>}
    </div><Footer/></>)
}

function forgotNotImplemented() {
    notify("This function isn't implemented yet, contact support for help!")
}