import { createContext } from "react"
import { User } from "@supabase/supabase-js"
import { supabase } from "./supabaseRPC"
import { triggerLogin, triggerSignUp } from "./analytics/analytics"

export const LoginContext = createContext<{
  loading: boolean
  loggedIn: boolean
  user: User | null
  permissions: string[]
}>({
  loading: true,
  loggedIn: false,
  user: null,
  permissions: []
})

export function forgotPassword(notify: (msg: string) => void) {
    notify("This function isn't implemented yet, contact support for help!")
}

export async function logout() {
    const res = await supabase.auth.signOut()
    if (res.error) throw res.error
}

export async function login(email: string, password: string) {
    // Attempt sign in
    let signInResponse = await supabase.auth.signInWithPassword({email, password})

    /* Credentials invalid for some reason or another, could be because either:
        *  - CASE 1: The password is incorrect.
        *  - CASE 2: The account doesn't exist.
        * Either way we try to create an account with the given email to determine
        * which of these cases we have since the returned error doesn't reveal that.
    */
    if (signInResponse.error) { 
        // Attempt sign up
        let signUpResponse = await supabase.auth.signUp({email, password})
        
        // CASE 1: Sign up fail: Account already exists, password incorrect.
        if (signUpResponse.error) {
            throw new Error(signUpResponse.error.message)
        } else {
          // CASE 2: Sign up success: New account created, logged in. Trigger GA4 Event.
          triggerSignUp("Email")
          return
        }
    }
    // Credentials valid. User is logged in
    triggerLogin("Email")
}

export async function getJWTToken() {
  // Get Access Token
  const {data: { session }, error: sessionError} = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    // Not Logged In
    return;
  }

  // Confirm its still valid
  {const {data: {user}, error: sessionError} = await supabase.auth.getUser()
  if (sessionError || !user) {
    // Invalid Session
    return
  }}

  return session.access_token
}