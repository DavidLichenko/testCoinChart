'use client'
import React, {useEffect, useState} from 'react';
import {OrderHistoryTable} from "@/components/OrderHistoryTable";
import {getOrders} from "@/actions/form";


const Page = () => {
    const [orders, setOrders] = useState([])
    const fetchOrders = async () => {
        const data = await getOrders()
        setOrders(data)
    }

    useEffect(() => {
        fetchOrders()
    }, [])


    return (
        <div className="container mx-auto p-4">
            <OrderHistoryTable data={orders} refreshOrders={async () => {
               
            }}/>

        </div>
    );
};

export default Page;