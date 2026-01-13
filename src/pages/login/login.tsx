import "./login.css"

import {FormEvent, useContext, useEffect, useRef, useState} from "react";
import {page_title} from "../../lib/consts.ts";
import {LoginContext} from "../../app";
import {forgotPassword, login, logout} from "../../lib/auth";
import {NotificationsContext} from "../../components/notification/lib";
import Page from "../../components/page/page";

export default function LoginPage() {
    const {loggedIn, loading} = useContext(LoginContext)

    return (<Page
        title={page_title + "- Login"}
        noindex={true}
        canonical="https://thisshopissogay.com/login"
        loadCondition={!loading}
    >
        {loggedIn ? <LoggedIn/> : <Login/>}
    </Page>)
}

export function Login() {
    async function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        try {
            await login(email, password)
        } catch (e: any) {
            setError(e.message);
            return
        }

        // At this stage, login was successful, and we go back to
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
                    <button
                        className="show-password"
                        onClick={(e) => {
                            e.preventDefault();
                            setShowPassword(!showPassword)
                        }}
                        type="button"
                    >
                        {showPassword ? <i className="fi fi-ss-eye"/> : <i className="fi fi-ss-eye-crossed"/>}
                    </button>
                    <p onClick={() => {
                        forgotPassword(notify)
                    }} id="forgot-password">I forgot my password</p>
                </div>

                <input type="submit" id="submit" value={"Sign Up / Sign In"} />
                <p className="login-error">{error}</p>
            </form>
        </div>
    )
}

export function LoggedIn() {
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