'use client'
import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3001");

const App = () => {
    const [tickers, setTickers] = useState([]);
    const [data, setData] = useState([]);

    useEffect(() => {
        // Listen for IEX and Forex data updates
        socket.on("iex", (message) => {
            console.log("IEX Data:", message);
            setData((prevData) => [...prevData, message]);
        });

        socket.on("forex", (message) => {
            console.log("Forex Data:", message);
            setData((prevData) => [...prevData, message]);
        });

        return () => {
            socket.off("iex");
            socket.off("forex");
        };
    }, []);

    const handleSubscribe = () => {
        // Subscribe to the tickers the user wants
        socket.emit("subscribe", tickers);
    };

    const handleChangeTickers = (e) => {
        setTickers(e.target.value.split(","));
    };

    return (
        <div>
            <h1>Tiingo Real-Time Data</h1>
            <input
                type="text"
                value={tickers.join(",")}
                onChange={handleChangeTickers}
                placeholder="Enter tickers (comma-separated)"
            />
            <button onClick={handleSubscribe}>Subscribe</button>

            <div>
                <h2>Data:</h2>
                <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
        </div>
    );
};

export default App;
