"use client";

import "./not-found.css";
import HomePage from "./page"
import {redirect} from "next/navigation";

export default function Page() {
    if (window.location.pathname !== "/") {redirect("/")}
    return (
        <HomePage/>
    );
}
