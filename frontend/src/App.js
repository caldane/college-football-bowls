import React, { useEffect, useState } from "react";
import BowlList from "./components/BowlList/BowlList";
import UserList from "./components/UserList/UserList";
import CacheDate from "./components/CacheDate/CacheDate";

function App() {
    const [bowls, setBowls] = useState([]);

    useEffect(() => {
        const fetchBowls = async () => {
            try {
                const response = await fetch("/api/bowls");
                const data = await response.json();
                console.log("Fetched bowl games:", data);
                setBowls(data);
            } catch (error) {
                console.error("Error fetching bowl games:", error);
            }
        };

        fetchBowls();
    }, []);

    return (
        <>
            <header className="site-header">
                <h1>2025 College Football Postseason Bowl Games & CFP</h1>
                <p>Including team logos and regular-season records</p>
                <CacheDate cacheDate={bowls.cacheDate} />
            </header>
            <main>
                <UserList users={bowls.users} />
                <BowlList bowls={bowls.games} />
            </main>
        </>
    );
}

export default App;
