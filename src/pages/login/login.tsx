import Footer from "../../components/header-footer/footer";
import Header from "../../components/header-footer/header";

import "./login.css"
import { FormEvent, useContext, useState } from "react";
import { hide_icon, page_title, password_incorrect_msg, show_icon } from "../../lib/consts";
import { LoginContext } from "../../app";
import { NotificationsContext } from "../../components/notification/notification";
import { forgotPassword, login, logout } from "../../lib/auth";
import Throbber from "../../components/throbber/throbber";

export default function LoginPage() {
    const {loggedIn, loading} = useContext(LoginContext)

    return (<><Header/><div className="content login-content">
        <title>{page_title} - Login</title>
        <meta name="robots" content="noindex"/>
        <link rel='canonical' href='https://thisshopissogay.com/login'/>

        {loading ? <Throbber/> : loggedIn ? <LoggedIn/> : <Login/>}
    </div><Footer/></>)
}

function Login() {
    async function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        try {login(email, password)}

        // Something went wrong logging in
        catch (e: unknown) {
            // Password was incorrect
            if (e === password_incorrect_msg) {setError(e); return}
            // Something else went wrong
            else {
                console.error(e);
                setError("Something went wrong! Try again later");
                return;
            }
        };

        // At this stage, login was successful and we go back to
        // whatever the user was doing that needed logging in.
        history.back()
    }

    const [email, setEmail] = useState<string>("")
    const [password, setPassword] = useState<string>("")

    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const {notify} = useContext(NotificationsContext)

    return (
        <div className="login-box">
            <form className="login-form" onSubmit={handleFormSubmit}>
                <h1>Welcome!</h1> <br/>
                <label>
                    Email
                    <input 
                        id="email" 
                        type="text" 
                        placeholder="you@are.gay" 
                        autoComplete="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />    
                </label><br/><br/>

                <label>
                    Password
                    <input 
                        id="password" 
                        autoComplete="current-password new-password" 
                        type={showPassword ? "text" : "password"} 
                        placeholder="********"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </label>

                <div className="under-password">
                    <img onClick={()=>{setShowPassword(!showPassword)}} src={showPassword ? show_icon : hide_icon}/>
                    <p onClick={() => {forgotPassword(notify)}} id="forgot-password">I forgot my password</p>
                </div>
                
                <input type="submit" id="submit" value={"Sign Up / Sign In"}/>
                <p className="login-error">{error}</p>
            </form>
        </div>
    )
}

function LoggedIn() {
    const {user} = useContext(LoginContext)
    if (!user) throw new Error("No user found, are you logged in?")
    const email = user.email;

    return (
        <div className="login-box">
            <h1>Hi again!</h1>
            <p id="already-logged-in">
                You're already logged in as {email}! Did you want to log out?
            </p>
            <button id="logout" onClick={logout}>Log out</button>
        </div>
    )
}