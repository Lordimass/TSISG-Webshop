import { AuthSession, AuthTokenResponsePassword, createClient, SupabaseClient, UserResponse } from "@supabase/supabase-js";
import Footer from "../../assets/components/footer";
import Header from "../../assets/components/header";

import "./login.css"
import { FormEvent, useContext, useEffect, useState } from "react";
import { supabase, SUPABASE_ID } from "../home/home";
import { getLoggedIn } from "../../assets/utils";
import { hide_icon, show_icon } from "../../assets/consts";
import { NotificationsContext } from "../../app";

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
                // Attempt sign up
                let signUpResponse = await supabase?.auth.signUp({
                    email,
                    password
                })
                
                // CASE 2: If signup fails, the account must already exist and
                // the password is incorrect.
                if (signUpResponse.error || !signUpResponse.data.session) {
                    console.log("Password incorrect!")
                    setError("Password incorrect!")

                // CASE 1: If this works then they didn't have
                // an account in the first place and so can now sign up
                } else {
                    console.log("Created account successfully!")
                    history.back()
                }
            /**
             * Credentials are valid, navigate back to return to the
             * action they were trying to complete.
             */
            } else {
                console.log(signInResponse?.data)
                console.log("Signed in successfully!")
                history.back()
            }
        }
    
        const [showPass, setShowPass] = useState(false)
        const [error, setError] = useState<string | null>(null)
        const {notify} = useContext(NotificationsContext)
    
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
                        <p onClick={() => {forgotNotImplemented(notify)}} id="forgot-password">I forgot my password</p>
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


    async function logOut() {
        const res = await supabase.auth.signOut()
        console.log("Logged out: " + res)
        setLoggedIn(false)
    }

    supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN") {
            setLoggedIn(true);
        } else if (event === "SIGNED_OUT") {
            setLoggedIn(false)
        }
    })

    const [loggedIn, setLoggedIn] = useState(false) 

    useEffect(()=>{
        const checkLoginStatus = async () => {
            console.log("Checking if user is logged in")
            const isLoggedIn = await getLoggedIn();
            console.log(isLoggedIn)
            setLoggedIn(isLoggedIn)
        }
        checkLoginStatus()
    },[])

    return (<><Header/><div className="content">
        {loggedIn ? <LoggedIn/> : <Login/>}
    </div><Footer/></>)
}

function forgotNotImplemented(notify: (msg: string) => void) {
    notify("This function isn't implemented yet, contact support for help!")
}

