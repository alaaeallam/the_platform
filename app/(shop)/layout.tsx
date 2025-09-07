
import Footer from '@/components/footer'
import Header from '@/components/header'
import React, { ReactNode } from 'react'

export default function Layout({children}:{children:ReactNode}){
    return <div>
        <Header/>
        {children}
        <Footer/>
        </div>
}