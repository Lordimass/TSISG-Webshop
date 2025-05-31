import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "../home/home";
import Header from "../../assets/components/header";
import Footer from "../../assets/components/footer";
import { getUser } from "../../assets/utils";
import { analytics_icon, order_icon, product_icon, refund_icon, user_icon } from "../../assets/consts";

import "./css/staff.css"
import { OrderManager } from "./tabs/orders";

const hierarchy: string[] = ["staff", "manager", "superuser"]

type tab = {
    // The name of the tab to display
    name: string
    // The address of the icon for the tab
    icon?: string
    // The minimum rank of the user to view tab 
    minimum_access: number
}

let currentTab: tab|null = null; 

// Mapping tabs to icon and access rights
// min access -1 is a disabled tab
const tabs: tab[] = [
    {
        name: "Order Manager",
        minimum_access: 0,
        icon: order_icon
    },
    {
        name: "Edit Products",
        minimum_access: -1,
        icon: product_icon
    },
    {
        name: "Refunds",
        minimum_access: -1,
        icon: refund_icon
    },
    {
        name: "Analytics",
        minimum_access: -1,
        icon: analytics_icon
    },
    {
        name: "Staff Role Manager",
        minimum_access: -1,
        icon: user_icon
    }
]

export default function Staff() {
    async function checkUser() {
        let getUserResponse: User | null = await getUser()
        if (!getUserResponse) {
            setUserRank(-1)
        } else {
            if (hierarchy.includes(getUserResponse.app_metadata.role)) {
                setUserRank(hierarchy.indexOf(getUserResponse.app_metadata.role))
            } else {
                setUserRank(-1)
            }
        }
    }

    /**
     * Rank -1 means customer rank or logged out, anything else is the index
     * of the rank in hierarchy
     */
    const [userRank, setUserRank] = useState(-1);


    supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
            checkUser()
        } 
    }) // If auth state changes, reauthorise user.

    useEffect(() => {checkUser()}, []) 

    return (<><Header/><div className="content" id="staff-portal-content">
        {
            userRank == -1 ? 
            <NotLoggedIn/> : 
            <StaffPageContent userRank={userRank}/>
        }
        </div><Footer/></>)
}

function NotLoggedIn() {
    return (
        <div className="login-box">
            <p style={{textAlign: "center"}}>
                You're not logged in to an account with access to this page.
                If you believe this is a mistake, first, <a href="/login">check that you're logged in</a>.
                Failing this, contact support and we can help you out!
            </p>
        </div>
    )
}

function StaffPageContent({userRank}: {userRank: number}) {
    return (<>
        <SideBar userRank={userRank}/>
        <div className="staff-page-content">
            {
                currentTab ?
                <p>No Tab</p> :
                <OrderManager/>
            }
        </div>
    </>)
}

function SideBar({userRank}: {userRank: number}) {
    const accessibleTabs = tabs.filter(
        (tab) => userRank>tab.minimum_access && tab.minimum_access!=-1
    )
    return (
    <div className="sidebar">
        {accessibleTabs.map(tab => {return <TabButton tabType={tab} key={tab.name}/>})}
    </div>
    )
}

function TabButton({tabType}: {tabType: tab}) {
    function onClick() {
        currentTab = tabType
    }
    return <div className="tab-button" id={tabType.name} title={tabType.name} onClick={onClick}>
        <img src={tabType.icon}/>
    </div>
}

